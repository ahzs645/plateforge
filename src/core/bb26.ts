/**
 * Bijective base-26 ("spreadsheet column") helpers: A=1 … Z=26, AA=27 …
 * Same semantics as the `bb26` package used by license-plate-serial-generator:
 * ranges include the lower bound and exclude the upper bound.
 */
import type { Rng } from './random';

export function toNumber(s: string): number {
  let n = 0;
  for (const ch of s.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

export function toString(n: number): string {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Every string in [start, end). With one argument: [A, start). */
export function range(start: string, end?: string): string[] {
  const lo = end === undefined ? 1 : toNumber(start);
  const hi = toNumber(end ?? start);
  const out: string[] = [];
  for (let n = lo; n < hi; n++) out.push(toString(n));
  return out;
}

/** Random string in [lower, upper). With one argument: [A, lower). */
export function randomBb26(rng: Rng, lower: string, upper?: string): string {
  const lo = upper === undefined ? 1 : toNumber(lower);
  const hi = toNumber(upper ?? lower);
  return toString(rng.int(lo, hi - 1));
}
