import { Injectable, inject } from '@angular/core';
import { PrizeLadderService } from './prize-ladder.service';
import { GameSessionResult, AnsweredQuestion } from './game-session-result.model';
import { LifelineState } from './lifeline.service';

/**
 * Service for managing game results and calculating final prizes
 */
@Injectable({
  providedIn: 'root'
})
export class GameResultService {
  private prizeLadderService = inject(PrizeLadderService);
  private currentResult: GameSessionResult | null = null;

  /**
   * Calculate the final prize based on the end reason and game state
   * 
   * @param endReason Why the game ended
   * @param currentQuestionIndex Current question index (0-based)
   * @param questionsAnsweredCorrectly Number of questions answered correctly
   * @param totalQuestions Total questions in the game
   * @returns Final prize amount
   */
  calculateFinalPrize(
    endReason: 'WIN' | 'WRONG' | 'WALK_AWAY' | 'TIMEOUT',
    currentQuestionIndex: number,
    questionsAnsweredCorrectly: number,
    totalQuestions: number
  ): string {
    switch (endReason) {
      case 'WIN':
        // Won the game - return the top prize
        return this.prizeLadderService.getCurrentPrize(totalQuestions);
      
      case 'WRONG':
      case 'TIMEOUT':
        // Wrong answer or timeout - return guaranteed prize based on checkpoints
        // Current question number is the one being attempted (1-based)
        return this.prizeLadderService.getGuaranteedPrize(
          currentQuestionIndex + 1,
          questionsAnsweredCorrectly
        );
      
      case 'WALK_AWAY':
        // Walking away - return prize for last question answered correctly
        return this.prizeLadderService.getCurrentPrize(questionsAnsweredCorrectly);
      
      default:
        return '$0';
    }
  }

  /**
   * Create a game session result object
   */
  createSessionResult(
    endReason: 'WIN' | 'WRONG' | 'WALK_AWAY' | 'TIMEOUT',
    currentQuestionIndex: number,
    answeredQuestions: AnsweredQuestion[],
    usedLifelines: LifelineState,
    totalQuestions: number
  ): GameSessionResult {
    const questionsAnsweredCorrectly = answeredQuestions.filter(q => q.correct).length;
    
    const lastAnsweredPrize = this.prizeLadderService.getCurrentPrize(questionsAnsweredCorrectly);
    const lastCheckpointPrize = this.prizeLadderService.getGuaranteedPrize(
      currentQuestionIndex + 1,
      questionsAnsweredCorrectly
    );
    const finalPrize = this.calculateFinalPrize(
      endReason,
      currentQuestionIndex,
      questionsAnsweredCorrectly,
      totalQuestions
    );

    const result: GameSessionResult = {
      currentQuestionIndex,
      lastAnsweredPrize,
      lastCheckpointPrize,
      finalPrize,
      endReason,
      usedLifelines: {
        fiftyFifty: usedLifelines.fiftyFifty,
        askAudience: usedLifelines.askAudience,
        phoneFriend: usedLifelines.phoneFriend
      },
      answeredQuestions,
      totalQuestions,
      timestamp: Date.now()
    };

    this.currentResult = result;
    this.persistResult(result);
    
    return result;
  }

  /**
   * Get the current session result
   */
  getCurrentResult(): GameSessionResult | null {
    return this.currentResult;
  }

  /**
   * Clear the current session result
   */
  clearResult(): void {
    this.currentResult = null;
    this.clearPersistedResult();
  }

  /**
   * Persist result to session storage
   */
  private persistResult(result: GameSessionResult): void {
    try {
      sessionStorage.setItem('gameResult', JSON.stringify(result));
    } catch (error) {
      console.error('Failed to persist game result:', error);
    }
  }

  /**
   * Retrieve persisted result from session storage
   */
  getPersistedResult(): GameSessionResult | null {
    try {
      const stored = sessionStorage.getItem('gameResult');
      if (stored) {
        return JSON.parse(stored) as GameSessionResult;
      }
    } catch (error) {
      console.error('Failed to retrieve persisted game result:', error);
    }
    return null;
  }

  /**
   * Clear persisted result from session storage
   */
  private clearPersistedResult(): void {
    try {
      sessionStorage.removeItem('gameResult');
    } catch (error) {
      console.error('Failed to clear persisted game result:', error);
    }
  }

  /**
   * Calculate statistics for the game
   */
  getStatistics(result: GameSessionResult): {
    correctAnswers: number;
    totalAttempted: number;
    accuracy: number;
    highestQuestion: number;
  } {
    const correctAnswers = result.answeredQuestions.filter(q => q.correct).length;
    const totalAttempted = result.answeredQuestions.length;
    const accuracy = totalAttempted > 0 ? (correctAnswers / totalAttempted) * 100 : 0;
    const highestQuestion = correctAnswers; // Highest question cleared (1-based)

    return {
      correctAnswers,
      totalAttempted,
      accuracy: Math.round(accuracy),
      highestQuestion
    };
  }

  /**
   * Get a user-friendly headline for the result
   */
  getHeadline(result: GameSessionResult): string {
    switch (result.endReason) {
      case 'WIN':
        return `🎉 You Won ${result.finalPrize}! 🎉`;
      case 'WALK_AWAY':
        return `💰 You Walked Away with ${result.finalPrize}!`;
      case 'WRONG':
      case 'TIMEOUT':
        if (result.finalPrize === '$0') {
          return 'Game Over';
        } else {
          return `Game Over – ${result.finalPrize} Secured`;
        }
      default:
        return 'Game Over';
    }
  }

  /**
   * Get a description of why the game ended
   */
  getEndReasonDescription(endReason: 'WIN' | 'WRONG' | 'WALK_AWAY' | 'TIMEOUT'): string {
    switch (endReason) {
      case 'WIN':
        return 'All Questions Answered Correctly';
      case 'WALK_AWAY':
        return 'Walked Away';
      case 'WRONG':
        return 'Incorrect Answer';
      case 'TIMEOUT':
        return 'Time Expired';
      default:
        return 'Unknown';
    }
  }
}
