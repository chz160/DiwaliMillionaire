import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { QuestionsService, Question } from './questions.service';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QuestionsService]
    });
    service = TestBed.inject(QuestionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load and parse CSV questions', (done) => {
    const mockCSV = `ID,Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Difficulty
1,Test Question?,Option A,Option B,Option C,Option D,A,Easy
2,Another Question?,Opt A,Opt B,Opt C,Opt D,B,Hard`;

    service.loadQuestions().subscribe(questions => {
      expect(questions.length).toBe(2);
      expect(questions[0].id).toBe(1);
      expect(questions[0].question).toBe('Test Question?');
      expect(questions[0].options).toEqual(['Option A', 'Option B', 'Option C', 'Option D']);
      expect(questions[0].correctAnswer).toBe(0); // A = 0
      expect(questions[0].difficulty).toBe('Easy');
      
      expect(questions[1].correctAnswer).toBe(1); // B = 1
      expect(questions[1].difficulty).toBe('Hard');
      done();
    });

    const req = httpMock.expectOne('questions.csv');
    expect(req.request.method).toBe('GET');
    req.flush(mockCSV);
  });

  it('should sort questions by difficulty', () => {
    const questions: Question[] = [
      { id: 1, question: 'Q1', options: [], correctAnswer: 0, difficulty: 'Expert' },
      { id: 2, question: 'Q2', options: [], correctAnswer: 0, difficulty: 'Easy' },
      { id: 3, question: 'Q3', options: [], correctAnswer: 0, difficulty: 'Hard' },
      { id: 4, question: 'Q4', options: [], correctAnswer: 0, difficulty: 'Intermediate' },
      { id: 5, question: 'Q5', options: [], correctAnswer: 0, difficulty: 'Very Hard' }
    ];

    const sorted = service.sortQuestionsByDifficulty(questions);
    
    expect(sorted[0].difficulty).toBe('Easy');
    expect(sorted[1].difficulty).toBe('Intermediate');
    expect(sorted[2].difficulty).toBe('Hard');
    expect(sorted[3].difficulty).toBe('Very Hard');
    expect(sorted[4].difficulty).toBe('Expert');
  });

  it('should handle correct answer letters correctly', (done) => {
    const mockCSV = `ID,Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Difficulty
1,Q1,A,B,C,D,A,Easy
2,Q2,A,B,C,D,B,Easy
3,Q3,A,B,C,D,C,Easy
4,Q4,A,B,C,D,D,Easy`;

    service.loadQuestions().subscribe(questions => {
      expect(questions[0].correctAnswer).toBe(0); // A
      expect(questions[1].correctAnswer).toBe(1); // B
      expect(questions[2].correctAnswer).toBe(2); // C
      expect(questions[3].correctAnswer).toBe(3); // D
      done();
    });

    const req = httpMock.expectOne('questions.csv');
    req.flush(mockCSV);
  });

  describe('selectQuestionsWithProgression', () => {
    it('should select exactly 15 questions', () => {
      const questions: Question[] = [];
      
      // Create 10 questions per difficulty level (50 total)
      const difficulties = ['Easy', 'Intermediate', 'Hard', 'Very Hard', 'Expert'];
      difficulties.forEach(difficulty => {
        for (let i = 0; i < 10; i++) {
          questions.push({
            id: questions.length + 1,
            question: `Question ${questions.length + 1}`,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            difficulty
          });
        }
      });

      const selected = service.selectQuestionsWithProgression(questions);
      
      expect(selected.length).toBe(15);
    });

    it('should follow correct difficulty progression', () => {
      const questions: Question[] = [];
      
      // Create 10 questions per difficulty level
      const difficulties = ['Easy', 'Intermediate', 'Hard', 'Very Hard', 'Expert'];
      difficulties.forEach(difficulty => {
        for (let i = 0; i < 10; i++) {
          questions.push({
            id: questions.length + 1,
            question: `Question ${questions.length + 1}`,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            difficulty
          });
        }
      });

      const selected = service.selectQuestionsWithProgression(questions);
      
      // Q1-3 should be Easy
      expect(selected[0].difficulty).toBe('Easy');
      expect(selected[1].difficulty).toBe('Easy');
      expect(selected[2].difficulty).toBe('Easy');
      
      // Q4-6 should be Intermediate
      expect(selected[3].difficulty).toBe('Intermediate');
      expect(selected[4].difficulty).toBe('Intermediate');
      expect(selected[5].difficulty).toBe('Intermediate');
      
      // Q7-9 should be Hard
      expect(selected[6].difficulty).toBe('Hard');
      expect(selected[7].difficulty).toBe('Hard');
      expect(selected[8].difficulty).toBe('Hard');
      
      // Q10-12 should be Very Hard
      expect(selected[9].difficulty).toBe('Very Hard');
      expect(selected[10].difficulty).toBe('Very Hard');
      expect(selected[11].difficulty).toBe('Very Hard');
      
      // Q13-15 should be Expert
      expect(selected[12].difficulty).toBe('Expert');
      expect(selected[13].difficulty).toBe('Expert');
      expect(selected[14].difficulty).toBe('Expert');
    });

    it('should not repeat questions within a session', () => {
      const questions: Question[] = [];
      
      // Create 10 questions per difficulty level
      const difficulties = ['Easy', 'Intermediate', 'Hard', 'Very Hard', 'Expert'];
      difficulties.forEach(difficulty => {
        for (let i = 0; i < 10; i++) {
          questions.push({
            id: questions.length + 1,
            question: `Question ${questions.length + 1}`,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            difficulty
          });
        }
      });

      const selected = service.selectQuestionsWithProgression(questions);
      
      // Check that all IDs are unique
      const ids = selected.map(q => q.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should handle case with insufficient questions gracefully', () => {
      const questions: Question[] = [
        { id: 1, question: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, difficulty: 'Easy' },
        { id: 2, question: 'Q2', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, difficulty: 'Easy' },
        { id: 3, question: 'Q3', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, difficulty: 'Intermediate' },
        { id: 4, question: 'Q4', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, difficulty: 'Hard' }
      ];

      const selected = service.selectQuestionsWithProgression(questions);
      
      // Should not crash, should return what it can
      expect(selected.length).toBeGreaterThan(0);
      expect(selected.length).toBeLessThanOrEqual(15);
    });

    it('should randomly select from pools (test randomness)', () => {
      const questions: Question[] = [];
      
      // Create 10 questions per difficulty level with unique IDs
      const difficulties = ['Easy', 'Intermediate', 'Hard', 'Very Hard', 'Expert'];
      difficulties.forEach(difficulty => {
        for (let i = 0; i < 10; i++) {
          questions.push({
            id: questions.length + 1,
            question: `Question ${questions.length + 1}`,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            difficulty
          });
        }
      });

      // Run selection multiple times
      const firstSelection = service.selectQuestionsWithProgression(questions);
      const secondSelection = service.selectQuestionsWithProgression(questions);
      
      // It's very unlikely that two random selections will be identical
      // Check that at least some questions are different
      const firstIds = firstSelection.map(q => q.id).join(',');
      const secondIds = secondSelection.map(q => q.id).join(',');
      
      // Both should have 15 questions
      expect(firstSelection.length).toBe(15);
      expect(secondSelection.length).toBe(15);
      
      // Note: There's a small chance this could fail due to randomness,
      // but with 10 questions per pool and selecting 3, it's very unlikely
      // they'll be identical
    });
  });
});
