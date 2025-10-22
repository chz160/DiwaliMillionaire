import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameSessionResult } from './game-session-result.model';
import { GameResultService } from './game-result.service';

@Component({
  selector: 'app-game-summary',
  imports: [CommonModule],
  templateUrl: './game-summary.component.html',
  styleUrl: './game-summary.component.css'
})
export class GameSummaryComponent {
  private gameResultService = inject(GameResultService);

  @Input({ required: true }) result!: GameSessionResult;
  @Output() playAgain = new EventEmitter<void>();
  @Output() reviewAnswers = new EventEmitter<void>();

  showReview = false;

  getHeadline(): string {
    return this.gameResultService.getHeadline(this.result);
  }

  getEndReasonDescription(): string {
    return this.gameResultService.getEndReasonDescription(this.result.endReason);
  }

  getStatistics() {
    return this.gameResultService.getStatistics(this.result);
  }

  onPlayAgain(): void {
    this.playAgain.emit();
  }

  onReviewAnswers(): void {
    this.showReview = !this.showReview;
  }

  onShare(): void {
    const stats = this.getStatistics();
    const shareText = `I just played Diwali Millionaire and won ${this.result.finalPrize}! ` +
      `Reached Q${stats.highestQuestion}/${this.result.totalQuestions} with ${stats.accuracy}% accuracy. 🪔✨`;
    
    // Try to use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'Diwali Millionaire',
        text: shareText
      }).catch(() => {
        // If share fails, fall back to clipboard
        this.copyToClipboard(shareText);
      });
    } else {
      // Fall back to clipboard
      this.copyToClipboard(shareText);
    }
  }

  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      alert('Results copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Results copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
      document.body.removeChild(textArea);
    });
  }

  getOptionLetter(index: number): string {
    return ['A', 'B', 'C', 'D'][index];
  }

  getLifelineIcon(lifeline: 'fiftyFifty' | 'askAudience' | 'phoneFriend'): string {
    const icons = {
      fiftyFifty: '50:50',
      askAudience: '👥',
      phoneFriend: '📞'
    };
    return icons[lifeline];
  }

  getLifelineLabel(lifeline: 'fiftyFifty' | 'askAudience' | 'phoneFriend'): string {
    const labels = {
      fiftyFifty: '50:50',
      askAudience: 'Audience',
      phoneFriend: 'Phone'
    };
    return labels[lifeline];
  }
}
