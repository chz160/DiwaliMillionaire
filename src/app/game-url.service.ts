import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

/**
 * Service for managing game session keys in the URL
 */
@Injectable({
  providedIn: 'root'
})
export class GameUrlService {
  private readonly PARAM_NAME = 'game';

  constructor(private location: Location) {}

  /**
   * Get the game key from the current URL
   */
  getGameKeyFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get(this.PARAM_NAME);
  }

  /**
   * Set the game key in the URL without reloading the page
   */
  setGameKeyInUrl(gameKey: string): void {
    const url = new URL(window.location.href);
    url.searchParams.set(this.PARAM_NAME, gameKey);
    
    // Use history.replaceState to avoid page reload
    this.location.replaceState(url.pathname + url.search);
  }

  /**
   * Remove the game key from the URL
   */
  removeGameKeyFromUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete(this.PARAM_NAME);
    
    this.location.replaceState(url.pathname + (url.search || ''));
  }

  /**
   * Check if URL has a game key parameter
   */
  hasGameKeyInUrl(): boolean {
    return this.getGameKeyFromUrl() !== null;
  }
}
