import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { GameUrlService } from './game-url.service';

describe('GameUrlService', () => {
  let service: GameUrlService;
  let location: jasmine.SpyObj<Location>;

  beforeEach(() => {
    const locationSpy = jasmine.createSpyObj('Location', ['replaceState']);

    TestBed.configureTestingModule({
      providers: [
        GameUrlService,
        { provide: Location, useValue: locationSpy }
      ]
    });
    service = TestBed.inject(GameUrlService);
    location = TestBed.inject(Location) as jasmine.SpyObj<Location>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getGameKeyFromUrl', () => {
    it('should return null when no game key in URL', () => {
      // Reset URL
      window.history.replaceState({}, '', window.location.pathname);
      
      const gameKey = service.getGameKeyFromUrl();
      expect(gameKey).toBeNull();
    });

    it('should extract game key from URL', () => {
      const testKey = 'G_test_123';
      window.history.replaceState({}, '', `${window.location.pathname}?game=${testKey}`);
      
      const gameKey = service.getGameKeyFromUrl();
      expect(gameKey).toBe(testKey);
    });

    it('should handle URL with multiple parameters', () => {
      const testKey = 'G_multi_456';
      window.history.replaceState({}, '', `${window.location.pathname}?game=${testKey}&other=value`);
      
      const gameKey = service.getGameKeyFromUrl();
      expect(gameKey).toBe(testKey);
    });
  });

  describe('setGameKeyInUrl', () => {
    it('should call location.replaceState with game parameter', () => {
      const testKey = 'G_new_789';
      service.setGameKeyInUrl(testKey);
      
      expect(location.replaceState).toHaveBeenCalled();
      const callArgs = location.replaceState.calls.mostRecent().args[0];
      expect(callArgs).toContain('game=' + testKey);
    });
  });

  describe('removeGameKeyFromUrl', () => {
    it('should call location.replaceState', () => {
      service.removeGameKeyFromUrl();
      expect(location.replaceState).toHaveBeenCalled();
    });
  });

  describe('hasGameKeyInUrl', () => {
    it('should return false when no game key', () => {
      window.history.replaceState({}, '', window.location.pathname);
      expect(service.hasGameKeyInUrl()).toBe(false);
    });

    it('should return true when game key exists', () => {
      window.history.replaceState({}, '', `${window.location.pathname}?game=G_exists_555`);
      expect(service.hasGameKeyInUrl()).toBe(true);
    });
  });
});
