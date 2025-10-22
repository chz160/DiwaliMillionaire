import { TestBed } from '@angular/core/testing';
import { GameStatePersistenceService, GameState } from './game-state-persistence.service';
import { Question } from './questions.service';

describe('GameStatePersistenceService', () => {
  let service: GameStatePersistenceService;

  const mockQuestions: Question[] = [
    {
      id: 1,
      question: 'What is the capital of India?',
      options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
      correctAnswer: 1,
      difficulty: 'Easy'
    },
    {
      id: 2,
      question: 'Which festival is known as the Festival of Lights?',
      options: ['Holi', 'Diwali', 'Eid', 'Christmas'],
      correctAnswer: 1,
      difficulty: 'Easy'
    }
  ];

  const mockRenderOrder: number[][] = [
    [0, 1, 2, 3], // Question 1 - no shuffle
    [2, 0, 3, 1]  // Question 2 - shuffled
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameStatePersistenceService]
    });
    service = TestBed.inject(GameStatePersistenceService);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateGameKey', () => {
    it('should generate a unique game key', () => {
      const key1 = service.generateGameKey();
      const key2 = service.generateGameKey();
      
      expect(key1).toBeTruthy();
      expect(key2).toBeTruthy();
      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^G_/);
      expect(key2).toMatch(/^G_/);
    });

    it('should generate keys with consistent format', () => {
      const key = service.generateGameKey();
      expect(key).toMatch(/^G_[a-z0-9]+_[a-z0-9]+$/);
    });
  });

  describe('createInitialState', () => {
    it('should create initial state with correct structure', () => {
      const gameKey = 'test_key_123';
      const state = service.createInitialState(gameKey, mockQuestions, mockRenderOrder);

      expect(state.schemaVersion).toBe(1);
      expect(state.gameKey).toBe(gameKey);
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.questions).toEqual(mockQuestions);
      expect(state.selectedQuestionIds).toEqual([1, 2]);
      expect(state.lifelinesUsed).toEqual({
        fiftyFifty: false,
        askAudience: false,
        phoneFriend: false
      });
      expect(state.answeredQuestions).toEqual([]);
      expect(state.removedOptions).toEqual([]);
      expect(state.audienceVotesActive).toBe(false);
      expect(state.phoneFriendActive).toBe(false);
      expect(state.soundEnabled).toBe(true);
      expect(state.lastSaved).toBeDefined();
      expect(state.renderOrder).toEqual(mockRenderOrder);
    });
  });

  describe('saveState and loadState', () => {
    it('should save and load state correctly', async () => {
      const gameKey = 'test_save_load';
      const state = service.createInitialState(gameKey, mockQuestions, mockRenderOrder);
      state.currentQuestionIndex = 2;
      state.lifelinesUsed.fiftyFifty = true;

      await service.saveState(state);
      const loaded = await service.loadState(gameKey);

      expect(loaded).toBeTruthy();
      expect(loaded!.gameKey).toBe(gameKey);
      expect(loaded!.currentQuestionIndex).toBe(2);
      expect(loaded!.lifelinesUsed.fiftyFifty).toBe(true);
      expect(loaded!.questions).toEqual(mockQuestions);
      expect(loaded!.renderOrder).toEqual(mockRenderOrder);
    });

    it('should return null for non-existent game key', async () => {
      const loaded = await service.loadState('non_existent_key');
      expect(loaded).toBeNull();
    });

    it('should update lastSaved timestamp on save', async () => {
      const gameKey = 'test_timestamp';
      const state = service.createInitialState(gameKey, mockQuestions, mockRenderOrder);
      const originalTimestamp = state.lastSaved;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      await service.saveState(state);
      const loaded = await service.loadState(gameKey);

      expect(loaded!.lastSaved).toBeGreaterThan(originalTimestamp);
    });
  });

  describe('scheduleSave', () => {
    it('should debounce multiple save calls', (done) => {
      const gameKey = 'test_debounce';
      const state = service.createInitialState(gameKey, mockQuestions, mockRenderOrder);
      
      // Call scheduleSave multiple times rapidly
      state.currentQuestionIndex = 1;
      service.scheduleSave(state);
      
      state.currentQuestionIndex = 2;
      service.scheduleSave(state);
      
      state.currentQuestionIndex = 3;
      service.scheduleSave(state);

      // Wait for debounce to complete
      setTimeout(async () => {
        const loaded = await service.loadState(gameKey);
        expect(loaded!.currentQuestionIndex).toBe(3);
        done();
      }, 600); // Wait longer than debounce time
    });
  });

  describe('deleteState', () => {
    it('should delete saved state', async () => {
      const gameKey = 'test_delete';
      const state = service.createInitialState(gameKey, mockQuestions, mockRenderOrder);

      await service.saveState(state);
      let loaded = await service.loadState(gameKey);
      expect(loaded).toBeTruthy();

      await service.deleteState(gameKey);
      loaded = await service.loadState(gameKey);
      expect(loaded).toBeNull();
    });
  });

  describe('listSessions', () => {
    it('should list all saved sessions', async () => {
      const key1 = 'test_list_1';
      const key2 = 'test_list_2';
      
      const state1 = service.createInitialState(key1, mockQuestions, mockRenderOrder);
      const state2 = service.createInitialState(key2, mockQuestions, mockRenderOrder);

      await service.saveState(state1);
      await service.saveState(state2);

      const sessions = await service.listSessions();
      
      expect(sessions.length).toBeGreaterThanOrEqual(2);
      const keys = sessions.map(s => s.gameKey);
      expect(keys).toContain(key1);
      expect(keys).toContain(key2);
    });

    it('should include lastSaved timestamp in session list', async () => {
      const gameKey = 'test_list_timestamp';
      const state = service.createInitialState(gameKey, mockQuestions, mockRenderOrder);

      await service.saveState(state);
      const sessions = await service.listSessions();

      const session = sessions.find(s => s.gameKey === gameKey);
      expect(session).toBeTruthy();
      expect(session!.lastSaved).toBeDefined();
      expect(typeof session!.lastSaved).toBe('number');
    });
  });

  describe('checkStorageAvailability', () => {
    it('should check storage availability', async () => {
      const availability = await service.checkStorageAvailability();
      
      // At least localStorage should be available in tests
      expect(availability.localStorage).toBe(true);
    });
  });

  describe('state validation', () => {
    it('should reject invalid state when loading', async () => {
      const gameKey = 'test_invalid';
      
      // Manually inject invalid state into localStorage
      localStorage.setItem('diwali_game_' + gameKey, JSON.stringify({
        gameKey: gameKey,
        // Missing required fields
      }));

      const loaded = await service.loadState(gameKey);
      expect(loaded).toBeNull();
    });

    it('should reject state with wrong schema version', async () => {
      const gameKey = 'test_old_schema';
      const state = service.createInitialState(gameKey, mockQuestions, mockRenderOrder);
      
      // Manually set old schema version
      (state as any).schemaVersion = 0;
      
      localStorage.setItem('diwali_game_' + gameKey, JSON.stringify(state));

      const loaded = await service.loadState(gameKey);
      expect(loaded).toBeNull();
    });
  });

  describe('complex state scenarios', () => {
    it('should preserve lifeline state', async () => {
      const gameKey = 'test_lifelines';
      const state = service.createInitialState(gameKey, mockQuestions, mockRenderOrder);
      
      state.lifelinesUsed = {
        fiftyFifty: true,
        askAudience: true,
        phoneFriend: false
      };
      state.removedOptions = [0, 2];
      state.audienceVotesActive = true;

      await service.saveState(state);
      const loaded = await service.loadState(gameKey);

      expect(loaded!.lifelinesUsed).toEqual({
        fiftyFifty: true,
        askAudience: true,
        phoneFriend: false
      });
      expect(loaded!.removedOptions).toEqual([0, 2]);
      expect(loaded!.audienceVotesActive).toBe(true);
    });

    it('should preserve answered questions', async () => {
      const gameKey = 'test_answers';
      const state = service.createInitialState(gameKey, mockQuestions, mockRenderOrder);
      
      state.answeredQuestions = [
        {
          questionId: 1,
          correct: true,
          chosenOption: 1,
          correctOption: 1
        },
        {
          questionId: 2,
          correct: false,
          chosenOption: 0,
          correctOption: 1
        }
      ];

      await service.saveState(state);
      const loaded = await service.loadState(gameKey);

      expect(loaded!.answeredQuestions.length).toBe(2);
      expect(loaded!.answeredQuestions[0].correct).toBe(true);
      expect(loaded!.answeredQuestions[1].correct).toBe(false);
    });

    it('should preserve timer state', async () => {
      const gameKey = 'test_timer';
      const state = service.createInitialState(gameKey, mockQuestions, mockRenderOrder);
      
      state.timerStartTime = Date.now() - 30000; // 30 seconds ago
      state.timerDuration = 60000; // 60 seconds total

      await service.saveState(state);
      const loaded = await service.loadState(gameKey);

      expect(loaded!.timerStartTime).toBe(state.timerStartTime);
      expect(loaded!.timerDuration).toBe(state.timerDuration);
    });
  });
});
