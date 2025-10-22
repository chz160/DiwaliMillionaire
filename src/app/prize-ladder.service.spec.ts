import { TestBed } from '@angular/core/testing';
import { PrizeLadderService, PrizeLadderConfig } from './prize-ladder.service';

describe('PrizeLadderService', () => {
  let service: PrizeLadderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrizeLadderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Default Configuration', () => {
    it('should have 15 levels', () => {
      const levels = service.getLevels();
      expect(levels.length).toBe(15);
    });

    it('should have correct prize values', () => {
      expect(service.getPrizeForQuestion(1)).toBe('$100');
      expect(service.getPrizeForQuestion(5)).toBe('$1,000');
      expect(service.getPrizeForQuestion(10)).toBe('$32,000');
      expect(service.getPrizeForQuestion(15)).toBe('$1,000,000');
    });

    it('should have checkpoints at Q5 and Q10', () => {
      expect(service.isCheckpoint(5)).toBe(true);
      expect(service.isCheckpoint(10)).toBe(true);
      
      // Other questions should not be checkpoints
      expect(service.isCheckpoint(1)).toBe(false);
      expect(service.isCheckpoint(4)).toBe(false);
      expect(service.isCheckpoint(6)).toBe(false);
      expect(service.isCheckpoint(15)).toBe(false);
    });

    it('should return exactly 2 checkpoints', () => {
      const checkpoints = service.getCheckpoints();
      expect(checkpoints.length).toBe(2);
      expect(checkpoints[0].questionNumber).toBe(5);
      expect(checkpoints[1].questionNumber).toBe(10);
    });

    it('should return total of 15 questions', () => {
      expect(service.getTotalQuestions()).toBe(15);
    });
  });

  describe('Guaranteed Prize Logic', () => {
    it('should return $0 when no questions answered correctly', () => {
      const prize = service.getGuaranteedPrize(1, 0);
      expect(prize).toBe('$0');
    });

    it('should return $0 when on Q1-Q4 (before first checkpoint)', () => {
      expect(service.getGuaranteedPrize(2, 1)).toBe('$0');
      expect(service.getGuaranteedPrize(3, 2)).toBe('$0');
      expect(service.getGuaranteedPrize(4, 3)).toBe('$0');
      expect(service.getGuaranteedPrize(5, 4)).toBe('$0');
    });

    it('should return $1,000 when on Q6-Q10 (after Q5 checkpoint)', () => {
      expect(service.getGuaranteedPrize(6, 5)).toBe('$1,000');
      expect(service.getGuaranteedPrize(7, 6)).toBe('$1,000');
      expect(service.getGuaranteedPrize(8, 7)).toBe('$1,000');
      expect(service.getGuaranteedPrize(9, 8)).toBe('$1,000');
      expect(service.getGuaranteedPrize(10, 9)).toBe('$1,000');
    });

    it('should return $32,000 when on Q11-Q15 (after Q10 checkpoint)', () => {
      expect(service.getGuaranteedPrize(11, 10)).toBe('$32,000');
      expect(service.getGuaranteedPrize(12, 11)).toBe('$32,000');
      expect(service.getGuaranteedPrize(13, 12)).toBe('$32,000');
      expect(service.getGuaranteedPrize(14, 13)).toBe('$32,000');
      expect(service.getGuaranteedPrize(15, 14)).toBe('$32,000');
    });
  });

  describe('Current Prize (Walk Away) Logic', () => {
    it('should return $0 when no questions answered', () => {
      expect(service.getCurrentPrize(0)).toBe('$0');
    });

    it('should return correct prize for each question answered', () => {
      expect(service.getCurrentPrize(1)).toBe('$100');
      expect(service.getCurrentPrize(2)).toBe('$200');
      expect(service.getCurrentPrize(3)).toBe('$300');
      expect(service.getCurrentPrize(4)).toBe('$500');
      expect(service.getCurrentPrize(5)).toBe('$1,000');
      expect(service.getCurrentPrize(10)).toBe('$32,000');
      expect(service.getCurrentPrize(15)).toBe('$1,000,000');
    });

    it('should return prize at checkpoint', () => {
      // At first checkpoint
      expect(service.getCurrentPrize(5)).toBe('$1,000');
      
      // At second checkpoint
      expect(service.getCurrentPrize(10)).toBe('$32,000');
    });
  });

  describe('Custom Configuration', () => {
    it('should allow setting custom configuration', () => {
      const customConfig: PrizeLadderConfig = {
        levels: [
          { questionNumber: 1, prize: '₹1,000', isCheckpoint: false },
          { questionNumber: 2, prize: '₹2,000', isCheckpoint: false },
          { questionNumber: 3, prize: '₹5,000', isCheckpoint: true },
          { questionNumber: 4, prize: '₹10,000', isCheckpoint: false },
          { questionNumber: 5, prize: '₹50,000', isCheckpoint: false }
        ]
      };

      service.setConfig(customConfig);

      expect(service.getLevels().length).toBe(5);
      expect(service.getPrizeForQuestion(1)).toBe('₹1,000');
      expect(service.getPrizeForQuestion(3)).toBe('₹5,000');
      expect(service.isCheckpoint(3)).toBe(true);
      expect(service.getTotalQuestions()).toBe(5);
    });

    it('should handle custom checkpoint positions', () => {
      const customConfig: PrizeLadderConfig = {
        levels: [
          { questionNumber: 1, prize: '100 points', isCheckpoint: false },
          { questionNumber: 2, prize: '200 points', isCheckpoint: true },
          { questionNumber: 3, prize: '500 points', isCheckpoint: false },
          { questionNumber: 4, prize: '1000 points', isCheckpoint: true }
        ]
      };

      service.setConfig(customConfig);

      // Check guaranteed prizes with custom checkpoints
      // When no checkpoints have been passed, guaranteed prize is $0
      expect(service.getGuaranteedPrize(1, 0)).toBe('$0'); // 0 questions answered → $0
      expect(service.getGuaranteedPrize(2, 1)).toBe('$0'); // 1 question answered (Q1), Q2 checkpoint not passed yet → $0
      // After Q2 checkpoint is passed (2 questions answered correctly)
      expect(service.getGuaranteedPrize(3, 2)).toBe('200 points'); // Q2 checkpoint passed
      expect(service.getGuaranteedPrize(4, 3)).toBe('200 points'); // Q2 checkpoint still last passed
    });

    it('should work with no checkpoints', () => {
      const customConfig: PrizeLadderConfig = {
        levels: [
          { questionNumber: 1, prize: '$100', isCheckpoint: false },
          { questionNumber: 2, prize: '$200', isCheckpoint: false },
          { questionNumber: 3, prize: '$300', isCheckpoint: false }
        ]
      };

      service.setConfig(customConfig);

      // Without checkpoints, guaranteed prize should be $0
      expect(service.getGuaranteedPrize(2, 1)).toBe('$0');
      expect(service.getGuaranteedPrize(3, 2)).toBe('$0');
      
      // But current prize should still work
      expect(service.getCurrentPrize(1)).toBe('$100');
      expect(service.getCurrentPrize(2)).toBe('$200');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid question numbers gracefully', () => {
      expect(service.getPrizeForQuestion(0)).toBe('$0');
      expect(service.getPrizeForQuestion(100)).toBe('$0');
      expect(service.isCheckpoint(0)).toBe(false);
      expect(service.isCheckpoint(100)).toBe(false);
    });

    it('should handle getCurrentPrize with out-of-range values', () => {
      expect(service.getCurrentPrize(-1)).toBe('$0');
      expect(service.getCurrentPrize(100)).toBe('$0');
    });
  });

  describe('Game Flow Scenarios', () => {
    it('should handle player reaching Q6 and answering incorrectly', () => {
      // Player has answered Q1-Q5 correctly (5 correct)
      // Now on Q6, answers incorrectly
      const guaranteedPrize = service.getGuaranteedPrize(6, 5);
      expect(guaranteedPrize).toBe('$1,000'); // Last checkpoint at Q5
    });

    it('should handle player walking away at Q7', () => {
      // Player has answered Q1-Q7 correctly (7 correct)
      // Decides to walk away
      const currentPrize = service.getCurrentPrize(7);
      expect(currentPrize).toBe('$4,000'); // Prize for Q7
    });

    it('should handle player winning the game', () => {
      // Player answers all 15 questions correctly
      const finalPrize = service.getCurrentPrize(15);
      expect(finalPrize).toBe('$1,000,000');
    });

    it('should handle player failing on first question', () => {
      // Player answers Q1 incorrectly (0 correct)
      const guaranteedPrize = service.getGuaranteedPrize(1, 0);
      expect(guaranteedPrize).toBe('$0');
    });

    it('should handle player reaching Q11 and failing', () => {
      // Player has answered Q1-Q10 correctly (10 correct)
      // Fails on Q11
      const guaranteedPrize = service.getGuaranteedPrize(11, 10);
      expect(guaranteedPrize).toBe('$32,000'); // Last checkpoint at Q10
    });
  });
});
