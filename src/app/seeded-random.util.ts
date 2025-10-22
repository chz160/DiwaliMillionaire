/**
 * Seeded random number generator for deterministic shuffling
 * Uses a simple Linear Congruential Generator (LCG) algorithm
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    // LCG parameters (values from Numerical Recipes)
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    
    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm with seeded randomness
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Create a seed from a game key and question ID for deterministic shuffling
 */
export function createShuffleSeed(gameKey: string, questionId: number): number {
  // Simple hash function to create a seed from game key and question ID
  let hash = questionId;
  for (let i = 0; i < gameKey.length; i++) {
    hash = ((hash << 5) - hash) + gameKey.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Shuffle answer options deterministically based on game key and question ID
 */
export function shuffleOptions(gameKey: string, questionId: number): number[] {
  const seed = createShuffleSeed(gameKey, questionId);
  const rng = new SeededRandom(seed);
  return rng.shuffle([0, 1, 2, 3]);
}
