import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {
  constructor(private http: HttpClient) {}

  loadQuestions(): Observable<Question[]> {
    return this.http.get('questions.csv', { responseType: 'text' }).pipe(
      map(data => this.parseCSV(data))
    );
  }

  private parseCSV(data: string): Question[] {
    const lines = data.split('\n').filter(line => line.trim());
    const questions: Question[] = [];
    
    // Skip header row (index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = this.parseCSVLine(line);
      
      if (values.length >= 8) {
        const id = parseInt(values[0]);
        const question = values[1];
        const optionA = values[2];
        const optionB = values[3];
        const optionC = values[4];
        const optionD = values[5];
        const correctAnswerLetter = values[6].trim();
        const difficulty = values[7];
        
        // Convert letter (A, B, C, D) to index (0, 1, 2, 3)
        const correctAnswer = correctAnswerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
        
        questions.push({
          id,
          question,
          options: [optionA, optionB, optionC, optionD],
          correctAnswer,
          difficulty
        });
      }
    }
    
    return questions;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    return values;
  }

  sortQuestionsByDifficulty(questions: Question[]): Question[] {
    const difficultyOrder: { [key: string]: number } = {
      'Easy': 1,
      'Intermediate': 2,
      'Hard': 3,
      'Very Hard': 4,
      'Expert': 5
    };
    
    return questions.sort((a, b) => {
      const orderA = difficultyOrder[a.difficulty] || 999;
      const orderB = difficultyOrder[b.difficulty] || 999;
      return orderA - orderB;
    });
  }

  selectQuestionsWithProgression(questions: Question[]): Question[] {
    // Difficulty progression configuration
    const progression = [
      { difficulty: 'Easy', count: 3 },          // Q1-3
      { difficulty: 'Intermediate', count: 3 },  // Q4-6
      { difficulty: 'Hard', count: 3 },          // Q7-9
      { difficulty: 'Very Hard', count: 3 },     // Q10-12
      { difficulty: 'Expert', count: 3 }         // Q13-15
    ];

    const selectedQuestions: Question[] = [];
    const usedIds = new Set<number>();

    // Group questions by difficulty
    const questionsByDifficulty: { [key: string]: Question[] } = {};
    questions.forEach(q => {
      if (!questionsByDifficulty[q.difficulty]) {
        questionsByDifficulty[q.difficulty] = [];
      }
      questionsByDifficulty[q.difficulty].push(q);
    });

    // Select questions for each difficulty level
    progression.forEach(level => {
      const pool = questionsByDifficulty[level.difficulty] || [];
      const availableQuestions = pool.filter(q => !usedIds.has(q.id));
      
      // Randomly select questions from the pool
      const selected = this.selectRandomQuestions(availableQuestions, level.count);
      
      // If we don't have enough questions, try to get from unused questions in same pool
      if (selected.length < level.count && availableQuestions.length < level.count) {
        // Graceful fallback: shuffle the pool and reuse if needed
        const shuffled = this.shuffleArray([...pool]);
        for (let i = 0; i < level.count && shuffled.length > 0; i++) {
          if (!usedIds.has(shuffled[i % shuffled.length].id) || selected.length < level.count) {
            const question = shuffled[i % shuffled.length];
            if (!selectedQuestions.find(q => q.id === question.id)) {
              selected.push(question);
            }
          }
        }
      }

      selected.forEach(q => {
        selectedQuestions.push(q);
        usedIds.add(q.id);
      });
    });

    return selectedQuestions;
  }

  private selectRandomQuestions(questions: Question[], count: number): Question[] {
    const shuffled = this.shuffleArray([...questions]);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
