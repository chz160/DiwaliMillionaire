import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionsService, Question } from './questions.service';
import { LifelineService, LifelineState, AudienceVote, PhoneFriendHint } from './lifeline.service';
import { environment } from '../environments/environment';

interface MoneyLevel {
  amount: string;
  reached: boolean;
  current: boolean;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private questionsService = inject(QuestionsService);
  private lifelineService = inject(LifelineService);
  
  protected readonly title = signal('Who Wants To Be Diwali Millionaire');
  protected readonly version = environment.version;
  
  currentQuestionIndex = signal(0);
  gameStarted = signal(false);
  gameOver = signal(false);
  selectedAnswer = signal<number | null>(null);
  answeredCorrectly = signal(false);
  
  questions = signal<Question[]>([]);
  
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
  
  moneyLadder = signal<MoneyLevel[]>([
    { amount: '₹10,00,000', reached: false, current: false },   // Q15
    { amount: '₹5,00,000', reached: false, current: false },    // Q14
    { amount: '₹2,50,000', reached: false, current: false },    // Q13
    { amount: '₹1,25,000', reached: false, current: false },    // Q12
    { amount: '₹80,000', reached: false, current: false },      // Q11
    { amount: '₹40,000', reached: false, current: false },      // Q10
    { amount: '₹20,000', reached: false, current: false },      // Q9
    { amount: '₹10,000', reached: false, current: false },      // Q8
    { amount: '₹5,000', reached: false, current: false },       // Q7
    { amount: '₹3,000', reached: false, current: false },       // Q6
    { amount: '₹2,000', reached: false, current: false },       // Q5
    { amount: '₹1,500', reached: false, current: false },       // Q4
    { amount: '₹1,000', reached: false, current: false },       // Q3
    { amount: '₹500', reached: false, current: false },         // Q2
    { amount: '₹0', reached: false, current: true }             // Q1
  ]);
  
  ngOnInit() {
    this.questionsService.loadQuestions().subscribe(questions => {
      const selectedQuestions = this.questionsService.selectQuestionsWithProgression(questions);
      this.questions.set(selectedQuestions);
    });
  }
  
  startGame() {
    this.gameStarted.set(true);
    this.currentQuestionIndex.set(0);
    this.gameOver.set(false);
    this.updateMoneyLadder();
  }
  
  selectAnswer(index: number) {
    if (this.selectedAnswer() !== null) return;
    this.selectedAnswer.set(index);
    
    setTimeout(() => {
      const currentQuestion = this.questions()[this.currentQuestionIndex()];
      if (index === currentQuestion.correctAnswer) {
        this.answeredCorrectly.set(true);
        // Mark current level as reached
        const ladder = this.moneyLadder();
        const currentLevel = ladder.length - 1 - this.currentQuestionIndex();
        ladder[currentLevel].reached = true;
        this.moneyLadder.set([...ladder]);
        setTimeout(() => this.nextQuestion(), 1500);
      } else {
        this.answeredCorrectly.set(false);
        setTimeout(() => this.endGame(), 1500);
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
    } else {
      // All questions answered correctly - mark final prize as reached
      const ladder = this.moneyLadder();
      const finalLevel = ladder.length - 1 - this.currentQuestionIndex();
      ladder[finalLevel].reached = true;
      this.moneyLadder.set([...ladder]);
      this.endGame();
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
  }
  
  endGame() {
    this.gameOver.set(true);
  }
  
  resetGame() {
    this.gameStarted.set(false);
    this.gameOver.set(false);
    this.currentQuestionIndex.set(0);
    this.selectedAnswer.set(null);
    this.answeredCorrectly.set(false);
    this.resetLifelines();
    this.moneyLadder.set(this.moneyLadder().map(level => ({
      ...level,
      current: false,
      reached: false
    })));
    this.moneyLadder.update(ladder => {
      ladder[ladder.length - 1].current = true;
      return [...ladder];
    });
  }
  
  getCurrentQuestion(): Question | null {
    const questions = this.questions();
    const index = this.currentQuestionIndex();
    return index < questions.length ? questions[index] : null;
  }
  
  getCurrentPrize(): string {
    const ladder = this.moneyLadder();
    const reached = ladder.filter(l => l.reached);
    // Return the highest prize reached (first in the filtered array since ladder is top-down)
    return reached.length > 0 ? reached[0].amount : '₹0';
  }
  
  // Lifeline methods
  
  useFiftyFifty() {
    if (this.lifelinesUsed().fiftyFifty || this.selectedAnswer() !== null) return;
    
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;
    
    const toRemove = this.lifelineService.useFiftyFifty(currentQuestion);
    this.removedOptions.set(toRemove);
    this.lifelinesUsed.update(state => ({ ...state, fiftyFifty: true }));
  }
  
  useAskAudience() {
    if (this.lifelinesUsed().askAudience || this.selectedAnswer() !== null) return;
    
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;
    
    const votes = this.lifelineService.useAskAudience(currentQuestion);
    this.audienceVotes.set(votes);
    this.lifelinesUsed.update(state => ({ ...state, askAudience: true }));
  }
  
  usePhoneFriend() {
    if (this.lifelinesUsed().phoneFriend || this.selectedAnswer() !== null) return;
    
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;
    
    const hint = this.lifelineService.usePhoneFriend(currentQuestion);
    this.phoneFriendHint.set(hint);
    this.lifelinesUsed.update(state => ({ ...state, phoneFriend: true }));
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
}
