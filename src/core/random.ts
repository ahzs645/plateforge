/**
 * Seedable random source. Every generator receives an `Rng` instead of calling
 * `Math.random()` directly, so a seed always reproduces the same batch.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] (inclusive). With one argument: [0, min]. */
  int(min: number, max?: number): number;
  /** Random element of a non-empty array or string. */
  pick<T>(items: readonly T[]): T;
  pick(items: string): string;
  /** Returns true with probability `p`. */
  chance(p: number): boolean;
  /** Returns a shuffled copy. */
  shuffle<T>(items: readonly T[]): T[];
}

/** Hashes an arbitrary string seed into a 32-bit integer (xmur3). */
function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 PRNG — tiny, fast and good enough for plate serials. */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed?: string | number): Rng {
  const next =
    seed === undefined || seed === ''
      ? Math.random
      : mulberry32(typeof seed === 'number' ? seed >>> 0 : hashSeed(seed));

  const int = (min: number, max?: number) => {
    const lo = max === undefined ? 0 : min;
    const hi = max === undefined ? min : max;
    return lo + Math.floor(next() * (hi - lo + 1));
  };

  return {
    next,
    int,
    pick: (items: readonly unknown[] | string) => items[int(items.length - 1)],
    chance: (p) => next() < p,
    shuffle<T>(items: readonly T[]) {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(i);
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  } as Rng;
}

/** Zero-padded random number. Mirrors `randomNumericString` from license-plate-serial-generator. */
export function numeric(rng: Rng, lower: number, upper?: number, length?: number): string {
  const lo = upper === undefined ? 0 : lower;
  const hi = upper === undefined ? lower : upper;
  return `${rng.int(lo, hi)}`.padStart(length ?? `${hi}`.length, '0');
}
