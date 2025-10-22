import { Injectable } from '@angular/core';
import { Question } from './questions.service';

export interface LifelineState {
  fiftyFifty: boolean;
  askAudience: boolean;
  phoneFriend: boolean;
}

export interface AudienceVote {
  optionIndex: number;
  percentage: number;
}

export interface PhoneFriendHint {
  suggestedAnswer: number;
  confidence: string;
}

@Injectable({
  providedIn: 'root'
})
export class LifelineService {
  
  /**
   * Use the 50:50 lifeline - removes two incorrect options
   * @param question The current question
   * @returns Array of option indices to remove (two incorrect answers)
   */
  useFiftyFifty(question: Question): number[] {
    const incorrectOptions: number[] = [];
    
    // Find all incorrect options
    for (let i = 0; i < question.options.length; i++) {
      if (i !== question.correctAnswer) {
        incorrectOptions.push(i);
      }
    }
    
    // Randomly select 2 incorrect options to remove
    const shuffled = this.shuffleArray([...incorrectOptions]);
    return shuffled.slice(0, 2);
  }
  
  /**
   * Use the Ask the Audience lifeline - generates simulated audience votes
   * @param question The current question
   * @returns Array of audience votes with percentages for each option
   */
  useAskAudience(question: Question): AudienceVote[] {
    const votes: AudienceVote[] = [];
    const correctAnswer = question.correctAnswer;
    
    // Generate weighted random distribution
    // Correct answer gets 45-80% of votes
    const correctPercentage = 45 + Math.random() * 35;
    
    // Remaining percentage distributed among wrong answers
    const remainingPercentage = 100 - correctPercentage;
    
    // Generate random percentages for incorrect options
    const incorrectPercentages: number[] = [];
    let sum = 0;
    
    for (let i = 0; i < question.options.length - 1; i++) {
      const random = Math.random();
      incorrectPercentages.push(random);
      sum += random;
    }
    
    // Normalize incorrect percentages to sum to remainingPercentage
    const normalizedIncorrect = incorrectPercentages.map(p => (p / sum) * remainingPercentage);
    
    // Build the result array
    let incorrectIndex = 0;
    for (let i = 0; i < question.options.length; i++) {
      if (i === correctAnswer) {
        votes.push({
          optionIndex: i,
          percentage: Math.round(correctPercentage)
        });
      } else {
        votes.push({
          optionIndex: i,
          percentage: Math.round(normalizedIncorrect[incorrectIndex])
        });
        incorrectIndex++;
      }
    }
    
    // Adjust percentages to sum to exactly 100
    const total = votes.reduce((sum, v) => sum + v.percentage, 0);
    if (total !== 100) {
      votes[correctAnswer].percentage += (100 - total);
    }
    
    return votes;
  }
  
  /**
   * Use the Phone a Friend lifeline - provides a hint
   * @param question The current question
   * @returns A hint with suggested answer and confidence level
   */
  usePhoneFriend(question: Question): PhoneFriendHint {
    // 80% chance to suggest the correct answer, 20% chance to suggest a wrong one
    const isCorrect = Math.random() < 0.8;
    
    let suggestedAnswer: number;
    let confidence: string;
    
    if (isCorrect) {
      suggestedAnswer = question.correctAnswer;
      // Vary confidence levels for correct answers
      const confidenceLevel = Math.random();
      if (confidenceLevel < 0.3) {
        confidence = "I'm pretty sure it's";
      } else if (confidenceLevel < 0.7) {
        confidence = "I think it's";
      } else {
        confidence = "I believe it's";
      }
    } else {
      // Pick a random incorrect answer
      const incorrectOptions: number[] = [];
      for (let i = 0; i < question.options.length; i++) {
        if (i !== question.correctAnswer) {
          incorrectOptions.push(i);
        }
      }
      suggestedAnswer = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
      confidence = "I'm not certain, but maybe";
    }
    
    return {
      suggestedAnswer,
      confidence
    };
  }
  
  /**
   * Shuffle an array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
