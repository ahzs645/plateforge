/**
 * Hand-authored geometric plate glyph studies, NOT traces or official dies.
 * A 50×80 design cell, shared by both countries; colours/size are supplied by the renderer.
 * Country words and province legends are deliberately still editable SVG text.
 */
import { normalizeLetter } from '../regions/asia/plate-script';
import { EURO_PLATE_GLYPHS } from './westasia-euro';
import { NASKH_PLATE_GLYPHS } from './westasia-arabic';
export const xml = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
const path = (d: string, width = 7) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="square" stroke-linejoin="round"/>`;
const dot = (x: number, y: number, r = 3.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor"/>`;
const twoDots = (y: number) => dot(19, y) + dot(32, y);
const threeDots = (y: number) => twoDots(y) + dot(25.5, y - 10);
const bowl = 'M7 36V52Q7 65 25 65Q43 65 43 51V37';
const seen = 'M4 52Q4 70 17 70Q29 70 29 53V41M29 52Q37 57 37 43V35M37 45Q45 50 46 36';
const reh = 'M39 30L42 48Q39 66 15 73';
const LATIN: Record<string, string> = {
  '0': path('M16 7H34L43 16V64L34 73H16L7 64V16Z'),
  '1': path('M13 20L27 7V73M14 73H41'),
  '2': path('M7 20V16L16 7H34L43 16V30L7 65V73H43'),
  '3': path('M7 7H36L43 16V30L32 39L43 48V64L34 73H7M19 39H32'),
  '4': path('M35 73V7H28L7 48V51H46'),
  '5': path('M43 7H8V37H34L43 46V64L34 73H7'),
  '6': path('M42 7H18L8 19V64L17 73H34L43 64V48L34 39H8'),
  '7': path('M7 7H43L18 73'),
  '8': path('M16 7H34L43 16V29L33 40H17L7 29V16ZM17 40L7 50V64L16 73H34L43 64V50L33 40'),
  '9': path('M42 41H16L7 32V16L16 7H33L42 16V62L31 73H8'),
  A: path('M6 73V22L18 7H32L44 22V73M6 45H44'), B: path('M8 7V73H32L43 62V49L32 40H8M8 7H32L42 17V28L32 40'),
  C: path('M43 18L32 7H18L7 19V62L18 73H33L43 62'), D: path('M8 7V73H29L43 59V21L29 7Z'),
  E: path('M43 7H8V73H43M8 39H36'), F: path('M8 73V7H43M8 39H36'),
  G: path('M42 18L31 7H18L7 19V62L18 73H42V40H27'), H: path('M7 7V73M43 7V73M7 40H43'),
  I: path('M10 7H40M25 7V73M10 73H40'), J: path('M43 7V60L31 73H17L7 63V50'),
  K: path('M8 7V73M43 7L8 42M22 30L45 73'), L: path('M8 7V73H43'),
  M: path('M6 73V7L25 38L44 7V73'), N: path('M7 73V7L43 73V7'),
  O: path('M17 7H33L43 18V62L33 73H17L7 62V18Z'), P: path('M8 73V7H32L43 18V32L32 43H8'),
  Q: path('M17 7H33L43 18V59L32 70H17L7 60V18ZM28 56L46 76'),
  R: path('M8 73V7H32L43 18V32L32 42H8M28 42L44 73'),
  S: path('M43 17L32 7H18L7 18V28L43 51V63L32 73H18L7 63'),
  T: path('M5 7H45M25 7V73'), U: path('M7 7V61L19 73H31L43 61V7'),
  V: path('M6 7L25 73L44 7'), W: path('M4 7L12 73L25 43L38 73L46 7'),
  X: path('M6 7L44 73M44 7L6 73'), Y: path('M6 7L25 39L44 7M25 39V73'), Z: path('M7 7H43L7 73H43'),
  '-': path('M8 40H42'),
};
// Arabic-Indic and Eastern Arabic/Persian digits are separate masters, including 4, 5 and 6.
const ARABIC: Record<string, string> = {
  '٠': dot(25, 45, 5.5), '١': path('M25 8L27 72', 8),
  '٢': path('M7 11Q10 30 31 23L40 15M18 25L30 72', 8),
  '٣': path('M5 11Q9 30 18 19L22 10Q23 29 34 22L43 10M21 25L31 72', 8),
  '٤': path('M40 9L13 31L34 41L11 58L40 72', 8),
  '٥': path('M25 20Q7 31 7 47Q7 67 25 67Q43 67 43 47Q43 31 25 20Z', 8),
  '٦': path('M7 12H40L30 72', 8), '٧': path('M7 12L25 71L43 12', 8),
  '٨': path('M7 71L25 12L43 71', 8), '٩': path('M37 37H19Q8 37 8 25Q8 11 23 11Q37 11 37 28L37 72', 8),
};
const PERSIAN: Record<string, string> = {
  '۰': ARABIC['٠'], '۱': ARABIC['١'], '۲': ARABIC['٢'], '۳': ARABIC['٣'],
  '۴': path('M6 13L16 37L30 27L35 11M17 37L31 72M31 29L45 22', 8),
  '۵': path('M25 14L42 42V62Q34 72 25 60Q16 72 8 62V42Z', 8),
  '۶': path('M39 11H22Q8 11 8 24Q8 36 24 36H39L23 72', 8),
  '۷': ARABIC['٧'], '۸': ARABIC['٨'], '۹': ARABIC['٩'],
};
const LETTERS: Record<string, string> = {
  'ا': path('M27 10V70'), 'ب': path(bowl) + dot(25, 76),
  'پ': path(bowl) + threeDots(77), 'ت': path(bowl) + twoDots(22), 'ث': path(bowl) + threeDots(23),
  'ج': path('M8 28Q17 17 34 26L43 36Q9 41 9 60Q9 75 40 70') + dot(28, 56),
  'د': path('M18 24L41 52Q33 67 9 64'), 'ر': path(reh), 'ز': path(reh) + dot(32, 16),
  'س': path(seen), 'ش': path(seen) + threeDots(22),
  'ص': path('M5 50Q5 72 18 70Q27 69 29 53M28 53Q33 24 44 37Q54 56 28 53'),
  'ط': path('M9 59H41Q51 40 39 35Q27 35 14 59M16 56V12'),
  'ع': path('M38 26Q15 9 12 28Q10 38 35 40L10 51Q2 71 39 72'),
  'ف': path('M7 47V53Q7 67 26 67H39V37Q39 22 27 26Q13 35 39 43') + dot(29, 13),
  'ق': path('M7 45V55Q7 75 27 72Q43 70 42 48V34Q40 21 28 27Q14 37 42 44') + twoDots(14),
  'ک': path('M41 11L20 31L41 55Q34 68 9 65M14 43L25 35'),
  'ل': path('M38 11V55Q36 73 19 71Q6 68 8 52'),
  'م': path('M7 72V57L25 47Q39 54 42 41Q43 28 32 27Q20 30 25 47'),
  'ن': path(bowl) + dot(25, 28), 'و': path('M38 45Q12 49 14 32Q18 17 32 26Q47 39 35 59Q26 71 7 73'),
  // Plate form (initial هـ): a solid teardrop leaning right from a top-left point, a flat tail along the baseline and
  // two counters. The typography review scored this form 0.87 against 0.63 for the isolated ه on a private plate.
  'ه': '<path fill="currentColor" fill-rule="evenodd" d="M0 66H9C6 50 9 29 19 6C21 2 25 2 27 5C38 18 50 36 50 56C50 72 42 80 30 80H0ZM20 40C14 40 12 46 12 50C12 56 16 58 20 58C25 58 28 54 28 49C28 44 25 40 20 40ZM35 61C32 62 31 66 33 70C35 73 39 73 41 71C42 68 40 63 35 61Z"/>',
  'ی': path('M41 26Q29 15 21 29Q15 38 37 45Q45 60 29 69Q7 79 6 59'),
};
export function hasPlateGlyph(character: string): boolean {
  const key = normalizeLetter(character);
  return key === ' ' || !!(LATIN[key] || ARABIC[key] || PERSIAN[key] || LETTERS[key]);
}
/** `euro`: EuroPlate outlines for Latin characters (modern Iraq / KRG). `naskh`: Parastoo/Sahel outlines (SIL OFL) for
 * Arabic-Indic and Persian digits and Arabic-script letters, drawn with a stroke to match plate weight. Anything a profile
 * does not cover (Latin under `naskh`, هـ, unknown characters) falls back to the geometric set. */
export type GlyphProfile = 'geometric' | 'euro' | 'naskh';
const euroGlyph = (key: string) => EURO_PLATE_GLYPHS[key] ? `<path d="${EURO_PLATE_GLYPHS[key]}" fill="currentColor"/>` : '';
const naskhEntry = (key: string) => NASKH_PLATE_GLYPHS[key];
const naskhGlyph = (key: string) => {
  const entry = naskhEntry(key);
  if (!entry) return '';
  return `<path d="${entry[1]}" fill="currentColor"${entry[2] ? ` stroke="currentColor" stroke-width="${entry[2]}" stroke-linejoin="round"` : ''}/>`;
};
export function glyph(character: string, profile: GlyphProfile = 'geometric'): string {
  const key = normalizeLetter(character);
  return (profile === 'euro' && euroGlyph(key)) || (profile === 'naskh' && naskhGlyph(key)) || LATIN[key] || ARABIC[key] || PERSIAN[key] || LETTERS[key] || (key === ' ' ? '' : path('M8 8H42V72H8ZM8 8L42 72M42 8L8 72', 3));
}
/** Fixed-position cells are deliberately independent of the browser bidi algorithm. Font-derived glyphs (`euro`, `naskh`)
 * keep their own proportions: scaled uniformly to the run height, centred in the cell, and shrunk uniformly (never
 * stretched or overlapped) if wider than the cell. `condense` narrows every `naskh` glyph in the run by one die-level
 * factor (measured per plate design, not fitted per glyph) for dies narrower than the source font. */
export function glyphRun(value: string, x: number, y: number, width: number, height: number, gap = 3, profile: GlyphProfile = 'geometric', condense = 1): string {
  const chars = [...value].slice(0, 32); // Bound untrusted URL edits; validators still report errors.
  if (!chars.length) return '';
  const cell = Math.max(1, (width - gap * (chars.length - 1)) / chars.length);
  return chars.map((ch, i) => {
    const left = x + i * (cell + gap), key = normalizeLetter(ch);
    const naskh = profile === 'naskh' && !!naskhEntry(key), euro = profile === 'euro' && !!euroGlyph(key);
    const k = height / 80;
    let transform = `translate(${left} ${y}) scale(${cell / 50} ${k})`;
    if (euro) transform = `translate(${left + (cell - 50 * k) / 2} ${y}) scale(${k})`;
    if (naskh) {
      const w = naskhEntry(key)![0] * condense, s = Math.min(k, cell / w);
      transform = `translate(${left + (cell - w * s) / 2} ${y + (height - 80 * s) / 2}) scale(${s * condense} ${s})`;
    }
    return `<g data-glyph="${xml(ch)}"${euro ? ' data-profile="euro"' : naskh ? ' data-profile="naskh"' : ''} transform="${transform}">${glyph(ch, profile)}</g>`;
  }).join('');
}
/** The accessibility class symbol is actual geometry, never an emoji/font fallback. */
export function accessibility(x: number, y: number, size: number): string {
  return `<g transform="translate(${x} ${y}) scale(${size / 80})" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><circle cx="35" cy="10" r="7" fill="currentColor" stroke="none"/><path d="M35 25L35 45H56L69 65H78M35 32H55M25 40A23 23 0 1 0 54 65"/></g>`;
}
