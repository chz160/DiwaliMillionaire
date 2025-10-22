import { Component, signal, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionsService, Question } from './questions.service';
import { LifelineService, LifelineState, AudienceVote, PhoneFriendHint } from './lifeline.service';
import { PrizeLadderService, PrizeLadderLevel } from './prize-ladder.service';
import { GameResultService } from './game-result.service';
import { GameSessionResult, AnsweredQuestion } from './game-session-result.model';
import { GameSummaryComponent } from './game-summary.component';
import { environment } from '../environments/environment';
import { GameStatePersistenceService, GameState } from './game-state-persistence.service';
import { GameUrlService } from './game-url.service';

interface MoneyLevel {
  amount: string;
  reached: boolean;
  current: boolean;
  isCheckpoint: boolean;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, GameSummaryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, AfterViewInit {
  private questionsService = inject(QuestionsService);
  private lifelineService = inject(LifelineService);
  private prizeLadderService = inject(PrizeLadderService);
  private gameResultService = inject(GameResultService);
  private persistenceService = inject(GameStatePersistenceService);
  private urlService = inject(GameUrlService);
  
  @ViewChild('moneyLadderLevels') moneyLadderLevels?: ElementRef<HTMLDivElement>;
  
  protected readonly title = signal('Who Wants To Be Diwali Millionaire');
  protected readonly version = environment.version;
  
  // Current game key for persistence
  private currentGameKey = signal<string | null>(null);
  
  currentQuestionIndex = signal(0);
  gameStarted = signal(false);
  gameOver = signal(false);
  selectedAnswer = signal<number | null>(null);
  answeredCorrectly = signal(false);
  
  questions = signal<Question[]>([]);
  
  // Session result for summary screen
  sessionResult = signal<GameSessionResult | null>(null);
  
  // Track answered questions for the session
  answeredQuestions = signal<AnsweredQuestion[]>([]);
  
  // Lifeline state
  lifelinesUsed = signal<LifelineState>({
    fiftyFifty: false,
    askAudience: false,
    phoneFriend: false
  });
  
  // Lifeline effects
  removedOptions = signal<number[]>([]);
  audienceVotes = signal<AudienceVote[] | null>(null);
  phoneFriendHint = signal<PhoneFriendHint | null>(null);
  
  moneyLadder = signal<MoneyLevel[]>([]);
  
  ngOnInit() {
    // Check for existing game session in URL
    const gameKeyFromUrl = this.urlService.getGameKeyFromUrl();
    
    if (gameKeyFromUrl) {
      // Try to restore saved session
      this.restoreGameSession(gameKeyFromUrl);
    } else {
      // No saved session, load questions normally
      this.questionsService.loadQuestions().subscribe(questions => {
        const selectedQuestions = this.questionsService.selectQuestionsWithProgression(questions);
        this.questions.set(selectedQuestions);
      });
    }
    
    // Initialize money ladder from prize ladder service
    this.initializeMoneyLadder();
  }
  
  ngAfterViewInit() {
    // Scroll to the first level when view is initialized
    this.scrollToCurrentLevel();
  }
  
  private initializeMoneyLadder() {
    const levels = this.prizeLadderService.getLevels();
    const moneyLevels: MoneyLevel[] = levels
      .map((level, index) => ({
        amount: level.prize,
        reached: false,
        current: index === 0, // First question is current initially
        isCheckpoint: level.isCheckpoint
      }))
      .reverse(); // Reverse to show highest prize at top
    
    this.moneyLadder.set(moneyLevels);
  }
  
  startGame() {
    this.gameStarted.set(true);
    this.currentQuestionIndex.set(0);
    this.gameOver.set(false);
    this.updateMoneyLadder();
    
    // Generate new game key and save initial state
    const gameKey = this.persistenceService.generateGameKey();
    this.currentGameKey.set(gameKey);
    this.urlService.setGameKeyInUrl(gameKey);
    
    // Create and save initial game state
    const initialState = this.persistenceService.createInitialState(
      gameKey,
      this.questions()
    );
    this.persistenceService.scheduleSave(initialState);
  }
  
  selectAnswer(index: number) {
    if (this.selectedAnswer() !== null) return;
    this.selectedAnswer.set(index);
    
    setTimeout(() => {
      const currentQuestion = this.questions()[this.currentQuestionIndex()];
      const isCorrect = index === currentQuestion.correctAnswer;
      this.answeredCorrectly.set(isCorrect);
      
      // Record the answered question
      const questionIndex = this.currentQuestionIndex();
      const answeredQuestion: AnsweredQuestion = {
        questionId: currentQuestion.id,
        correct: isCorrect,
        chosenOption: index,
        correctOption: currentQuestion.correctAnswer,
        difficulty: currentQuestion.difficulty,
        question: currentQuestion.question,
        options: currentQuestion.options,
        prize: this.prizeLadderService.getPrizeForQuestion(questionIndex + 1)
      };
      
      this.answeredQuestions.update(prev => [...prev, answeredQuestion]);
      
      // Save state after answering
      this.saveCurrentState();
      
      if (isCorrect) {
        // Mark current level as reached
        const ladder = this.moneyLadder();
        const currentLevel = ladder.length - 1 - this.currentQuestionIndex();
        ladder[currentLevel].reached = true;
        this.moneyLadder.set([...ladder]);
        setTimeout(() => this.nextQuestion(), 1500);
      } else {
        // Wrong answer - end game
        setTimeout(() => this.endGameWithReason('WRONG'), 1500);
      }
    }, 1000);
  }
  
  nextQuestion() {
    const nextIndex = this.currentQuestionIndex() + 1;
    if (nextIndex < this.questions().length) {
      this.currentQuestionIndex.set(nextIndex);
      this.selectedAnswer.set(null);
      this.answeredCorrectly.set(false);
      this.clearLifelineEffects();
      this.updateMoneyLadder();
      
      // Save state when moving to next question
      this.saveCurrentState();
    } else {
      // All questions answered correctly - WIN!
      const ladder = this.moneyLadder();
      const finalLevel = ladder.length - 1 - this.currentQuestionIndex();
      ladder[finalLevel].reached = true;
      this.moneyLadder.set([...ladder]);
      this.endGameWithReason('WIN');
    }
  }
  
  updateMoneyLadder() {
    const ladder = this.moneyLadder();
    const currentLevel = ladder.length - 1 - this.currentQuestionIndex();
    
    this.moneyLadder.set(ladder.map((level, index) => ({
      ...level,
      current: index === currentLevel,
      // Levels with higher index (lower amounts) that we've passed are reached
      reached: index > currentLevel || level.reached
    })));
    
    // Scroll to the current level after updating the ladder
    setTimeout(() => this.scrollToCurrentLevel(), 0);
  }
  
  private scrollToCurrentLevel() {
    if (!this.moneyLadderLevels) return;
    
    const container = this.moneyLadderLevels.nativeElement;
    const currentLevelElement = container.querySelector('.money-level.current') as HTMLElement;
    
    if (currentLevelElement) {
      const containerHeight = container.clientHeight;
      const elementTop = currentLevelElement.offsetTop;
      const elementHeight = currentLevelElement.offsetHeight;
      
      // Scroll to position the current element near the center of the container
      const scrollPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);
      
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  }
  
  endGame() {
    this.gameOver.set(true);
  }
  
  endGameWithReason(reason: 'WIN' | 'WRONG' | 'WALK_AWAY' | 'TIMEOUT') {
    // Create session result
    const result = this.gameResultService.createSessionResult(
      reason,
      this.currentQuestionIndex(),
      this.answeredQuestions(),
      this.lifelinesUsed(),
      this.questions().length
    );
    
    this.sessionResult.set(result);
    this.gameOver.set(true);
    
    // Emit analytics event
    this.emitAnalyticsEvent(result);
  }
  
  private emitAnalyticsEvent(result: GameSessionResult) {
    // This would integrate with an actual analytics service
    // For now, just log to console
    const stats = this.gameResultService.getStatistics(result);
    console.log('Game End Analytics:', {
      end_reason: result.endReason,
      final_prize: result.finalPrize,
      highest_question: stats.highestQuestion,
      lifelines_used: result.usedLifelines,
      accuracy: stats.accuracy,
      timestamp: result.timestamp
    });
  }
  
  walkAway() {
    // Player chooses to walk away with current prize
    this.endGameWithReason('WALK_AWAY');
  }
  
  resetGame() {
    this.gameStarted.set(false);
    this.gameOver.set(false);
    this.currentQuestionIndex.set(0);
    this.selectedAnswer.set(null);
    this.answeredCorrectly.set(false);
    this.answeredQuestions.set([]);
    this.sessionResult.set(null);
    this.resetLifelines();
    this.initializeMoneyLadder();
    this.gameResultService.clearResult();
    
    // Clear game key and URL
    const gameKey = this.currentGameKey();
    if (gameKey) {
      // Delete saved state
      this.persistenceService.deleteState(gameKey).catch(error => {
        console.error('Failed to delete game state:', error);
      });
    }
    this.currentGameKey.set(null);
    this.urlService.removeGameKeyFromUrl();
  }
  
  getCurrentQuestion(): Question | null {
    const questions = this.questions();
    const index = this.currentQuestionIndex();
    return index < questions.length ? questions[index] : null;
  }
  
  getCurrentPrize(): string {
    const questionsAnswered = this.currentQuestionIndex();
    const answeredCorrectly = this.answeredCorrectly();
    
    // If we answered the last question correctly, return the prize for that question
    // Otherwise, return the guaranteed prize (checkpoint logic)
    if (answeredCorrectly && questionsAnswered >= this.questions().length) {
      // Won the game - return the final prize
      return this.prizeLadderService.getCurrentPrize(questionsAnswered);
    } else if (!answeredCorrectly && this.gameOver()) {
      // Answered incorrectly - return guaranteed prize based on checkpoints
      return this.prizeLadderService.getGuaranteedPrize(
        questionsAnswered + 1, // Current question number (1-based)
        questionsAnswered // Questions answered correctly so far
      );
    } else {
      // Walking away or still playing - return current prize
      return this.prizeLadderService.getCurrentPrize(questionsAnswered);
    }
  }
  
  // Lifeline methods
  
  useFiftyFifty() {
    if (this.lifelinesUsed().fiftyFifty || this.selectedAnswer() !== null) return;
    
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;
    
    const toRemove = this.lifelineService.useFiftyFifty(currentQuestion);
    this.removedOptions.set(toRemove);
    this.lifelinesUsed.update(state => ({ ...state, fiftyFifty: true }));
    
    // Save state after using lifeline
    this.saveCurrentState();
  }
  
  useAskAudience() {
    if (this.lifelinesUsed().askAudience || this.selectedAnswer() !== null) return;
    
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;
    
    const votes = this.lifelineService.useAskAudience(currentQuestion);
    this.audienceVotes.set(votes);
    this.lifelinesUsed.update(state => ({ ...state, askAudience: true }));
    
    // Save state after using lifeline
    this.saveCurrentState();
  }
  
  usePhoneFriend() {
    if (this.lifelinesUsed().phoneFriend || this.selectedAnswer() !== null) return;
    
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;
    
    const hint = this.lifelineService.usePhoneFriend(currentQuestion);
    this.phoneFriendHint.set(hint);
    this.lifelinesUsed.update(state => ({ ...state, phoneFriend: true }));
    
    // Save state after using lifeline
    this.saveCurrentState();
  }
  
  resetLifelines() {
    this.lifelinesUsed.set({
      fiftyFifty: false,
      askAudience: false,
      phoneFriend: false
    });
    this.clearLifelineEffects();
  }
  
  clearLifelineEffects() {
    this.removedOptions.set([]);
    this.audienceVotes.set(null);
    this.phoneFriendHint.set(null);
  }
  
  isOptionRemoved(index: number): boolean {
    return this.removedOptions().includes(index);
  }
  
  getAudienceVotePercentage(index: number): number {
    const votes = this.audienceVotes();
    if (!votes) return 0;
    const vote = votes.find(v => v.optionIndex === index);
    return vote ? vote.percentage : 0;
  }

  /**
   * Save current game state to persistence
   */
  private saveCurrentState(): void {
    const gameKey = this.currentGameKey();
    if (!gameKey || this.gameOver()) {
      return; // Don't save if no game key or game is over
    }

    const state: GameState = {
      schemaVersion: 1,
      gameKey,
      currentQuestionIndex: this.currentQuestionIndex(),
      selectedQuestionIds: this.questions().map(q => q.id),
      questions: this.questions(),
      lifelinesUsed: this.lifelinesUsed(),
      removedOptions: this.removedOptions(),
      audienceVotesActive: this.audienceVotes() !== null,
      phoneFriendActive: this.phoneFriendHint() !== null,
      answeredQuestions: this.answeredQuestions().map(aq => ({
        questionId: aq.questionId,
        correct: aq.correct,
        chosenOption: aq.chosenOption,
        correctOption: aq.correctOption
      })),
      timerStartTime: null,
      timerDuration: null,
      soundEnabled: true,
      lastSaved: Date.now()
    };

    this.persistenceService.scheduleSave(state);
  }

  /**
   * Restore game session from saved state
   */
  private async restoreGameSession(gameKey: string): Promise<void> {
    try {
      const savedState = await this.persistenceService.loadState(gameKey);
      
      if (savedState) {
        // Restore game state
        this.currentGameKey.set(gameKey);
        this.questions.set(savedState.questions);
        this.currentQuestionIndex.set(savedState.currentQuestionIndex);
        this.lifelinesUsed.set(savedState.lifelinesUsed);
        this.removedOptions.set(savedState.removedOptions);
        
        // Restore answered questions (convert back to AnsweredQuestion format)
        const restoredAnswers: AnsweredQuestion[] = savedState.answeredQuestions.map(aq => ({
          questionId: aq.questionId,
          correct: aq.correct,
          chosenOption: aq.chosenOption,
          correctOption: aq.correctOption,
          difficulty: savedState.questions.find(q => q.id === aq.questionId)?.difficulty || 'Unknown',
          question: savedState.questions.find(q => q.id === aq.questionId)?.question || '',
          options: savedState.questions.find(q => q.id === aq.questionId)?.options || [],
          prize: this.prizeLadderService.getPrizeForQuestion(aq.questionId)
        }));
        this.answeredQuestions.set(restoredAnswers);
        
        // Start the game in the restored state
        this.gameStarted.set(true);
        this.gameOver.set(false);
        this.updateMoneyLadder();
        
        console.log('Game session restored successfully');
      } else {
        // No saved state found, start fresh
        console.log('No saved state found for game key:', gameKey);
        this.urlService.removeGameKeyFromUrl();
        this.loadFreshQuestions();
      }
    } catch (error) {
      console.error('Failed to restore game session:', error);
      this.urlService.removeGameKeyFromUrl();
      this.loadFreshQuestions();
    }
  }

  /**
   * Load fresh questions when no saved state exists
   */
  private loadFreshQuestions(): void {
    this.questionsService.loadQuestions().subscribe(questions => {
      const selectedQuestions = this.questionsService.selectQuestionsWithProgression(questions);
      this.questions.set(selectedQuestions);
    });
  }
}
