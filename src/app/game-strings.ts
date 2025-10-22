/**
 * Text strings for the game - ready for internationalization (i18n)
 * To add a new language, duplicate this file and translate all values
 */

export const GAME_STRINGS = {
  // Game titles and headers
  gameTitle: 'Who Wants To Be Diwali Millionaire',
  
  // Start screen
  startScreen: {
    welcome: 'Welcome to the Festival of Lights!',
    subtitle: 'Test your knowledge and win virtual prizes!',
    startButton: 'Start Game'
  },
  
  // Game screen
  gameScreen: {
    questionLabel: 'Question',
    of: 'of',
    walkAwayButton: 'Walk Away',
    prizeLadderTitle: 'Prize Ladder'
  },
  
  // Lifelines
  lifelines: {
    fiftyFifty: {
      name: '50:50',
      label: '50:50',
      title: '50:50 - Remove two incorrect answers'
    },
    askAudience: {
      name: 'Audience',
      label: 'Audience',
      title: 'Ask the Audience',
      chartTitle: 'Audience Says:'
    },
    phoneFriend: {
      name: 'Phone',
      label: 'Phone',
      title: 'Phone a Friend',
      hintTitle: 'Your Friend Says:'
    }
  },
  
  // Summary screen
  summary: {
    // Headlines
    headlines: {
      win: 'You Won {prize}!',
      walkAway: 'You Walked Away with {prize}!',
      gameOverWithPrize: 'Game Over – {prize} Secured',
      gameOver: 'Game Over'
    },
    
    // End reasons
    endReasons: {
      win: 'All Questions Answered Correctly',
      walkAway: 'Walked Away',
      wrong: 'Incorrect Answer',
      timeout: 'Time Expired'
    },
    
    // Labels
    reachedQuestion: 'Reached Q{current}/{total}',
    finalWinnings: 'Final Winnings',
    
    // Sections
    progressTitle: 'Your Progress',
    statisticsTitle: 'Session Statistics',
    lifelinesTitle: 'Lifelines Used',
    reviewTitle: 'Answer Review',
    
    // Statistics
    stats: {
      correctAnswers: 'Correct Answers',
      accuracy: 'Accuracy',
      highestQuestion: 'Highest Question'
    },
    
    // Lifeline status
    lifelineUsed: 'Used',
    lifelineNotUsed: 'Not used',
    
    // Review
    review: {
      questionNumber: 'Question {number}',
      correct: 'Correct',
      incorrect: 'Incorrect',
      yourAnswer: 'Your Answer',
      correctAnswer: 'Correct Answer'
    },
    
    // Action buttons
    actions: {
      reviewAnswers: 'Review Answers',
      hideReview: 'Hide Review',
      playAgain: 'Play Again',
      shareResults: 'Share Results'
    },
    
    // Share text template
    shareText: 'I just played Diwali Millionaire and won {prize}! Reached Q{question}/{total} with {accuracy}% accuracy. 🪔✨',
    shareSuccess: 'Results copied to clipboard!'
  },
  
  // Difficulty levels
  difficulty: {
    easy: 'Easy',
    intermediate: 'Intermediate',
    hard: 'Hard',
    veryHard: 'Very Hard',
    expert: 'Expert'
  },
  
  // Accessibility labels
  a11y: {
    gameRegion: 'Game Summary',
    questionRegion: 'Current Question',
    prizeStatus: 'Final winnings',
    progressList: 'Your progress',
    statsSection: 'Session Statistics',
    lifelinesSection: 'Lifelines Used',
    reviewSection: 'Answer review',
    actionButtons: 'Game actions',
    
    // Dynamic labels
    questionResult: 'Question {number}: {result}, {prize}',
    lifelineStatus: '{lifeline} lifeline: {status}',
    answerOption: '{letter}: {text}{chosen}{correct}',
    correctAnswersCount: '{correct} out of {total} correct',
    accuracyPercent: '{accuracy} percent accuracy',
    reachedQuestion: 'Reached question {number}',
    
    // Button labels
    startNewGame: 'Start a new game',
    shareYourResults: 'Share your results',
    expandReview: 'Show answer review',
    collapseReview: 'Hide answer review'
  },
  
  // Decorations
  decorations: {
    diya: '🪔',
    sparkle: '✨',
    fireworks: '🎆',
    star: '🎇',
    celebration: '🎉',
    confetti: '🎊',
    flower: '🌸',
    rangoli: '🌸 🌺 🌼 🌻 🌸'
  }
};

// Type for language code
export type LanguageCode = 'en' | 'hi' | 'es' | 'fr'; // Add more as needed

// Interface for adding new languages
export interface GameStrings {
  [key: string]: any;
}

/**
 * Helper function to interpolate variables in strings
 * Usage: interpolate(GAME_STRINGS.summary.headlines.win, { prize: '$1,000' })
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key]?.toString() || match;
  });
}
