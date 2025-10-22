import { Injectable } from '@angular/core';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Analytics service for tracking Google Analytics events.
 * 
 * This service provides a wrapper around Google Analytics (GA4) to track
 * custom events throughout the application. It respects user privacy by:
 * - Only tracking if GA_MEASUREMENT_ID is configured
 * - Respecting "Do Not Track" browser settings
 * - Anonymizing data where possible
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private isEnabled = false;

  constructor() {
    // Check if GA is loaded and Do Not Track is not enabled
    this.isEnabled = this.checkIfEnabled();
  }

  private checkIfEnabled(): boolean {
    // Respect Do Not Track browser setting
    const doNotTrack = navigator.doNotTrack === '1' || 
                      (window as any).doNotTrack === '1' ||
                      (navigator as any).msDoNotTrack === '1';
    
    if (doNotTrack) {
      console.log('Analytics disabled: Do Not Track is enabled');
      return false;
    }

    // Check if gtag is available (will be loaded if GA_MEASUREMENT_ID is set)
    if (!window.gtag) {
      console.log('Analytics disabled: Google Analytics not loaded');
      return false;
    }

    return true;
  }

  /**
   * Track a custom event
   * @param eventName The name of the event to track
   * @param params Optional parameters to include with the event
   */
  trackEvent(eventName: string, params: Record<string, any> = {}): void {
    if (!this.isEnabled || !window.gtag) {
      return;
    }

    try {
      window.gtag('event', eventName, params);
      console.log('Analytics event tracked:', eventName, params);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  /**
   * Track page view
   * @param pagePath The path of the page being viewed
   */
  trackPageView(pagePath: string): void {
    this.trackEvent('page_view', {
      page_path: pagePath
    });
  }

  /**
   * Track game start event
   * @param gameKey Anonymized/truncated game key for session tracking
   */
  trackGameStart(gameKey: string): void {
    // Truncate gameKey to first 8 characters for privacy
    const anonymizedKey = gameKey.substring(0, 8);
    
    this.trackEvent('game_start', {
      game_key: anonymizedKey
    });
  }

  /**
   * Track game end event
   * @param outcome The outcome of the game (walk_away, win, wrong_answer)
   * @param finalQuestion The final question number reached
   * @param gameKey Anonymized/truncated game key for session tracking
   */
  trackGameEnd(outcome: 'walk_away' | 'win' | 'wrong_answer', finalQuestion: number, gameKey: string): void {
    // Truncate gameKey to first 8 characters for privacy
    const anonymizedKey = gameKey.substring(0, 8);
    
    this.trackEvent('game_end', {
      outcome: outcome,
      final_question: finalQuestion,
      game_key: anonymizedKey
    });
  }

  /**
   * Track lifeline usage
   * @param lifelineType The type of lifeline used
   * @param questionNumber The current question number when lifeline was used
   * @param gameKey Anonymized/truncated game key for session tracking
   */
  trackLifelineUsed(
    lifelineType: 'fifty_fifty' | 'ask_audience' | 'phone_friend',
    questionNumber: number,
    gameKey: string
  ): void {
    // Truncate gameKey to first 8 characters for privacy
    const anonymizedKey = gameKey.substring(0, 8);
    
    this.trackEvent('lifeline_used', {
      type: lifelineType,
      question_number: questionNumber,
      game_key: anonymizedKey
    });
  }

  /**
   * Track question progress
   * @param questionNumber The current question number
   * @param gameKey Anonymized/truncated game key for session tracking
   */
  trackQuestionProgress(questionNumber: number, gameKey: string): void {
    // Truncate gameKey to first 8 characters for privacy
    const anonymizedKey = gameKey.substring(0, 8);
    
    this.trackEvent('question_progress', {
      question_number: questionNumber,
      game_key: anonymizedKey
    });
  }
}
