export type RngState = { state: number };

export interface Rng {
  next(): number;
  nextInt(min: number, max: number): number;
  nextChoice<T>(array: T[]): T;
  getState(): RngState;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function makeRng(seed: number): Rng {
  let s = seed >>> 0;

  function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    nextInt: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    nextChoice: <T>(arr: T[]) => arr[Math.floor(next() * arr.length)],
    getState: (): RngState => ({ state: s }),
  };
}

export function createRng(seed: string): Rng {
  return makeRng(hashStr(seed));
}

export function restoreRng(state: RngState): Rng {
  return makeRng(state.state);
}
