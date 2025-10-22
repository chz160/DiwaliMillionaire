import { Injectable } from '@angular/core';
import { Question } from './questions.service';
import { LifelineState } from './lifeline.service';

/**
 * Versioned game state schema for persistence
 */
export interface GameState {
  schemaVersion: number;
  gameKey: string;
  currentQuestionIndex: number;
  selectedQuestionIds: number[];
  questions: Question[];
  lifelinesUsed: LifelineState;
  removedOptions: number[];
  audienceVotesActive: boolean;
  phoneFriendActive: boolean;
  answeredQuestions: Array<{
    questionId: number;
    correct: boolean;
    chosenOption: number;
    correctOption: number;
  }>;
  timerStartTime: number | null;
  timerDuration: number | null;
  soundEnabled: boolean;
  lastSaved: number;
}

/**
 * Service for persisting game state using IndexedDB with localStorage fallback
 */
@Injectable({
  providedIn: 'root'
})
export class GameStatePersistenceService {
  private readonly DB_NAME = 'DiwaliMillionaireDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'gameSessions';
  private readonly SCHEMA_VERSION = 1;
  private readonly LOCALSTORAGE_PREFIX = 'diwali_game_';
  
  private db: IDBDatabase | null = null;
  private useLocalStorage = false;
  private saveTimeout: any = null;
  private readonly DEBOUNCE_MS = 500;

  constructor() {
    this.initializeDB();
  }

  /**
   * Initialize IndexedDB connection
   */
  private async initializeDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not available, falling back to localStorage');
      this.useLocalStorage = true;
      return;
    }

    try {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to localStorage');
        this.useLocalStorage = true;
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'gameKey' });
          objectStore.createIndex('lastSaved', 'lastSaved', { unique: false });
        }
      };
    } catch (error) {
      console.error('Error initializing IndexedDB:', error);
      this.useLocalStorage = true;
    }
  }

  /**
   * Generate a unique game key
   */
  generateGameKey(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `G_${timestamp}_${randomPart}`;
  }

  /**
   * Schedule a debounced save operation
   */
  scheduleSave(state: GameState): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveState(state).catch(error => {
        console.error('Failed to save game state:', error);
      });
    }, this.DEBOUNCE_MS);
  }

  /**
   * Save game state to storage
   */
  async saveState(state: GameState): Promise<void> {
    state.lastSaved = Date.now();
    
    if (this.useLocalStorage || !this.db) {
      return this.saveToLocalStorage(state);
    }

    try {
      await this.saveToIndexedDB(state);
    } catch (error) {
      console.warn('IndexedDB save failed, falling back to localStorage:', error);
      this.useLocalStorage = true;
      await this.saveToLocalStorage(state);
    }
  }

  /**
   * Save state to IndexedDB
   */
  private saveToIndexedDB(state: GameState): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(state);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save state to localStorage
   */
  private async saveToLocalStorage(state: GameState): Promise<void> {
    try {
      const key = this.LOCALSTORAGE_PREFIX + state.gameKey;
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      // Handle quota exceeded or other localStorage errors
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Cannot save game state.');
        throw new Error('Storage quota exceeded. Please free up space.');
      }
      throw error;
    }
  }

  /**
   * Load game state from storage
   */
  async loadState(gameKey: string): Promise<GameState | null> {
    if (this.useLocalStorage || !this.db) {
      return this.loadFromLocalStorage(gameKey);
    }

    try {
      return await this.loadFromIndexedDB(gameKey);
    } catch (error) {
      console.warn('IndexedDB load failed, trying localStorage:', error);
      return this.loadFromLocalStorage(gameKey);
    }
  }

  /**
   * Load state from IndexedDB
   */
  private loadFromIndexedDB(gameKey: string): Promise<GameState | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(gameKey);

      request.onsuccess = () => {
        const state = request.result as GameState | undefined;
        if (state && this.validateState(state)) {
          resolve(state);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Load state from localStorage
   */
  private async loadFromLocalStorage(gameKey: string): Promise<GameState | null> {
    try {
      const key = this.LOCALSTORAGE_PREFIX + gameKey;
      const stored = localStorage.getItem(key);
      
      if (stored) {
        const state = JSON.parse(stored) as GameState;
        if (this.validateState(state)) {
          return state;
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    
    return null;
  }

  /**
   * Validate and migrate state if needed
   */
  private validateState(state: any): boolean {
    if (!state || typeof state !== 'object') {
      return false;
    }

    // Check required fields
    const requiredFields = [
      'schemaVersion',
      'gameKey',
      'currentQuestionIndex',
      'questions',
      'lifelinesUsed',
      'answeredQuestions'
    ];

    for (const field of requiredFields) {
      if (!(field in state)) {
        return false;
      }
    }

    // Migrate old versions if needed
    if (state.schemaVersion < this.SCHEMA_VERSION) {
      // Future: implement migration logic here
      return false; // For now, reject old schemas
    }

    return true;
  }

  /**
   * Delete a saved game state
   */
  async deleteState(gameKey: string): Promise<void> {
    if (this.useLocalStorage || !this.db) {
      return this.deleteFromLocalStorage(gameKey);
    }

    try {
      await this.deleteFromIndexedDB(gameKey);
    } catch (error) {
      console.warn('IndexedDB delete failed, trying localStorage:', error);
      await this.deleteFromLocalStorage(gameKey);
    }
  }

  /**
   * Delete state from IndexedDB
   */
  private deleteFromIndexedDB(gameKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(gameKey);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete state from localStorage
   */
  private async deleteFromLocalStorage(gameKey: string): Promise<void> {
    try {
      const key = this.LOCALSTORAGE_PREFIX + gameKey;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to delete from localStorage:', error);
    }
  }

  /**
   * List all saved game sessions
   */
  async listSessions(): Promise<Array<{ gameKey: string; lastSaved: number }>> {
    if (this.useLocalStorage || !this.db) {
      return this.listSessionsFromLocalStorage();
    }

    try {
      return await this.listSessionsFromIndexedDB();
    } catch (error) {
      console.warn('IndexedDB list failed, trying localStorage:', error);
      return this.listSessionsFromLocalStorage();
    }
  }

  /**
   * List sessions from IndexedDB
   */
  private listSessionsFromIndexedDB(): Promise<Array<{ gameKey: string; lastSaved: number }>> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const sessions = (request.result as GameState[]).map(state => ({
          gameKey: state.gameKey,
          lastSaved: state.lastSaved
        }));
        resolve(sessions);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * List sessions from localStorage
   */
  private async listSessionsFromLocalStorage(): Promise<Array<{ gameKey: string; lastSaved: number }>> {
    const sessions: Array<{ gameKey: string; lastSaved: number }> = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.LOCALSTORAGE_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const state = JSON.parse(stored) as GameState;
              sessions.push({
                gameKey: state.gameKey,
                lastSaved: state.lastSaved
              });
            } catch (error) {
              // Skip invalid entries
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to list sessions from localStorage:', error);
    }

    return sessions;
  }

  /**
   * Create initial game state
   */
  createInitialState(gameKey: string, questions: Question[]): GameState {
    return {
      schemaVersion: this.SCHEMA_VERSION,
      gameKey,
      currentQuestionIndex: 0,
      selectedQuestionIds: questions.map(q => q.id),
      questions,
      lifelinesUsed: {
        fiftyFifty: false,
        askAudience: false,
        phoneFriend: false
      },
      removedOptions: [],
      audienceVotesActive: false,
      phoneFriendActive: false,
      answeredQuestions: [],
      timerStartTime: null,
      timerDuration: null,
      soundEnabled: true,
      lastSaved: Date.now()
    };
  }

  /**
   * Check if storage is available
   */
  async checkStorageAvailability(): Promise<{
    indexedDB: boolean;
    localStorage: boolean;
    error?: string;
  }> {
    const result = {
      indexedDB: false,
      localStorage: false,
      error: undefined as string | undefined
    };

    // Check IndexedDB
    if ('indexedDB' in window) {
      try {
        const testKey = 'test_' + Date.now();
        const testDB = indexedDB.open('test_db', 1);
        await new Promise((resolve, reject) => {
          testDB.onsuccess = resolve;
          testDB.onerror = reject;
        });
        result.indexedDB = true;
      } catch (error) {
        result.error = 'IndexedDB is not available';
      }
    }

    // Check localStorage
    try {
      const testKey = 'test_storage';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      result.localStorage = true;
    } catch (error) {
      if (!result.error) {
        result.error = 'localStorage is not available';
      }
    }

    return result;
  }
}
