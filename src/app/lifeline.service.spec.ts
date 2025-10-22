import { TestBed } from '@angular/core/testing';
import { LifelineService } from './lifeline.service';
import { Question } from './questions.service';

describe('LifelineService', () => {
  let service: LifelineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LifelineService]
    });
    service = TestBed.inject(LifelineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('useFiftyFifty', () => {
    it('should remove exactly 2 incorrect options', () => {
      const question: Question = {
        id: 1,
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 2, // C
        difficulty: 'Easy'
      };

      const removedOptions = service.useFiftyFifty(question);

      expect(removedOptions.length).toBe(2);
      // Should not include the correct answer
      expect(removedOptions).not.toContain(2);
      // Should only contain indices 0, 1, or 3 (the incorrect options)
      removedOptions.forEach(index => {
        expect([0, 1, 3]).toContain(index);
      });
    });

    it('should remove different options each time (randomness check)', () => {
      const question: Question = {
        id: 1,
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0, // A
        difficulty: 'Easy'
      };

      const results: string[] = [];
      // Run multiple times to check randomness
      for (let i = 0; i < 10; i++) {
        const removed = service.useFiftyFifty(question);
        results.push(removed.sort().join(','));
      }

      // With randomness, we should see some variation
      // (very unlikely all 10 runs produce the same result)
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });

  describe('useAskAudience', () => {
    it('should return votes for all options', () => {
      const question: Question = {
        id: 1,
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 1,
        difficulty: 'Easy'
      };

      const votes = service.useAskAudience(question);

      expect(votes.length).toBe(4);
      votes.forEach(vote => {
        expect(vote.optionIndex).toBeGreaterThanOrEqual(0);
        expect(vote.optionIndex).toBeLessThan(4);
        expect(vote.percentage).toBeGreaterThanOrEqual(0);
        expect(vote.percentage).toBeLessThanOrEqual(100);
      });
    });

    it('should have percentages sum to 100', () => {
      const question: Question = {
        id: 1,
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 2,
        difficulty: 'Easy'
      };

      const votes = service.useAskAudience(question);
      const total = votes.reduce((sum, vote) => sum + vote.percentage, 0);

      expect(total).toBe(100);
    });

    it('should give correct answer the highest or near-highest percentage', () => {
      const question: Question = {
        id: 1,
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 3,
        difficulty: 'Easy'
      };

      // Run multiple times to check the tendency
      let correctIsHighest = 0;
      const runs = 20;
      
      for (let i = 0; i < runs; i++) {
        const votes = service.useAskAudience(question);
        const correctVote = votes[question.correctAnswer].percentage;
        const maxVote = Math.max(...votes.map(v => v.percentage));
        
        if (correctVote === maxVote) {
          correctIsHighest++;
        }
      }

      // Correct answer should be highest in most cases (at least 80% of the time)
      expect(correctIsHighest).toBeGreaterThanOrEqual(runs * 0.8);
    });

    it('should generate different distributions (randomness)', () => {
      const question: Question = {
        id: 1,
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        difficulty: 'Easy'
      };

      const results: string[] = [];
      for (let i = 0; i < 5; i++) {
        const votes = service.useAskAudience(question);
        const percentages = votes.map(v => v.percentage).join(',');
        results.push(percentages);
      }

      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });

  describe('usePhoneFriend', () => {
    it('should return a hint with valid suggestion', () => {
      const question: Question = {
        id: 1,
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 1,
        difficulty: 'Easy'
      };

      const hint = service.usePhoneFriend(question);

      expect(hint.suggestedAnswer).toBeGreaterThanOrEqual(0);
      expect(hint.suggestedAnswer).toBeLessThan(4);
      expect(hint.confidence).toBeTruthy();
      expect(typeof hint.confidence).toBe('string');
    });

    it('should suggest correct answer most of the time (80% probability)', () => {
      const question: Question = {
        id: 1,
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 2,
        difficulty: 'Easy'
      };

      let correctSuggestions = 0;
      const runs = 100;

      for (let i = 0; i < runs; i++) {
        const hint = service.usePhoneFriend(question);
        if (hint.suggestedAnswer === question.correctAnswer) {
          correctSuggestions++;
        }
      }

      // Should be correct around 80% of the time (with some tolerance)
      expect(correctSuggestions).toBeGreaterThan(runs * 0.7);
      expect(correctSuggestions).toBeLessThan(runs * 0.9);
    });

    it('should have different confidence levels', () => {
      const question: Question = {
        id: 1,
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        difficulty: 'Easy'
      };

      const confidenceLevels = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const hint = service.usePhoneFriend(question);
        confidenceLevels.add(hint.confidence);
      }

      // Should have at least 2 different confidence phrases
      expect(confidenceLevels.size).toBeGreaterThanOrEqual(2);
    });
  });
});
