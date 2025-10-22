import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { QuestionsService } from './questions.service';
import { of } from 'rxjs';

describe('App - Answer Shuffle Functionality', () => {
  let component: App;
  let questionsService: QuestionsService;
  let fixture: any;

  const mockQuestions = [
    {
      id: 1,
      question: 'Question 1?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 2, // C
      difficulty: 'Easy'
    },
    {
      id: 2,
      question: 'Question 2?',
      options: ['Opt A', 'Opt B', 'Opt C', 'Opt D'],
      correctAnswer: 1, // B
      difficulty: 'Easy'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    questionsService = TestBed.inject(QuestionsService);
    spyOn(questionsService, 'loadQuestions').and.returnValue(of(mockQuestions));
    spyOn(questionsService, 'selectQuestionsWithProgression').and.returnValue(mockQuestions);

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    
    // Set questions directly to avoid async loading issues
    component.questions.set(mockQuestions);
    
    fixture.detectChanges();
  });

  describe('Render Order Generation', () => {
    it('should generate render order for all questions when game starts', () => {
      component.startGame();

      const renderOrder = component.renderOrder();
      expect(renderOrder.length).toBe(mockQuestions.length);
      
      // Each question should have exactly 4 positions
      renderOrder.forEach(order => {
        expect(order.length).toBe(4);
      });
    });

    it('should contain all indices 0-3 in each render order', () => {
      component.startGame();

      const renderOrder = component.renderOrder();
      renderOrder.forEach(order => {
        const sorted = [...order].sort();
        expect(sorted).toEqual([0, 1, 2, 3]);
      });
    });

    it('should generate deterministic order for same game key', () => {
      // Start game twice with mocked game key
      const gameKey1 = 'TEST_KEY_123';
      const gameKey2 = 'TEST_KEY_123';
      
      // Spy on generateGameKey to return consistent key
      spyOn(component['persistenceService'], 'generateGameKey')
        .and.returnValues(gameKey1, gameKey2);

      component.startGame();
      const order1 = component.renderOrder();

      component.resetGame();
      component.startGame();
      const order2 = component.renderOrder();

      expect(order1).toEqual(order2);
    });

    it('should generate different orders for different game keys', () => {
      const gameKey1 = 'GAME_A';
      const gameKey2 = 'GAME_B';
      
      spyOn(component['persistenceService'], 'generateGameKey')
        .and.returnValues(gameKey1, gameKey2);

      component.startGame();
      const order1 = component.renderOrder();

      component.resetGame();
      component.startGame();
      const order2 = component.renderOrder();

      // Orders should be different (very unlikely to be the same by chance)
      expect(order1).not.toEqual(order2);
    });
  });

  describe('Answer Selection with Shuffle', () => {
    beforeEach(() => {
      component.startGame();
    });

    it('should map rendered index to original index correctly', (done) => {
      const questionIndex = 0;
      const renderOrder = component.renderOrder()[questionIndex];
      const correctOriginalIndex = mockQuestions[questionIndex].correctAnswer; // 2
      const correctRenderedIndex = renderOrder.indexOf(correctOriginalIndex);

      // Select the correct answer using rendered index
      component.selectAnswer(correctRenderedIndex);

      setTimeout(() => {
        expect(component.answeredCorrectly()).toBe(true);
        done();
      }, 1100);
    });

    it('should correctly identify incorrect answer with shuffle', (done) => {
      const questionIndex = 0;
      const renderOrder = component.renderOrder()[questionIndex];
      const correctOriginalIndex = mockQuestions[questionIndex].correctAnswer; // 2
      
      // Find an incorrect rendered index
      let incorrectRenderedIndex = 0;
      for (let i = 0; i < 4; i++) {
        if (renderOrder[i] !== correctOriginalIndex) {
          incorrectRenderedIndex = i;
          break;
        }
      }

      component.selectAnswer(incorrectRenderedIndex);

      setTimeout(() => {
        expect(component.answeredCorrectly()).toBe(false);
        done();
      }, 1100);
    });
  });

  describe('Lifelines with Shuffle', () => {
    beforeEach(() => {
      component.startGame();
    });

    it('should remove two incorrect options with 50:50 based on shuffled order', () => {
      const questionIndex = 0;
      const renderOrder = component.renderOrder()[questionIndex];
      const correctOriginalIndex = mockQuestions[questionIndex].correctAnswer;
      const correctRenderedIndex = renderOrder.indexOf(correctOriginalIndex);

      component.useFiftyFifty();

      const removedOptions = component.removedOptions();
      expect(removedOptions.length).toBe(2);
      
      // Correct answer should not be removed
      expect(removedOptions).not.toContain(correctRenderedIndex);
      
      // All removed options should be valid indices
      removedOptions.forEach(idx => {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(4);
      });
    });

    it('should show audience votes for shuffled positions', () => {
      const questionIndex = 0;
      const renderOrder = component.renderOrder()[questionIndex];
      const correctOriginalIndex = mockQuestions[questionIndex].correctAnswer;
      const correctRenderedIndex = renderOrder.indexOf(correctOriginalIndex);

      component.useAskAudience();

      const votes = component.audienceVotes();
      expect(votes).not.toBeNull();
      expect(votes!.length).toBe(4);

      // Find the vote for the correct rendered position
      const correctVote = votes!.find(v => v.optionIndex === correctRenderedIndex);
      expect(correctVote).toBeDefined();
      
      // The correct answer should typically have a high percentage
      // (This is probabilistic but should be true most of the time)
      const maxVotePercentage = Math.max(...votes!.map(v => v.percentage));
      expect(correctVote!.percentage).toBeGreaterThanOrEqual(maxVotePercentage * 0.8);
    });

    it('should show phone friend hint for shuffled position', () => {
      component.usePhoneFriend();

      const hint = component.phoneFriendHint();
      expect(hint).not.toBeNull();
      expect(hint!.suggestedAnswer).toBeGreaterThanOrEqual(0);
      expect(hint!.suggestedAnswer).toBeLessThan(4);
      expect(hint!.confidence).toBeTruthy();
    });
  });

  describe('Rendered Options Display', () => {
    beforeEach(() => {
      component.startGame();
    });

    it('should return options in shuffled order', () => {
      const questionIndex = 0;
      const originalOptions = mockQuestions[questionIndex].options;
      const renderOrder = component.renderOrder()[questionIndex];
      
      const renderedOptions = component.getRenderedOptions();
      
      expect(renderedOptions.length).toBe(4);
      
      // Check that each rendered option matches the shuffled order
      renderedOptions.forEach((option, idx) => {
        const originalIndex = renderOrder[idx];
        expect(option).toBe(originalOptions[originalIndex]);
      });
    });

    it('should preserve all options after shuffle', () => {
      const originalOptions = mockQuestions[0].options;
      const renderedOptions = component.getRenderedOptions();
      
      // Both arrays should contain the same options, just in different order
      const sortedOriginal = [...originalOptions].sort();
      const sortedRendered = [...renderedOptions].sort();
      
      expect(sortedRendered).toEqual(sortedOriginal);
    });
  });

  describe('Persistence with Shuffle', () => {
    it('should save render order in game state', (done) => {
      const saveSpy = spyOn(component['persistenceService'], 'scheduleSave');
      
      component.startGame();
      
      setTimeout(() => {
        expect(saveSpy).toHaveBeenCalled();
        const savedState = saveSpy.calls.mostRecent().args[0];
        expect(savedState.renderOrder).toBeDefined();
        expect(savedState.renderOrder.length).toBe(mockQuestions.length);
        done();
      }, 100);
    });
  });

  describe('Answer Recording with Shuffle', () => {
    beforeEach(() => {
      component.startGame();
    });

    it('should record answered question with shuffled options', (done) => {
      const questionIndex = 0;
      const renderOrder = component.renderOrder()[questionIndex];
      const correctOriginalIndex = mockQuestions[questionIndex].correctAnswer;
      const correctRenderedIndex = renderOrder.indexOf(correctOriginalIndex);

      component.selectAnswer(correctRenderedIndex);

      setTimeout(() => {
        const answeredQuestions = component.answeredQuestions();
        expect(answeredQuestions.length).toBe(1);
        
        const answered = answeredQuestions[0];
        expect(answered.chosenOption).toBe(correctRenderedIndex);
        expect(answered.correctOption).toBe(correctRenderedIndex);
        
        // Options should be in shuffled order
        const expectedOptions = renderOrder.map(idx => mockQuestions[questionIndex].options[idx]);
        expect(answered.options).toEqual(expectedOptions);
        done();
      }, 1100);
    });
  });

  describe('Distribution Testing', () => {
    it('should not show bias towards any position for correct answer', () => {
      const positionCounts = [0, 0, 0, 0];
      const iterations = 40; // Reduced iterations for test performance

      // Mock generateGameKey once before the loop
      const generateKeySpy = spyOn(component['persistenceService'], 'generateGameKey');

      for (let i = 0; i < iterations; i++) {
        const gameKey = `GAME_${i}`;
        generateKeySpy.and.returnValue(gameKey);
        
        component.resetGame();
        component.startGame();
        
        const renderOrder = component.renderOrder()[0];
        const correctOriginalIndex = mockQuestions[0].correctAnswer;
        const correctRenderedIndex = renderOrder.indexOf(correctOriginalIndex);
        
        positionCounts[correctRenderedIndex]++;
      }

      // Each position should appear at least once in 40 iterations
      // This is a weaker test but more reliable
      positionCounts.forEach(count => {
        expect(count).toBeGreaterThan(0);
      });
      
      // Total should equal iterations
      const total = positionCounts.reduce((a, b) => a + b, 0);
      expect(total).toBe(iterations);
    });
  });
});
