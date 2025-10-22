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
});
