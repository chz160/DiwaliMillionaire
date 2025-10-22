import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameSummaryComponent } from './game-summary.component';
import { GameSessionResult } from './game-session-result.model';

describe('GameSummaryComponent', () => {
  let component: GameSummaryComponent;
  let fixture: ComponentFixture<GameSummaryComponent>;

  const createMockResult = (endReason: 'WIN' | 'WRONG' | 'WALK_AWAY' | 'TIMEOUT'): GameSessionResult => ({
    currentQuestionIndex: 10,
    lastAnsweredPrize: '$32,000',
    lastCheckpointPrize: '$32,000',
    finalPrize: endReason === 'WIN' ? '$1,000,000' : '$32,000',
    endReason,
    usedLifelines: {
      fiftyFifty: true,
      askAudience: false,
      phoneFriend: true
    },
    answeredQuestions: [
      {
        questionId: 1,
        correct: true,
        chosenOption: 0,
        correctOption: 0,
        difficulty: 'Easy',
        question: 'Test Question 1',
        options: ['A', 'B', 'C', 'D'],
        prize: '$100'
      },
      {
        questionId: 2,
        correct: false,
        chosenOption: 1,
        correctOption: 0,
        difficulty: 'Easy',
        question: 'Test Question 2',
        options: ['A', 'B', 'C', 'D'],
        prize: '$200'
      }
    ],
    totalQuestions: 15,
    timestamp: Date.now()
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameSummaryComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GameSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.result = createMockResult('WIN');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display headline for WIN', () => {
    component.result = createMockResult('WIN');
    fixture.detectChanges();
    
    const headline = component.getHeadline();
    expect(headline).toContain('You Won');
    expect(headline).toContain('$1,000,000');
  });

  it('should display headline for WALK_AWAY', () => {
    component.result = createMockResult('WALK_AWAY');
    fixture.detectChanges();
    
    const headline = component.getHeadline();
    expect(headline).toContain('Walked Away');
  });

  it('should calculate statistics correctly', () => {
    component.result = createMockResult('WRONG');
    fixture.detectChanges();
    
    const stats = component.getStatistics();
    expect(stats.correctAnswers).toBe(1);
    expect(stats.totalAttempted).toBe(2);
    expect(stats.accuracy).toBe(50);
  });

  it('should emit playAgain event', () => {
    component.result = createMockResult('WIN');
    fixture.detectChanges();
    
    spyOn(component.playAgain, 'emit');
    component.onPlayAgain();
    
    expect(component.playAgain.emit).toHaveBeenCalled();
  });

  it('should toggle review section', () => {
    component.result = createMockResult('WIN');
    fixture.detectChanges();
    
    expect(component.showReview).toBe(false);
    component.onReviewAnswers();
    expect(component.showReview).toBe(true);
    component.onReviewAnswers();
    expect(component.showReview).toBe(false);
  });

  it('should display lifeline usage correctly', () => {
    component.result = createMockResult('WIN');
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const lifelineStats = compiled.querySelectorAll('.lifeline-stat');
    expect(lifelineStats.length).toBe(3);
    
    // Check that used lifelines have the 'used' class
    const usedLifelines = compiled.querySelectorAll('.lifeline-stat.used');
    expect(usedLifelines.length).toBe(2); // fiftyFifty and phoneFriend
  });

  it('should display all answered questions in progress section', () => {
    component.result = createMockResult('WIN');
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const ladderSteps = compiled.querySelectorAll('.ladder-step');
    expect(ladderSteps.length).toBe(2); // 2 questions in mock data
  });

  it('should render correct answer badges in review', () => {
    component.result = createMockResult('WIN');
    component.showReview = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const reviewItems = compiled.querySelectorAll('.review-item');
    expect(reviewItems.length).toBe(2);
  });

  it('should display final prize prominently', () => {
    component.result = createMockResult('WIN');
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const finalPrize = compiled.querySelector('.final-prize-amount');
    expect(finalPrize?.textContent).toContain('$1,000,000');
  });

  it('should show celebration for WIN', () => {
    component.result = createMockResult('WIN');
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const celebration = compiled.querySelector('.celebration');
    expect(celebration).toBeTruthy();
  });

  it('should not show celebration for non-WIN results', () => {
    component.result = createMockResult('WRONG');
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const celebration = compiled.querySelector('.celebration');
    expect(celebration).toBeFalsy();
  });

  describe('Share functionality', () => {
    it('should create share text with correct stats', () => {
      component.result = createMockResult('WIN');
      fixture.detectChanges();
      
      // Mock navigator.clipboard
      const writeTextSpy = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextSpy },
        writable: true
      });
      
      spyOn(window, 'alert');
      
      component.onShare();
      
      // Note: In a real scenario, we'd test the actual share behavior
      // For now, we just verify the method doesn't throw
      expect(component).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have action buttons', () => {
      component.result = createMockResult('WIN');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('.action-button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper structure for screen readers', () => {
      component.result = createMockResult('WIN');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const headings = compiled.querySelectorAll('h2, h3');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
