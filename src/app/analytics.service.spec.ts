import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    // Reset window.gtag before each test
    delete (window as any).gtag;
    delete (window as any).dataLayer;
    
    // Reset Do Not Track
    Object.defineProperty(navigator, 'doNotTrack', {
      writable: true,
      configurable: true,
      value: '0'
    });
    
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    service = TestBed.inject(AnalyticsService);
    expect(service).toBeTruthy();
  });

  it('should not track events when gtag is not available', () => {
    service = TestBed.inject(AnalyticsService);
    
    service.trackEvent('test_event', { param: 'value' });
    
    // Should not throw error, just silently skip (already logged in constructor)
  });

  it('should track events when gtag is available', () => {
    // Mock gtag
    const mockGtag = jasmine.createSpy('gtag');
    (window as any).gtag = mockGtag;
    
    service = TestBed.inject(AnalyticsService);
    
    service.trackEvent('test_event', { param: 'value' });
    
    expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', { param: 'value' });
  });

  it('should not track when Do Not Track is enabled', () => {
    // Enable Do Not Track
    Object.defineProperty(navigator, 'doNotTrack', {
      writable: true,
      configurable: true,
      value: '1'
    });
    
    const mockGtag = jasmine.createSpy('gtag');
    (window as any).gtag = mockGtag;
    
    service = TestBed.inject(AnalyticsService);
    
    service.trackEvent('test_event', { param: 'value' });
    
    expect(mockGtag).not.toHaveBeenCalled();
  });

  it('should track game start event with anonymized key', () => {
    const mockGtag = jasmine.createSpy('gtag');
    (window as any).gtag = mockGtag;
    
    service = TestBed.inject(AnalyticsService);
    
    service.trackGameStart('1234567890abcdef');
    
    expect(mockGtag).toHaveBeenCalledWith('event', 'game_start', {
      game_key: '12345678' // Truncated to 8 characters
    });
  });

  it('should track game end event with outcome', () => {
    const mockGtag = jasmine.createSpy('gtag');
    (window as any).gtag = mockGtag;
    
    service = TestBed.inject(AnalyticsService);
    
    service.trackGameEnd('win', 15, '1234567890abcdef');
    
    expect(mockGtag).toHaveBeenCalledWith('event', 'game_end', {
      outcome: 'win',
      final_question: 15,
      game_key: '12345678'
    });
  });

  it('should track lifeline usage', () => {
    const mockGtag = jasmine.createSpy('gtag');
    (window as any).gtag = mockGtag;
    
    service = TestBed.inject(AnalyticsService);
    
    service.trackLifelineUsed('fifty_fifty', 5, '1234567890abcdef');
    
    expect(mockGtag).toHaveBeenCalledWith('event', 'lifeline_used', {
      type: 'fifty_fifty',
      question_number: 5,
      game_key: '12345678'
    });
  });

  it('should track question progress', () => {
    const mockGtag = jasmine.createSpy('gtag');
    (window as any).gtag = mockGtag;
    
    service = TestBed.inject(AnalyticsService);
    
    service.trackQuestionProgress(7, '1234567890abcdef');
    
    expect(mockGtag).toHaveBeenCalledWith('event', 'question_progress', {
      question_number: 7,
      game_key: '12345678'
    });
  });

  it('should track page view', () => {
    const mockGtag = jasmine.createSpy('gtag');
    (window as any).gtag = mockGtag;
    
    service = TestBed.inject(AnalyticsService);
    
    service.trackPageView('/game');
    
    expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/game'
    });
  });

  it('should handle errors gracefully when tracking fails', () => {
    const mockGtag = jasmine.createSpy('gtag').and.throwError('Network error');
    (window as any).gtag = mockGtag;
    
    service = TestBed.inject(AnalyticsService);
    spyOn(console, 'error');
    
    service.trackEvent('test_event', { param: 'value' });
    
    expect(console.error).toHaveBeenCalledWith('Error tracking analytics event:', jasmine.any(Error));
  });
});
