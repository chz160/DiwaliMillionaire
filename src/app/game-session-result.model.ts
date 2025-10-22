/**
 * Result of a game session
 */
export interface GameSessionResult {
  /** Index of the last question (0-based) */
  currentQuestionIndex: number;
  
  /** Prize for the last correct answer */
  lastAnsweredPrize: string;
  
  /** Prize at the last checkpoint crossed */
  lastCheckpointPrize: string;
  
  /** Final prize amount awarded */
  finalPrize: string;
  
  /** Reason the game ended */
  endReason: 'WIN' | 'WRONG' | 'WALK_AWAY' | 'TIMEOUT';
  
  /** Lifelines used during the game */
  usedLifelines: {
    fiftyFifty: boolean;
    askAudience: boolean;
    phoneFriend: boolean;
  };
  
  /** Array of answered questions with results */
  answeredQuestions: AnsweredQuestion[];
  
  /** Total number of questions in the game */
  totalQuestions: number;
  
  /** Timestamp when the game ended */
  timestamp: number;
}

/**
 * Record of a single answered question
 */
export interface AnsweredQuestion {
  /** Question ID */
  questionId: number;
  
  /** Whether the answer was correct */
  correct: boolean;
  
  /** The option chosen by the player (0-3) */
  chosenOption: number;
  
  /** The correct option (0-3) */
  correctOption: number;
  
  /** Question difficulty level */
  difficulty: string;
  
  /** The actual question text */
  question: string;
  
  /** The answer options */
  options: string[];
  
  /** Prize value for this question */
  prize: string;
}
