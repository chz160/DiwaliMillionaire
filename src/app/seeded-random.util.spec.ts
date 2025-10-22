import { SeededRandom, createShuffleSeed, shuffleOptions } from './seeded-random.util';

describe('SeededRandom', () => {
  it('should generate deterministic random numbers', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    const values1 = [rng1.next(), rng1.next(), rng1.next()];
    const values2 = [rng2.next(), rng2.next(), rng2.next()];

    expect(values1).toEqual(values2);
  });

  it('should generate different sequences for different seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(54321);

    const values1 = [rng1.next(), rng1.next(), rng1.next()];
    const values2 = [rng2.next(), rng2.next(), rng2.next()];

    expect(values1).not.toEqual(values2);
  });

  it('should generate numbers between 0 and 1', () => {
    const rng = new SeededRandom(12345);
    
    for (let i = 0; i < 100; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('should generate integers in specified range', () => {
    const rng = new SeededRandom(12345);
    
    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(0, 4);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(4);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('should shuffle arrays deterministically', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    const array1 = rng1.shuffle([0, 1, 2, 3]);
    const array2 = rng2.shuffle([0, 1, 2, 3]);

    expect(array1).toEqual(array2);
  });

  it('should not modify original array when shuffling', () => {
    const rng = new SeededRandom(12345);
    const original = [0, 1, 2, 3];
    const shuffled = rng.shuffle(original);

    expect(original).toEqual([0, 1, 2, 3]);
    expect(shuffled).not.toBe(original);
  });

  it('should contain all original elements after shuffle', () => {
    const rng = new SeededRandom(12345);
    const shuffled = rng.shuffle([0, 1, 2, 3]);

    expect(shuffled.sort()).toEqual([0, 1, 2, 3]);
  });
});

describe('createShuffleSeed', () => {
  it('should generate same seed for same inputs', () => {
    const seed1 = createShuffleSeed('GAME_123', 1);
    const seed2 = createShuffleSeed('GAME_123', 1);

    expect(seed1).toBe(seed2);
  });

  it('should generate different seeds for different game keys', () => {
    const seed1 = createShuffleSeed('GAME_123', 1);
    const seed2 = createShuffleSeed('GAME_456', 1);

    expect(seed1).not.toBe(seed2);
  });

  it('should generate different seeds for different question IDs', () => {
    const seed1 = createShuffleSeed('GAME_123', 1);
    const seed2 = createShuffleSeed('GAME_123', 2);

    expect(seed1).not.toBe(seed2);
  });

  it('should always return positive numbers', () => {
    for (let i = 0; i < 100; i++) {
      const seed = createShuffleSeed(`GAME_${i}`, i);
      expect(seed).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('shuffleOptions', () => {
  it('should return deterministic shuffle for same inputs', () => {
    const order1 = shuffleOptions('GAME_123', 1);
    const order2 = shuffleOptions('GAME_123', 1);

    expect(order1).toEqual(order2);
  });

  it('should return different orders for different game keys', () => {
    const order1 = shuffleOptions('GAME_123', 1);
    const order2 = shuffleOptions('GAME_456', 1);

    // Very unlikely to be the same
    expect(order1).not.toEqual(order2);
  });

  it('should return different orders for different question IDs', () => {
    const order1 = shuffleOptions('GAME_123', 1);
    const order2 = shuffleOptions('GAME_123', 2);

    // Very unlikely to be the same
    expect(order1).not.toEqual(order2);
  });

  it('should always return array with 4 elements', () => {
    const order = shuffleOptions('GAME_123', 1);
    expect(order.length).toBe(4);
  });

  it('should contain all indices 0-3', () => {
    const order = shuffleOptions('GAME_123', 1);
    expect(order.sort()).toEqual([0, 1, 2, 3]);
  });

  it('should produce varied distributions over many shuffles', () => {
    const firstPositions: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0 };
    
    // Test 100 different shuffles
    for (let i = 0; i < 100; i++) {
      const order = shuffleOptions(`GAME_${i}`, 1);
      firstPositions[order[0]]++;
    }

    // Each option should appear in first position at least once
    // (statistically very likely with 100 shuffles)
    expect(firstPositions[0]).toBeGreaterThan(0);
    expect(firstPositions[1]).toBeGreaterThan(0);
    expect(firstPositions[2]).toBeGreaterThan(0);
    expect(firstPositions[3]).toBeGreaterThan(0);
  });
});
