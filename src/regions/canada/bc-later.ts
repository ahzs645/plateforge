import { withLettering } from '../../core/lettering';
import type { Parts, PlateFormat } from '../../core/types';
import type { Rng } from '../../core/random';
export const BC_FIRST_ALPHABET = 'ABCDEFGHJK';
export const BC_SECOND_ALPHABET = 'LMNPRSTVWX';
export const BC_LATER_NOTE = 'Research reconstruction. Paint values, dies and fine geometry are approximate. Renewal boxes are blank; dated decals, production defects and every allocation exception are not reconstructed. Validation checks this supported serial subset, not a real registration.';
export interface BcLaterRecipe {
  id: string; label: string; year: number; baseYear: number; period: [number, number];
  width: number; height: number; ink: string; background: string; material: string;
  layout: 'annual-beautiful' | 'bottom-small-decal' | 'top-right-decal' | 'bottom-wide-decal';
  datePosition?: 'bottom-right' | 'top-right' | 'split-top';
  min?: number; max?: number; prefixes?: string[];
  source: { title: string; url: string }; note: string;
}
const source = (period: string) => ({ title: `BCpl8s · Passenger ${period}`, url: `https://www.bcpl8s.ca/Passenger-${period}.html` });
function prefixes(sets: [string, string, string], keep: (value: string) => boolean = () => true): string[] {
  return [...sets[0]].flatMap((a) => [...sets[1]].flatMap((b) => [...sets[2]].map((c) => a + b + c))).filter(keep);
}
const A = BC_FIRST_ALPHABET, B = BC_SECOND_ALPHABET;
const annual = (year: number, max: number): BcLaterRecipe => ({
  id: String(year), label: String(year), year, baseYear: year, period: [year, year], width: year >= 1967 ? 302 : 300, height: 150,
  ink: year === 1967 ? '#bb2737' : year % 2 ? '#f1f0e7' : '#20538e',
  background: year === 1967 || year % 2 === 0 ? '#f2f1e9' : '#245993', material: 'steel',
  layout: 'annual-beautiful', datePosition: year === 1964 ? 'bottom-right' : year >= 1968 ? 'split-top' : 'top-right',
  min: 1, max, source: source('1964-1969'), note: 'Initial-series subset; source-reported dimensions. BEAUTIFUL is above the serial. Minor legend-die variants are not distinguished.',
});
function base(id: string, label: string, baseYear: number, period: [number, number], p: string[], note: string): BcLaterRecipe {
  return { id, label, year: baseYear, baseYear, period, width: baseYear === 1970 ? 302 : 300, height: 150,
    ink: baseYear === 1979 ? '#efefe7' : '#22558e', background: baseYear === 1979 ? '#285e91' : '#f2f2e9',
    material: baseYear === 1970 ? 'steel' : 'aluminum', prefixes: p,
    layout: baseYear === 1970 ? 'bottom-small-decal' : baseYear === 1973 ? 'top-right-decal' : 'bottom-wide-decal',
    source: source(baseYear === 1970 ? '1970-1972' : baseYear === 1973 ? '1973-1978' : '1979-1985'), note };
}
export const BC_LATER_RECIPES: readonly BcLaterRecipe[] = [
  annual(1964, 573750), annual(1965, 630000), annual(1966, 650000), annual(1967, 700000),
  { ...annual(1967, 720000), id: '1967-overrun', label: '1967 · over-run', min: 700001, datePosition: 'split-top',
    note: 'Documented 1968-style split date (19 / 67). The approximately 700001–720000 over-run range is not a complete issuance audit.' },
  annual(1968, 758000), annual(1969, 808000),
  base('1970-1972', '1970–1972 · first block', 1970, [1970, 1972], prefixes([A, A, A], (p) => p !== 'KKK'), 'First-alphabet serial block. The small decal box splits the lower province name. Source allocation details and excluded word combinations are not exhaustive here.'),
  base('1972-overrun', '1972 · KLL over-run', 1970, [1972, 1972], prefixes(['K', B, B]), 'KLL–KXX over-run on the 1970 base. Dashed appearance only; dashless and re-struck production variants remain reference material.'),
  base('1973-1974', '1973 base · LAA block', 1973, [1973, 1974], prefixes([B, A, A]), 'LAA–XKK block; dates are approximate issue periods, not new annual base designs. The decal box moved to the upper right.'),
  base('1975-1977', '1973 base · LLA block', 1973, [1975, 1977], prefixes([B, B, A]), 'LLA–XXK block on the same aluminum base. No separate year is stamped on the plate.'),
  base('1977-1978', '1973 base · LLL block', 1973, [1977, 1978], prefixes(['LMNP', B, B]), 'LLL–PXX block. Manufacturer-specific dies are approximations, not recovered tooling.'),
  base('1978-acme', '1978 · ACME subset', 1973, [1978, 1978], prefixes(['MNP', B, B], (p) => p[0] !== 'M' || 'STVWX'.includes(p[1])), 'Supported ACME ranges: MSL–MXX, NLL–NXX and PLL–PXX. The precise Quebec-style dies are not reproduced.'),
  base('1979-first', '1979 base · AAA block', 1979, [1979, 1979], prefixes([A, A, A], (p) => p !== 'KKK'), 'First block. The source has conflicting KKL/KKJ endpoint text; this subset conservatively omits KKK. Wide lower-centre decal box; white on blue.'),
  base('1979-second', '1979 base · AAL block', 1979, [1979, 1982], prefixes([A, A, B]), 'AAL–KKX block; the approximate issue period overlaps later blocks. Clean/sloppy paint and stamping variants are not simulated.'),
  base('1982-third', '1979 base · ALL block', 1979, [1982, 1985], prefixes([A, B, B]), 'ALL–KXX block on the 1979 base. ACME/Hi-Signs transition near ARX is not treated as an exact boundary or a separate recovered die.'),
  base('1985-fourth', '1985 · ALA block', 1979, [1985, 1985], prefixes(['AB', B, A], (p) => p[0] === 'A' || 'LMNP'.includes(p[1]) || (p[1] === 'R' && 'AB'.includes(p[2]))),
    'Fourth block, issued in 1985 while the flag base was delayed: ALA–AXK, then BLA–BRB (source-reported). Hi-Signs production; the Nova Scotia-style dies are not reproduced.'),
];
export function bcLaterRecipe(design: Record<string, unknown>): BcLaterRecipe {
  const id = typeof design.baseId === 'string' ? design.baseId : String(design.year);
  const r = BC_LATER_RECIPES.find((item) => item.id === id);
  if (!r) throw new RangeError(`Unsupported B.C. base: ${id}`);
  return r;
}
export function laterSerial(value: string): string {
  if (/^[A-Z]{3}-?\d{3}$/.test(value)) return value.replace('-', '').replace(/^(.{3})(.{3})$/, '$1-$2');
  const raw = value.replace('-', '');
  if (/^[1-9]\d{0,5}$/.test(raw) && (/^\d+$/.test(value) || /^[1-9]\d{0,2}-\d{3}$/.test(value))) return raw.length > 3 ? `${raw.slice(0, -3)}-${raw.slice(-3)}` : raw;
  return value;
}
export function validateLaterSerial(value: string, recipe: BcLaterRecipe): string | null {
  if (recipe.prefixes) {
    const match = /^([A-Z]{3})-?(\d{3})$/.exec(value);
    return match && recipe.prefixes.includes(match[1]) && Number(match[2]) > 0 ? null : 'Use a supported three-letter block followed by 001–999. This is a format subset, not registration verification.';
  }
  if (!/^(?:[1-9]\d{0,5}|[1-9]\d{0,2}-\d{3})$/.test(value)) return 'Use a positive numeric serial without leading zeroes.';
  const n = Number(value.replace('-', ''));
  return n >= recipe.min! && n <= recipe.max! ? null : `Supported serial subset: ${recipe.min}–${recipe.max}.`;
}
const appExcluded = new Set(['ASS', 'FAG', 'FUK', 'SEX', 'KKK', 'FCK', 'CNT']);
function generateSerial(recipe: BcLaterRecipe, rng: Rng): string {
  if (!recipe.prefixes) return laterSerial(String(rng.int(recipe.min!, recipe.max!)));
  const pool = recipe.prefixes.filter((p) => !appExcluded.has(p));
  return `${rng.pick(pool)}-${String(rng.int(1, 999)).padStart(3, '0')}`;
}
export const bcLaterFormats: PlateFormat[] = BC_LATER_RECIPES.map((recipe) => withLettering({
  id: recipe.id, label: recipe.label, pattern: recipe.prefixes ? 'AAA-999 (supported block)' : '123-456',
  description: `${recipe.note} ${BC_LATER_NOTE}`, references: [recipe.source],
  design: { year: recipe.year, baseId: recipe.id },
  period: recipe.period,
  fields: [{ key: 'serial', label: 'Plate serial', maxLength: 7 },
    { key: 'finish', label: 'Rendering', preserveOnGenerate: true, options: [{ value: 'flat', label: 'Flat / editable SVG' }, { value: 'embossed', label: 'Subtle embossed preview' }] }],
  generate: (rng): Parts => ({ serial: generateSerial(recipe, rng), finish: 'flat' }),
  validate: (parts) => validateLaterSerial(parts.serial ?? '', recipe)
    ?? (parts.finish === undefined || ['flat', 'embossed'].includes(parts.finish) ? null : 'Choose flat or embossed rendering.'),
  text: (parts) => laterSerial(parts.serial ?? ''),
}));
