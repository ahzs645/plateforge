import type { FontAsset } from './types';

const quoted = (value: string): string => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\n\r\f]/g, '\\a ').replace(/</g, '\\3c ')}"`;
export const fontWeightRange = (weight: FontAsset['weight']): [number, number] => {
  const values = String(weight ?? 400).trim().split(/\s+/).map(Number);
  if (values.length > 2 || values.some((n) => !Number.isFinite(n) || n < 1 || n > 1000)) throw new RangeError('Invalid font weight');
  const [a, b = a] = values;
  if (b < a) throw new RangeError('Reversed font weight range');
  return [a, b];
};

/** The same descriptors must be emitted for the screen and an exported SVG. */
export function fontFaceCss(font: FontAsset, url: string): string {
  fontWeightRange(font.weight);
  const style = font.style ?? 'normal';
  if (!['normal', 'italic', 'oblique'].includes(style)) throw new RangeError('Invalid font style');
  if (font.unicodeRange) parseUnicodeRange(font.unicodeRange);
  return `@font-face{font-family:${quoted(font.family)};src:url(${quoted(url)}) format(${quoted(font.format ?? 'woff2')});font-weight:${font.weight ?? 400};font-style:${style};font-display:swap;${font.unicodeRange ? `unicode-range:${font.unicodeRange};` : ''}}`;
}

const rangeCache = new Map<string, readonly [number, number][]>();
export function parseUnicodeRange(range: string): readonly [number, number][] {
  const cached = rangeCache.get(range);
  if (cached) return cached;
  const parsed: [number, number][] = range.split(',').map((part) => {
    const token = /^U\+([0-9a-f]{1,6}(?:-[0-9a-f]{1,6})?|[0-9a-f]*\?+)$/i.exec(part.trim());
    if (!token || token[1].replace('-', '').length > 12) throw new RangeError(`Invalid Unicode range: ${part}`);
    let lo: number, hi: number;
    if (token[1].includes('?')) {
      if (token[1].length > 6) throw new RangeError('Invalid Unicode wildcard');
      lo = parseInt(token[1].replace(/\?/g, '0'), 16); hi = parseInt(token[1].replace(/\?/g, 'F'), 16);
    } else {
      const ends = token[1].split('-').map((v) => parseInt(v, 16)); [lo, hi = lo] = ends;
    }
    if (lo > hi || hi > 0x10ffff) throw new RangeError(`Invalid Unicode bounds: ${part}`);
    return [lo, hi];
  });
  if (rangeCache.size > 128) rangeCache.clear();
  rangeCache.set(range, parsed);
  return parsed;
}
export const fontHasCharacter = (font: FontAsset, character: string): boolean => {
  const cp = character.codePointAt(0);
  return cp !== undefined && (!font.unicodeRange || parseUnicodeRange(font.unicodeRange).some(([lo, hi]) => cp >= lo && cp <= hi));
};

/** CSS-family tokenisation preserves a comma inside a quoted family name. */
export function splitFontFamilies(value: string): string[] {
  const result: string[] = []; let word = '', quote = '', escaped = false;
  for (const ch of value) {
    if (escaped) { word += ch; escaped = false; }
    else if (ch === '\\') escaped = true;
    else if (quote) { if (ch === quote) quote = ''; else word += ch; }
    else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === ',') { if (word.trim()) result.push(word.trim()); word = ''; }
    else word += ch;
  }
  if (word.trim()) result.push(word.trim());
  return result;
}

/** CSS Fonts' 400–500 exception, with variable-weight intervals retained. */
function weightRank(font: FontAsset, requested: number): number {
  const [lo, hi] = fontWeightRange(font.weight);
  if (requested >= lo && requested <= hi) return 0;
  if (requested >= 400 && requested <= 500) {
    if (lo >= requested && lo <= 500) return lo - requested;
    if (hi < requested) return 1000 + requested - hi;
    return 2000 + lo - requested;
  }
  if (requested < 400) return hi < requested ? requested - hi : 1000 + lo - requested;
  return lo > requested ? lo - requested : 1000 + requested - hi;
}
export function matchingFontFaces(fonts: readonly FontAsset[], family: string, weight = 400, style = 'normal'): FontAsset[] {
  let matches = fonts.filter((f) => f.family.toLowerCase() === family.toLowerCase());
  if (!matches.length) return [];
  const priorities = style === 'normal' ? ['normal', 'oblique', 'italic'] : style === 'italic' ? ['italic', 'oblique', 'normal'] : ['oblique', 'italic', 'normal'];
  const selectedStyle = priorities.find((s) => matches.some((f) => (f.style ?? 'normal') === s));
  matches = matches.filter((f) => (f.style ?? 'normal') === selectedStyle);
  const best = Math.min(...matches.map((f) => weightRank(f, weight)));
  return matches.filter((f) => weightRank(f, weight) === best);
}
