import { Injectable } from '@angular/core';

export interface PrizeLadderLevel {
  questionNumber: number;
  prize: string;
  isCheckpoint: boolean;
}

export interface PrizeLadderConfig {
  levels: PrizeLadderLevel[];
}

@Injectable({
  providedIn: 'root'
})
export class PrizeLadderService {
  
  // Default prize ladder configuration matching the issue requirements
  private defaultConfig: PrizeLadderConfig = {
    levels: [
      { questionNumber: 1, prize: '$100', isCheckpoint: false },
      { questionNumber: 2, prize: '$200', isCheckpoint: false },
      { questionNumber: 3, prize: '$300', isCheckpoint: false },
      { questionNumber: 4, prize: '$500', isCheckpoint: false },
      { questionNumber: 5, prize: '$1,000', isCheckpoint: true },      // First checkpoint
      { questionNumber: 6, prize: '$2,000', isCheckpoint: false },
      { questionNumber: 7, prize: '$4,000', isCheckpoint: false },
      { questionNumber: 8, prize: '$8,000', isCheckpoint: false },
      { questionNumber: 9, prize: '$16,000', isCheckpoint: false },
      { questionNumber: 10, prize: '$32,000', isCheckpoint: true },    // Second checkpoint
      { questionNumber: 11, prize: '$64,000', isCheckpoint: false },
      { questionNumber: 12, prize: '$125,000', isCheckpoint: false },
      { questionNumber: 13, prize: '$250,000', isCheckpoint: false },
      { questionNumber: 14, prize: '$500,000', isCheckpoint: false },
      { questionNumber: 15, prize: '$1,000,000', isCheckpoint: false }
    ]
  };

  private config: PrizeLadderConfig;

  constructor() {
    this.config = this.defaultConfig;
  }

  /**
   * Set a custom prize ladder configuration
   */
  setConfig(config: PrizeLadderConfig): void {
    this.config = config;
  }

  /**
   * Get the prize ladder configuration
   */
  getConfig(): PrizeLadderConfig {
    return this.config;
  }

  /**
   * Get all levels in the prize ladder
   */
  getLevels(): PrizeLadderLevel[] {
    return this.config.levels;
  }

  /**
   * Get the prize for a specific question number (1-based)
   */
  getPrizeForQuestion(questionNumber: number): string {
    const level = this.config.levels.find(l => l.questionNumber === questionNumber);
    return level ? level.prize : '$0';
  }

  /**
   * Check if a question number is a checkpoint
   */
  isCheckpoint(questionNumber: number): boolean {
    const level = this.config.levels.find(l => l.questionNumber === questionNumber);
    return level ? level.isCheckpoint : false;
  }

  /**
   * Get the guaranteed prize when answering incorrectly at a given question number.
   * This is the prize at the last checkpoint passed, or $0 if no checkpoint passed.
   * 
   * @param currentQuestionNumber The question number being attempted (1-based)
   * @param questionsAnsweredCorrectly Number of questions answered correctly so far (0-based count)
   * @returns The guaranteed prize amount
   */
  getGuaranteedPrize(currentQuestionNumber: number, questionsAnsweredCorrectly: number): string {
    // If we haven't answered any questions correctly yet, prize is $0
    if (questionsAnsweredCorrectly === 0) {
      return '$0';
    }

    // Find the last checkpoint that was passed
    // A checkpoint is "passed" when we've correctly answered that question
    const lastCheckpoint = this.config.levels
      .filter(level => level.isCheckpoint && level.questionNumber <= questionsAnsweredCorrectly)
      .sort((a, b) => b.questionNumber - a.questionNumber)[0];

    return lastCheckpoint ? lastCheckpoint.prize : '$0';
  }

  /**
   * Get the current prize for walking away.
   * This is the prize for the last question answered correctly.
   * 
   * @param questionsAnsweredCorrectly Number of questions answered correctly (0-based count)
   * @returns The current prize amount
   */
  getCurrentPrize(questionsAnsweredCorrectly: number): string {
    if (questionsAnsweredCorrectly === 0) {
      return '$0';
    }

    // The prize for the last question answered correctly
    const level = this.config.levels.find(l => l.questionNumber === questionsAnsweredCorrectly);
    return level ? level.prize : '$0';
  }

  /**
   * Get the number of questions in the ladder
   */
  getTotalQuestions(): number {
    return this.config.levels.length;
  }

  /**
   * Get all checkpoints in the ladder
   */
  getCheckpoints(): PrizeLadderLevel[] {
    return this.config.levels.filter(level => level.isCheckpoint);
  }
}
