import { TestBed } from '@angular/core/testing';
import { GameResultService } from './game-result.service';
import { PrizeLadderService } from './prize-ladder.service';
import { AnsweredQuestion } from './game-session-result.model';

describe('GameResultService', () => {
  let service: GameResultService;
  let prizeLadderService: PrizeLadderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameResultService);
    prizeLadderService = TestBed.inject(PrizeLadderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateFinalPrize', () => {
    it('should return top prize for WIN', () => {
      const prize = service.calculateFinalPrize('WIN', 14, 15, 15);
      expect(prize).toBe('$1,000,000');
    });

    it('should return guaranteed prize for WRONG answer', () => {
      // Answered 10 questions correctly, failed on question 11
      // Last checkpoint is Q10 ($32,000)
      const prize = service.calculateFinalPrize('WRONG', 10, 10, 15);
      expect(prize).toBe('$32,000');
    });

    it('should return $0 for WRONG answer before first checkpoint', () => {
      // Answered 3 questions correctly, failed on question 4
      // No checkpoint reached yet
      const prize = service.calculateFinalPrize('WRONG', 3, 3, 15);
      expect(prize).toBe('$0');
    });

    it('should return current prize for WALK_AWAY', () => {
      // Answered 7 questions correctly and walking away
      const prize = service.calculateFinalPrize('WALK_AWAY', 7, 7, 15);
      expect(prize).toBe('$4,000');
    });

    it('should return guaranteed prize for TIMEOUT', () => {
      // Same as WRONG - should return checkpoint prize
      const prize = service.calculateFinalPrize('TIMEOUT', 10, 10, 15);
      expect(prize).toBe('$32,000');
    });
  });

  describe('createSessionResult', () => {
    it('should create a complete session result for WIN', () => {
      const answeredQuestions: AnsweredQuestion[] = Array.from({ length: 15 }, (_, i) => ({
        questionId: i + 1,
        correct: true,
        chosenOption: 0,
        correctOption: 0,
        difficulty: i < 3 ? 'Easy' : i < 6 ? 'Intermediate' : 'Hard',
        question: `Question ${i + 1}`,
        options: ['A', 'B', 'C', 'D'],
        prize: prizeLadderService.getPrizeForQuestion(i + 1)
      }));

      const result = service.createSessionResult(
        'WIN',
        14,
        answeredQuestions,
        { fiftyFifty: true, askAudience: false, phoneFriend: true },
        15
      );

      expect(result.endReason).toBe('WIN');
      expect(result.finalPrize).toBe('$1,000,000');
      expect(result.currentQuestionIndex).toBe(14);
      expect(result.totalQuestions).toBe(15);
      expect(result.usedLifelines.fiftyFifty).toBe(true);
      expect(result.usedLifelines.askAudience).toBe(false);
      expect(result.usedLifelines.phoneFriend).toBe(true);
      expect(result.answeredQuestions.length).toBe(15);
    });

    it('should create a session result for WRONG answer', () => {
      const answeredQuestions: AnsweredQuestion[] = [
        ...Array.from({ length: 5 }, (_, i) => ({
          questionId: i + 1,
          correct: true,
          chosenOption: 0,
          correctOption: 0,
          difficulty: 'Easy',
          question: `Question ${i + 1}`,
          options: ['A', 'B', 'C', 'D'],
          prize: prizeLadderService.getPrizeForQuestion(i + 1)
        })),
        {
          questionId: 6,
          correct: false,
          chosenOption: 1,
          correctOption: 0,
          difficulty: 'Intermediate',
          question: 'Question 6',
          options: ['A', 'B', 'C', 'D'],
          prize: prizeLadderService.getPrizeForQuestion(6)
        }
      ];

      const result = service.createSessionResult(
        'WRONG',
        5,
        answeredQuestions,
        { fiftyFifty: false, askAudience: false, phoneFriend: false },
        15
      );

      expect(result.endReason).toBe('WRONG');
      expect(result.finalPrize).toBe('$1,000'); // Checkpoint at Q5
      expect(result.lastAnsweredPrize).toBe('$1,000');
      expect(result.lastCheckpointPrize).toBe('$1,000');
    });

    it('should create a session result for WALK_AWAY', () => {
      const answeredQuestions: AnsweredQuestion[] = Array.from({ length: 7 }, (_, i) => ({
        questionId: i + 1,
        correct: true,
        chosenOption: 0,
        correctOption: 0,
        difficulty: i < 3 ? 'Easy' : 'Intermediate',
        question: `Question ${i + 1}`,
        options: ['A', 'B', 'C', 'D'],
        prize: prizeLadderService.getPrizeForQuestion(i + 1)
      }));

      const result = service.createSessionResult(
        'WALK_AWAY',
        7,
        answeredQuestions,
        { fiftyFifty: true, askAudience: true, phoneFriend: false },
        15
      );

      expect(result.endReason).toBe('WALK_AWAY');
      expect(result.finalPrize).toBe('$4,000');
      expect(result.lastAnsweredPrize).toBe('$4,000');
    });
  });

  describe('getStatistics', () => {
    it('should calculate correct statistics', () => {
      const answeredQuestions: AnsweredQuestion[] = [
        ...Array.from({ length: 8 }, (_, i) => ({
          questionId: i + 1,
          correct: true,
          chosenOption: 0,
          correctOption: 0,
          difficulty: 'Easy',
          question: `Question ${i + 1}`,
          options: ['A', 'B', 'C', 'D'],
          prize: prizeLadderService.getPrizeForQuestion(i + 1)
        })),
        {
          questionId: 9,
          correct: false,
          chosenOption: 1,
          correctOption: 0,
          difficulty: 'Hard',
          question: 'Question 9',
          options: ['A', 'B', 'C', 'D'],
          prize: prizeLadderService.getPrizeForQuestion(9)
        }
      ];

      const result = service.createSessionResult(
        'WRONG',
        8,
        answeredQuestions,
        { fiftyFifty: false, askAudience: false, phoneFriend: false },
        15
      );

      const stats = service.getStatistics(result);
      expect(stats.correctAnswers).toBe(8);
      expect(stats.totalAttempted).toBe(9);
      expect(stats.accuracy).toBe(89); // 8/9 = 88.89, rounded to 89
      expect(stats.highestQuestion).toBe(8);
    });
  });

  describe('getHeadline', () => {
    it('should return winning headline for WIN', () => {
      const result = service.createSessionResult(
        'WIN',
        14,
        [],
        { fiftyFifty: false, askAudience: false, phoneFriend: false },
        15
      );
      const headline = service.getHeadline(result);
      expect(headline).toContain('You Won');
      expect(headline).toContain('$1,000,000');
    });

    it('should return walk away headline for WALK_AWAY', () => {
      const answeredQuestions: AnsweredQuestion[] = Array.from({ length: 5 }, (_, i) => ({
        questionId: i + 1,
        correct: true,
        chosenOption: 0,
        correctOption: 0,
        difficulty: 'Easy',
        question: `Question ${i + 1}`,
        options: ['A', 'B', 'C', 'D'],
        prize: prizeLadderService.getPrizeForQuestion(i + 1)
      }));

      const result = service.createSessionResult(
        'WALK_AWAY',
        5,
        answeredQuestions,
        { fiftyFifty: false, askAudience: false, phoneFriend: false },
        15
      );
      const headline = service.getHeadline(result);
      expect(headline).toContain('Walked Away');
      expect(headline).toContain('$1,000');
    });

    it('should return game over headline for WRONG', () => {
      const result = service.createSessionResult(
        'WRONG',
        2,
        [],
        { fiftyFifty: false, askAudience: false, phoneFriend: false },
        15
      );
      const headline = service.getHeadline(result);
      expect(headline).toBe('Game Over');
    });
  });

  describe('getEndReasonDescription', () => {
    it('should return correct descriptions', () => {
      expect(service.getEndReasonDescription('WIN')).toBe('All Questions Answered Correctly');
      expect(service.getEndReasonDescription('WALK_AWAY')).toBe('Walked Away');
      expect(service.getEndReasonDescription('WRONG')).toBe('Incorrect Answer');
      expect(service.getEndReasonDescription('TIMEOUT')).toBe('Time Expired');
    });
  });

  describe('persistence', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it('should persist and retrieve result', () => {
      const result = service.createSessionResult(
        'WIN',
        14,
        [],
        { fiftyFifty: true, askAudience: false, phoneFriend: false },
        15
      );

      const retrieved = service.getPersistedResult();
      expect(retrieved).toBeTruthy();
      expect(retrieved?.endReason).toBe('WIN');
      expect(retrieved?.finalPrize).toBe('$1,000,000');
    });

    it('should clear persisted result', () => {
      service.createSessionResult(
        'WIN',
        14,
        [],
        { fiftyFifty: false, askAudience: false, phoneFriend: false },
        15
      );

      service.clearResult();
      const retrieved = service.getPersistedResult();
      expect(retrieved).toBeNull();
    });
  });
});
