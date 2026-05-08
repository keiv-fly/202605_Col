import { describe, it, expect } from 'vitest';
import { createRng, restoreRng } from '../game/rng';

describe('RNG', () => {
  it('same seed produces same sequence', () => {
    const rng1 = createRng('test-seed');
    const rng2 = createRng('test-seed');
    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());
    expect(seq1).toEqual(seq2);
  });

  it('different seeds produce different sequences', () => {
    const rng1 = createRng('seed-alpha');
    const rng2 = createRng('seed-beta');
    const val1 = rng1.next();
    const val2 = rng2.next();
    expect(val1).not.toBe(val2);
  });

  it('nextInt stays in range', () => {
    const rng = createRng('range-test');
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it('nextChoice picks from array', () => {
    const rng = createRng('choice-test');
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 100; i++) {
      const val = rng.nextChoice(arr);
      expect(arr).toContain(val);
    }
  });

  it('getState and restoreRng restore determinism', () => {
    const rng = createRng('restore-test');
    // Advance 5 steps
    for (let i = 0; i < 5; i++) rng.next();
    // Save state
    const saved = rng.getState();
    // Advance 5 more and record
    const valuesAfterSave = Array.from({ length: 5 }, () => rng.next());
    // Restore and advance 5 more
    const rng2 = restoreRng(saved);
    const valuesAfterRestore = Array.from({ length: 5 }, () => rng2.next());
    expect(valuesAfterRestore).toEqual(valuesAfterSave);
  });
});
