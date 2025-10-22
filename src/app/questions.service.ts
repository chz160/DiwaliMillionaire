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
}
