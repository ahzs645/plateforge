/**
 * Serial pattern DSL — the "standard" way to describe a plate format.
 *
 *   A        uppercase letter (minus `exclude`)
 *   9        digit
 *   *        letter or digit (minus `exclude`)
 *   [A-HJ]   explicit character class (ranges allowed)
 *   {name}   named character set passed in `sets`
 *   \x       literal x
 *   anything else is a literal (space, dash, dot, ·, …)
 *
 * A compiled pattern can generate serials and validate user input.
 */
import type { Rng } from './random';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';

export interface PatternOptions {
  /** Characters removed from `A` and `*` (e.g. 'IOQ'). */
  exclude?: string;
  /** Named sets usable as `{name}`. */
  sets?: Record<string, string>;
}

type Token = { kind: 'set'; chars: string } | { kind: 'literal'; value: string };

export interface CompiledPattern {
  source: string;
  tokens: Token[];
  generate(rng: Rng): string;
  regex: RegExp;
  test(serial: string): boolean;
  /** Number of distinct serials this pattern can produce. */
  capacity: number;
}

function expandClass(body: string): string {
  let out = '';
  for (let i = 0; i < body.length; i++) {
    if (body[i + 1] === '-' && i + 2 < body.length) {
      const from = body.charCodeAt(i);
      const to = body.charCodeAt(i + 2);
      for (let c = from; c <= to; c++) out += String.fromCharCode(c);
      i += 2;
    } else {
      out += body[i];
    }
  }
  return out;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');

export function compilePattern(source: string, options: PatternOptions = {}): CompiledPattern {
  const strip = (chars: string) =>
    options.exclude ? [...chars].filter((c) => !options.exclude!.includes(c)).join('') : chars;
  const tokens: Token[] = [];

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === 'A') tokens.push({ kind: 'set', chars: strip(LETTERS) });
    else if (ch === '9') tokens.push({ kind: 'set', chars: DIGITS });
    else if (ch === '*') tokens.push({ kind: 'set', chars: strip(LETTERS) + DIGITS });
    else if (ch === '[') {
      const end = source.indexOf(']', i);
      if (end < 0) throw new Error(`Unclosed [ in pattern "${source}"`);
      tokens.push({ kind: 'set', chars: expandClass(source.slice(i + 1, end)) });
      i = end;
    } else if (ch === '{') {
      const end = source.indexOf('}', i);
      const name = source.slice(i + 1, end);
      const chars = options.sets?.[name];
      if (end < 0 || !chars) throw new Error(`Unknown set {${name}} in pattern "${source}"`);
      tokens.push({ kind: 'set', chars });
      i = end;
    } else if (ch === '\\') {
      tokens.push({ kind: 'literal', value: source[++i] });
    } else {
      tokens.push({ kind: 'literal', value: ch });
    }
  }

  const regex = new RegExp(
    '^' +
      tokens
        .map((t) => (t.kind === 'literal' ? escapeRe(t.value) : `[${escapeRe(t.chars)}]`))
        .join('') +
      '$',
  );

  return {
    source,
    tokens,
    regex,
    capacity: tokens.reduce((n, t) => (t.kind === 'set' ? n * t.chars.length : n), 1),
    test: (serial) => regex.test(serial),
    generate: (rng) =>
      tokens.map((t) => (t.kind === 'literal' ? t.value : rng.pick(t.chars))).join(''),
  };
}
