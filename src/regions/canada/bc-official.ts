/**
 * B.C. amateur-radio, government/official and ceremonial plates.
 * Class plates that rode on a passenger base (Public Works, doctors, National
 * Defence, the red-bordered National Parks plates) reuse that year's passenger
 * geometry and colours, copied here from bc-early.ts, bc-data.ts, scene.ts and
 * later-scene.ts (cited per table). Sources: the BCpl8s pages on each class.
 */
import type { PlateEra, PlateFamily, PlateFormat, PlateStatus } from '../../core/types';
import type { KitDecal, KitFontText, KitRecipe, KitSerial, KitText } from '../../templates/bc/kit';
import { kitFormat, NO_SERIAL, numericGrammar, type KitPalette, type SerialGrammar } from './bc-kit';
import '../../templates/bc/art-official';
import {NWT_POLAR_BEAR_PATH, NWT_POLAR_BEAR_SLOTS} from '../../templates/shapes/nwt-polar-bear';

const page = (slug: string, title: string) => ({ title: `BCpl8s · ${title}`, url: `https://www.bcpl8s.ca/${slug}` });
const SRC = {
  ham: page('HamRadio.htm', 'Amateur Radio'), gov: page('Government.html', 'Government'), pw: page('PublicWorks.htm', 'Public Works'),
  md: page('MedicalDoctor.htm', 'Medical Doctor'), foreign: page('ForeignTouring.html', 'Foreign Touring'), nd: page('NationalDefence.html', 'National Defence'),
  parks: page('NationalParks.html', 'National Parks'), apec: page('APEC.htm', 'APEC 1997'), expo: page('Expo-86.htm', 'Expo 86'),
  concours: page('Expo86-Concours.html', 'Expo 86 Concours d’Elegance'), royal: page('Royal.html', 'Royal Visits'), lg: page('LGpl8.htm', 'Lieutenant Governor'),
  victoria: page('Guinness.html', 'Victoria 1913 hired-vehicle plate'),
};
const NOTE = 'Reconstruction from BCpl8s photographs: layout proportions, paint colours and dies are approximate; validation checks the documented serial format, not a real registration.';
const BASE_NOTE = `${NOTE} Base geometry and colours follow the passenger plate of the same year.`;

// ── Shared pieces ─────────────────────────────────────────────────────────────
type Size = { w: number; h: number };
const pal = (year: number, background: string, ink: string, words: string): KitPalette => ({ id: String(year), label: `${year} · ${words}`, background, ink, year });
/** Palettes with only one year still carry it, so {yy} legends always resolve. */
const one = (year: number, background: string, ink: string, words: string) => [pal(year, background, ink, words)];

/** A two-digit year stacked one digit above the other, from the palette's year. */
function stackedYear(x: number, top: number, step: number, cap: number, die: string, role = 'year'): KitText[] {
  return [
    { text: '{y1}', x, baseline: top, cap, die, role: `${role}-tens` },
    { text: '{y2}', x, baseline: top + step, cap, die, role: `${role}-units` },
  ];
}
/** Fixed characters stacked in a column (Victoria 1913, PCMR, Vancouver 100). */
const column = (chars: readonly string[], x: number, from: number, step: number, cap: number, die: string, role: string): KitText[] =>
  chars.map((c, i) => ({ text: c, x, baseline: from + i * step, cap, die, role: `${role}-${i}` }));

/** Serial-less plates (arms, crests, event logos) draw no number. */
const NO_NUMBER: KitSerial = { x: 0, baseline: 0, cap: 1, maxWidth: 1, die: 'bc-astro-4' };
const noNumber = NO_SERIAL;

/** Serials from explicit number ranges, each rendered by its own rule. */
function listed(hint: string, ...groups: Array<[number, number, (n: number) => string]>): SerialGrammar {
  let all: Set<string> | undefined;
  const values = () => (all ??= new Set(groups.flatMap(([lo, hi, f]) => Array.from({ length: hi - lo + 1 }, (_, i) => f(lo + i)))));
  return { blocks: [], hint, custom: { generate: (rng) => { const [lo, hi, f] = rng.pick(groups); return f(rng.int(lo, hi)); }, test: (s) => values().has(s) } };
}
const thousands = (n: number) => (n > 999 ? `${Math.floor(n / 1000)}-${String(n % 1000).padStart(3, '0')}` : String(n));

function recipe(id: string, label: string, size: Size, source: { title: string; url: string }, rest: Partial<KitRecipe> & Pick<KitRecipe, 'serial' | 'legends'>): KitRecipe {
  return { id, label, width: size.w, height: size.h, radius: 6, background: '#eeeeea', ink: '#1c1c1c', embossed: true, source, note: NOTE, ...rest };
}

// ── Passenger-base layouts (geometry copied from the passenger recipes) ───────
/** 1924–35 annual plate (bc-early.ts annual1924): number, small date at right, BRITISH COLUMBIA below. */
function base1924(id: string, label: string, b: Size, source: typeof SRC.md, die: string, year: string, extra: Partial<KitRecipe> = {}): KitRecipe {
  return recipe(id, label, b, source, {
    radius: 5, holes: 'slots', holeAt: { x: [0.195, 0.805], y: [0.06] }, rim: { inset: 3, width: 1.6 }, note: BASE_NOTE,
    legends: [
      { text: year, x: b.w * 0.885, baseline: b.h * 0.49, cap: b.h * 0.17, maxWidth: b.w * 0.14, die, role: 'year' },
      { text: 'BRITISH COLUMBIA', x: b.w * 0.5, baseline: b.h * 0.88, cap: b.h * 0.13, maxWidth: b.w * 0.9, die: 'bc-legend-1924', role: 'province', spread: true },
    ],
    serial: { x: b.w * 0.43, baseline: b.h * 0.67, cap: b.h * 0.54, maxWidth: b.w * 0.74, die, separator: { kind: 'dash' } }, ...extra,
  });
}
/** 1936–39 (bc-early.ts annual1936): year stacked at the far right. */
function base1936(id: string, label: string, b: Size, source: typeof SRC.md, sep: KitSerial['separator'], extra: Partial<KitRecipe> = {}): KitRecipe {
  return recipe(id, label, b, source, {
    radius: 5, holes: 'slots', holeAt: { x: [0.22, 0.77], y: [0.1, 0.9] }, rim: { inset: 3, width: 1.6 }, note: BASE_NOTE,
    legends: [
      ...stackedYear(b.w * 0.93, b.h * 0.36, b.h * 0.22, b.h * 0.19, 'bc-tacey-1936'),
      { text: 'BRITISH COLUMBIA', x: b.w * 0.505, baseline: b.h * 0.85, cap: b.h * 0.12, maxWidth: b.w * 0.87, die: 'bc-legend-1924', role: 'province', spread: true },
    ],
    serial: { x: b.w * 0.465, baseline: b.h * 0.65, cap: b.h * 0.48, maxWidth: b.w * 0.8, die: 'bc-tacey-1936', separator: sep }, ...extra,
  });
}
/** 1940–51 stacked-year base, kept in step with scene.ts's stacked-year layout (measured from BCpl8s photos): slots
 *  ±80 mm from the middle, heavy edge rim, 71 mm serial, 32 mm stacked year, 20.5 mm legend. */
function base1940(id: string, label: string, source: typeof SRC.md, sep: KitSerial['separator'], w = 290, h = 137): KitRecipe {
  return recipe(id, label, { w, h }, source, {
    radius: 9, holes: 'slots', holeAt: { x: [(w / 2 - 80) / w, (w / 2 + 80) / w], y: [12.5 / h, 1 - 12.5 / h] }, rim: { inset: 2.8, width: 3.2 }, note: BASE_NOTE,
    legends: [
      ...stackedYear(w - 15, 51.5, 38.5, 32, 'bc-year-1940').map((t) => ({ ...t, maxWidth: 17 })),
      { text: 'BRITISH COLUMBIA', x: (w - 1) / 2, baseline: 120.5, cap: 20.5, maxWidth: w - 29, die: 'bc-legend-1940', role: 'province', spread: true },
    ],
    serial: { x: (w - 16) / 2, baseline: 90, cap: 71, maxWidth: w - 42, die: 'bc-early-1940', separator: sep },
  });
}
/** 1955–63 standard base (scene.ts annual-standard): BRITISH COLUMBIA and the date along the bottom. */
function base1955(id: string, label: string, source: typeof SRC.md, w: number, legendDie: string, dot: boolean, sep: KitSerial['separator'], extra: Partial<KitRecipe> = {}): KitRecipe {
  const h = 150;
  return recipe(id, label, { w, h }, source, {
    radius: 9, holes: 'slots', holeAt: { x: [0.21, 0.79], y: [10 / h, 1 - 10 / h] }, rim: { inset: 4, width: 1.6 }, note: BASE_NOTE,
    shapes: dot ? [{ kind: 'circle', cx: w - 51, cy: 127, r: 1.9 }] : [],
    legends: [
      { text: 'BRITISH COLUMBIA', x: (w - 54) / 2 + 6, baseline: 133, cap: 16.1, maxWidth: w - 73, die: legendDie, role: 'province', spread: true },
      { text: '{yy}', x: w - 27, baseline: 134, cap: 21, maxWidth: 34, die: legendDie, role: 'year' },
    ],
    serial: { x: w / 2, baseline: 109, cap: 82.6, maxWidth: w - 30, die: 'bc-oakalla-1955', separator: sep }, ...extra,
  });
}
type DatePos = 'bottom' | 'top' | 'split';
/** 1964–69 BEAUTIFUL annuals (later-scene.ts annual-beautiful); 1965–69 split the province name round the lower slots. */
function beautiful(id: string, label: string, source: typeof SRC.md, w: number, date: DatePos, sep: KitSerial['separator']): KitRecipe {
  const h = 150, L = 'bc-legend-1964';
  const lower: KitText[] = date === 'bottom'
    ? [{ text: 'BRITISH COLUMBIA', x: (w - 42) / 2, baseline: 136, cap: 16.1, maxWidth: w - 66, die: L, role: 'province', spread: true }]
    : [{ text: 'BRITISH', x: w * 0.285, baseline: 136, cap: 16.1, maxWidth: w * 0.25, die: L, role: 'province-left', spread: true },
      { text: 'COLUMBIA', x: w * 0.69, baseline: 136, cap: 16.1, maxWidth: w * 0.33, die: L, role: 'province-right', spread: true }];
  return recipe(id, label, { w, h }, source, {
    radius: 8, holes: 'slots', holeAt: { x: [0.21, 0.79], y: [9 / h, 1 - 9 / h] }, rim: { inset: 4, width: 1.5 }, note: BASE_NOTE,
    legends: [
      { text: 'BEAUTIFUL', x: w / 2, baseline: 28, cap: 17.5, maxWidth: 128, die: L, role: 'slogan', spread: true }, ...lower,
      { text: '{yy}', x: w - 23, baseline: date === 'bottom' ? 136 : 28, cap: 18.2, maxWidth: 31, die: L, role: 'year' },
      ...(date === 'split' ? [{ text: '19', x: 23, baseline: 28, cap: 18.2, maxWidth: 31, die: L, role: 'century' }] : []),
    ],
    serial: { x: w / 2, baseline: 112, cap: 78.4, maxWidth: w - 28, die: 'bc-oakalla-1955', separator: sep },
  });
}
/** 1970, 1973 and 1979 multi-year bases (later-scene.ts): decal box bottom-centre, top-right, or wide bottom-centre. */
function decalBase(id: string, label: string, source: typeof SRC.md, w: number, kind: '1970' | '1973' | 'acme' | '1979', sep: KitSerial['separator'], colours: { bg: string; ink: string }): KitRecipe {
  const h = 150;
  const legendDie = kind === '1970' ? 'bc-legend-1964' : kind === '1973' ? 'bc-legend-1973' : 'bc-legend-acme';
  const serialDie = kind === '1970' ? 'bc-oakalla-1970' : kind === '1973' ? 'bc-oakalla-1973' : kind === 'acme' ? 'bc-acme-1978' : 'bc-acme-1979';
  const boxW = kind === '1979' ? 64 : 39;
  const bottomBox = kind === '1970' || kind === '1979';
  const side = (w - boxW) / 2 - 17;
  const decal: KitDecal = bottomBox ? { x: (w - boxW) / 2, y: 116, width: boxW, height: 28 }
    : kind === 'acme' ? { x: w - 58, y: 4, width: 54, height: 27, rx: 1 } : { x: w - 55, y: 9, width: 44, height: 23 };
  return recipe(id, label, { w, h }, source, {
    radius: 8, background: colours.bg, ink: colours.ink, holes: 'slots', holeAt: { x: [0.21, 0.79], y: [9 / h, 1 - 9 / h] },
    rim: kind === 'acme' ? { inset: 4, width: 1 } : { inset: 4, width: 1.5 }, decal,
    legends: [
      { text: 'BEAUTIFUL', x: kind === 'acme' ? w * 0.47 : w / 2, baseline: kind === 'acme' ? 30 : 28, cap: kind === 'acme' ? 13 : 17.5, maxWidth: kind === '1979' ? 150 : 128, die: legendDie, role: 'slogan', spread: true },
      ...(bottomBox
        ? [{ text: 'BRITISH', x: (w - boxW) / 4, baseline: 136, cap: 16.1, maxWidth: side, die: legendDie, role: 'province-left', spread: true },
          { text: 'COLUMBIA', x: w - (w - boxW) / 4, baseline: 136, cap: 16.1, maxWidth: side, die: legendDie, role: 'province-right', spread: true }]
        : [{ text: 'BRITISH COLUMBIA', x: kind === 'acme' ? w * 0.47 : w / 2, baseline: kind === 'acme' ? 134 : 136, cap: kind === 'acme' ? 14 : 16.1, maxWidth: kind === 'acme' ? w * 0.62 : w - 40, die: legendDie, role: 'province', spread: true }]),
    ],
    serial: { x: kind === 'acme' ? w * 0.47 : w / 2, baseline: kind === 'acme' ? 108 : 112, cap: kind === 'acme' ? 64 : 78.4, maxWidth: w - 40, die: serialDie, separator: sep },
  });
}
/** Flag base (bc-flag.ts flagRecipe): serif slogan, reflective sheeting; class plates carry the flag bottom-left instead of in the serial. */
const SHEETING = '#eef2f5', FLAG_SERIAL = '#1a45a0', FLAG_LEGEND = '#2b7cd1';
const SINGLE_WELL: KitDecal = { x: 94.5, y: 115, width: 112.5, height: 29, rx: 2 };
const DAY_WELL: KitDecal = { x: 97.5, y: 116, width: 34.5, height: 29, rx: 2 };
const MONTH_WELL: KitDecal = { x: 136.5, y: 116, width: 70.5, height: 29, rx: 2 };
const SLOGAN: KitFontText = { text: 'Beautiful British Columbia', x: 150, baseline: 39, size: 19.5, width: 237, font: 'serif', color: FLAG_LEGEND, role: 'slogan' };
const cornerFlag = { art: 'bc-spirit-flag', x: 11, y: 105, width: 32, height: 25, role: 'flag' };
function flagBase(id: string, label: string, source: typeof SRC.md, die: string, wells: 'single' | 'dual' | 'none', rest: Partial<KitRecipe> = {}): KitRecipe {
  return recipe(id, label, { w: 300, h: 150 }, source, {
    radius: 7, background: SHEETING, ink: FLAG_SERIAL, rim: { inset: 4.5, width: 1.2, color: '#c5cfda' }, holes: 'slots', holeAt: { x: [0.21, 0.79], y: [0.113, 0.88] },
    fontLegends: [SLOGAN], art: [cornerFlag], legends: [],
    serial: { x: 150, baseline: 109.5, cap: 64, maxWidth: 268, die, color: rest.ink ?? FLAG_SERIAL, separator: { kind: 'none' } },
    decal: wells === 'none' ? null : wells === 'dual' ? MONTH_WELL : SINGLE_WELL, extraWells: wells === 'dual' ? [DAY_WELL] : [], ...rest,
  });
}

// ── Passenger colours, copied (not imported) from the passenger sources ─────
// bc-early.ts `annual` / `late` tables (1924–39).
const P1924: Record<number, [string, string, string]> = {
  1927: ['#e67620', '#31302f', 'black on orange'], 1928: ['#2e2a29', '#d47e38', 'orange on black'], 1930: ['#8e2c2a', '#d99206', 'yellow on maroon'],
  1931: ['#ece2cc', '#2b2c2e', 'black on white'], 1932: ['#4a2722', '#dacfac', 'cream on maroon'], 1933: ['#e1ac3c', '#863a2c', 'maroon on yellow'],
  1934: ['#1f498e', '#e4e3d9', 'white on blue'], 1935: ['#e6e8e2', '#1a344f', 'blue on white'],
  1936: ['#1d3523', '#f0e9c7', 'cream on green'], 1937: ['#f5e2ad', '#2f2c28', 'black on cream'], 1938: ['#4d362f', '#f6ebb0', 'cream on brown'], 1939: ['#dec337', '#35322b', 'black on yellow'],
};
// bc-data.ts `rows` (1940–63).
const P1940: Record<number, [string, string, string]> = {
  1940: ['#17232a', '#eee194', 'yellow on black'], 1941: ['#f5f3e9', '#1c2a54', 'dark blue on white'], 1942: ['#1c2d48', '#f0eee2', 'white on dark blue'],
  1943: ['#eee9d6', '#202222', 'black on cream'], 1944: ['#1c2226', '#eee6d4', 'cream on black'], 1945: ['#f4eee6', '#b82c42', 'red on white'],
  1946: ['#bd2d45', '#f7efdf', 'white on red'], 1947: ['#f0efe2', '#287354', 'green on white'], 1948: ['#28502e', '#f1e9c6', 'white on green'],
  1949: ['#e9bd3b', '#202321', 'black on yellow'], 1952: ['#d8d7ce', '#242525', 'black on aluminum'],
  1955: ['#e4b647', '#222221', 'black on yellow'], 1956: ['#202629', '#e5c56c', 'yellow on black'], 1957: ['#edece3', '#203650', 'dark blue on white'],
  1959: ['#481f23', '#73b9aa', 'turquoise on maroon'], 1960: ['#74b5ae', '#693640', 'maroon on turquoise'], 1961: ['#d2a39f', '#492326', 'maroon on pink'],
  1962: ['#54282e', '#dfb2ae', 'pink on maroon'], 1963: ['#327e9e', '#eeeede', 'white on light blue'],
};
// bc-later.ts `annual()` colours (1964–69).
const P1964: Record<number, [string, string, string]> = {
  1964: ['#f2f1e9', '#20538e', 'blue on white'], 1965: ['#245993', '#f1f0e7', 'white on blue'], 1966: ['#f2f1e9', '#20538e', 'blue on white'],
  1967: ['#f2f1e9', '#bb2737', 'red on white'], 1968: ['#f2f1e9', '#20538e', 'blue on white'], 1969: ['#245993', '#f1f0e7', 'white on blue'],
};
const years = (table: Record<number, [string, string, string]>, list: readonly number[]) => list.map((y) => pal(y, ...table[y]));
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ── Families and eras ────────────────────────────────────────────────────────
export const BC_OFFICIAL_FAMILIES: PlateFamily[] = [
  { id: 'ham-radio', label: 'Amateur radio', summary: 'Call-sign plates for licensed operators from 1963: VE7 (and VA7 from 1999) plus two or three letters, on the passenger base of the day.' },
  { id: 'official', label: 'Government & official', summary: 'Class prefixes on passenger bases (PW, doctors, government E, National Defence N), the red-bordered National Parks plates, federal CANADA plates, early Victoria and foreign-touring issues, and the Lieutenant Governor’s plates.' },
  { id: 'events', label: 'Events & ceremonial', summary: 'Royal tours and visits, Expo 86 and the 1997 APEC summit.' },
];
export const BC_OFFICIAL_ERAS: PlateEra[] = [
  { id: 'ham-annual-1963', family: 'ham-radio', label: 'Annual steel plates', period: [1963, 1969], summary: 'A new plate each year, following the passenger colours.' },
  { id: 'ham-decal-1970', family: 'ham-radio', label: 'Decal bases', period: [1970, 1986], summary: 'The 1970, 1973 and 1979 bases renewed with passenger decals.' },
  { id: 'ham-flag-1986', family: 'ham-radio', label: 'Flag base', period: [1986, 2026], summary: 'Reflective flag base with the flag moved to the corner.' },
  { id: 'official-early', family: 'official', label: 'Early class plates', period: [1913, 1939], summary: 'Victoria hired vehicles, foreign touring, doctors and the red-bordered Golden plates.' },
  { id: 'official-prefix-1938', family: 'official', label: 'Class prefixes', period: [1938, 1969], summary: 'PW, PN, E and N prefixes on the passenger base of each year.' },
  { id: 'official-federal', family: 'official', label: 'Federal & vice-regal', period: [1970, 2026], summary: 'Federal CANADA plates and the Lieutenant Governor’s arms and crest.' },
  { id: 'events-royal', family: 'events', label: 'Royal tours', period: [1951, 2016], summary: 'Plates made for royal tours and visits.' },
  { id: 'events-expo-1985', family: 'events', label: 'Expo 86', period: [1985, 1986], summary: 'Presentation, promotional and souvenir plates for Expo 86.' },
  { id: 'events-apec-1997', family: 'events', label: 'APEC 1997', period: [1997, 1997], summary: 'Motorcade plates for the Vancouver APEC summit.' },
];

interface Spec {
  id: string; label: string; family: 'ham-radio' | 'official' | 'events'; era: string; period: [number, number];
  recipe: KitRecipe; grammar: SerialGrammar; description: string; status?: PlateStatus;
  references?: readonly {title: string; url: string}[];
  palettes?: KitPalette[]; dies?: { id: string; label?: string }[]; decals?: [number, number];
}

// ── Amateur radio ────────────────────────────────────────────────────────────
const VE7 = [{ pattern: 'VE7AA' }, { pattern: 'VE7AAA' }];
const VA7 = [{ pattern: 'V\\A7AA' }, { pattern: 'V\\A7AAA' }];
const call = (blocks: { pattern: string }[], hint: string): SerialGrammar => ({ blocks, hint });
const dashCall = (sep: string) => call([{ pattern: `VE7${sep}AA` }, { pattern: `VE7${sep}AAA` }], `VE7${sep === ' ' ? ' ' : '-'}AA or VE7${sep === ' ' ? ' ' : '-'}AAA`);
const HAM_BASE = 'Ham plates were made at the same time and on the same base as the passenger issue.';

const hamSpecs: Spec[] = [
  { id: 'ham-radio-1963', label: '1963 · first issue', family: 'ham-radio', era: 'ham-annual-1963', period: [1963, 1963],
    recipe: base1955('ham-1963', 'Ham radio 1963', SRC.ham, 302, 'bc-legend-1955', false, { kind: 'none' }, { ink: '#e8eef2', background: '#0a76bc' }),
    palettes: one(1963, '#0a76bc', '#e8eef2', 'white on blue'), grammar: call(VE7, 'VE7 + two or three letters'),
    description: `First amateur-radio plates: white on blue steel, 302 × 150 mm, Oakalla Prison. The call sign (VE7 + the operator’s two or three letters) fills the plate above BRITISH COLUMBIA and 63. ${HAM_BASE}` },
  { id: 'ham-radio-1964', label: '1964 · BEAUTIFUL', family: 'ham-radio', era: 'ham-annual-1963', period: [1964, 1964],
    recipe: beautiful('ham-1964', 'Ham radio 1964', SRC.ham, 302, 'bottom', { kind: 'none' }), palettes: one(1964, '#e1e8ea', '#1d7fc2', 'blue on white'),
    grammar: call(VE7, 'VE7 + two or three letters'), description: 'The BEAUTIFUL slogan arrives: blue on white, with BRITISH COLUMBIA and 64 along the bottom. 302 × 150 mm steel.' },
  { id: 'ham-radio-1965', label: '1965–67 · year top right', family: 'ham-radio', era: 'ham-annual-1963', period: [1965, 1967],
    recipe: beautiful('ham-1965', 'Ham radio 1965–67', SRC.ham, 302, 'top', { kind: 'none' }),
    palettes: [pal(1965, '#116dbb', '#e4e9f0', 'white on blue'), pal(1966, '#e1e7ee', '#2880c0', 'blue on white'), pal(1967, '#eaede8', '#e11a17', 'Centennial red on white')],
    grammar: call(VE7, 'VE7 + two or three letters'), description: 'Year moved to the top right and BRITISH / COLUMBIA split round the lower bolt slots. 1967 used the Centennial red-and-white scheme. A 1965 “BE7BIN” error plate is known but not reproduced.' },
  { id: 'ham-radio-1968', label: '1968 · VE7-AA', family: 'ham-radio', era: 'ham-annual-1963', period: [1968, 1968],
    recipe: beautiful('ham-1968', 'Ham radio 1968', SRC.ham, 302, 'split', { kind: 'dot' }), palettes: one(1968, '#f3eee3', '#1c5a9e', 'blue on white'),
    grammar: dashCall('-'), description: '19 and 68 in the top corners; the only annual ham plate of the decade with a dash (a raised dot) after VE7.' },
  { id: 'ham-radio-1969', label: '1969 · VE7 AA', family: 'ham-radio', era: 'ham-annual-1963', period: [1969, 1969],
    recipe: beautiful('ham-1969', 'Ham radio 1969', SRC.ham, 302, 'split', { kind: 'none' }), palettes: one(1969, '#0459c9', '#e5edf3', 'white on blue'),
    grammar: dashCall(' '), description: 'White on blue with 19 and 69 in the top corners; a gap replaces the dash and two-letter calls generally sit left of centre (VE7LL is a centred exception). The gap is stored as a space.' },
  { id: 'ham-radio-1970', label: '1970–72 base', family: 'ham-radio', era: 'ham-decal-1970', period: [1970, 1972],
    recipe: decalBase('ham-1970', 'Ham radio 1970 base', SRC.ham, 302, '1970', { kind: 'dot' }, { bg: '#fbfefa', ink: '#3050a3' }),
    grammar: dashCall('-'), decals: [1970, 1972],
    description: 'Blue on white steel base renewed with the 1970–72 passenger decals in the small box between BRITISH and COLUMBIA; the last base with a dash after VE7.' },
  { id: 'ham-radio-1973', label: '1973 base · Oakalla', family: 'ham-radio', era: 'ham-decal-1970', period: [1973, 1978],
    recipe: decalBase('ham-1973', 'Ham radio 1973 base', SRC.ham, 302, '1973', { kind: 'none' }, { bg: '#f7f5eb', ink: '#2a5ea1' }),
    grammar: call(VE7, 'VE7 + two or three letters'), decals: [1974, 1978],
    description: 'Oakalla steel base, 302 × 150 mm, with the decal box at the top right (1974–78 passenger decals). No dash in the call sign.' },
  { id: 'ham-radio-1977-acme', label: '1973 base · ACME dies', family: 'ham-radio', era: 'ham-decal-1970', period: [1977, 1978],
    recipe: decalBase('ham-1977-acme', 'Ham radio 1973 base (ACME)', SRC.ham, 302, 'acme', { kind: 'none' }, { bg: '#f9faeb', ink: '#384aa0' }),
    grammar: call(VE7, 'VE7 + two or three letters'), decals: [1977, 1978],
    description: 'Aluminium plates made by ACME Signalisation with the narrower “Quebec” dies; a thin line rim that also outlines the top-right decal box.' },
  { id: 'ham-radio-1979', label: '1979 blue base', family: 'ham-radio', era: 'ham-decal-1970', period: [1979, 1986],
    recipe: decalBase('ham-1979', 'Ham radio 1979 base', SRC.ham, 300, '1979', { kind: 'none' }, { bg: '#175ac1', ink: '#e8ecf4' }),
    grammar: call(VE7, 'VE7 + two or three letters'), decals: [1981, 1986], dies: [{ id: 'bc-acme-1979' }, { id: 'bc-hisigns-1982' }],
    description: 'White on blue aluminium, 300 × 150 mm (ACME Signalisation), with the wide decal box between BRITISH and COLUMBIA for the 1981–86 passenger decals.' },
  { id: 'ham-radio-1986-flag', label: 'Flag base · Astrographic', family: 'ham-radio', era: 'ham-flag-1986', period: [1986, 2002],
    recipe: flagBase('ham-1986', 'Ham radio flag base (Astrographic)', SRC.ham, 'bc-astro-4', 'single', { background: '#e9ecf0', ink: '#2e5089' }),
    grammar: call([...VE7, ...VA7], 'VE7 or VA7 (from 1999) + two or three letters'), decals: [1986, 2002],
    dies: [{ id: 'bc-astro-4' }, { id: 'bc-astro-3' }, { id: 'bc-astro-1' }, { id: 'bc-astro-2' }],
    description: 'Flag-graphic base by Astrographic: the slogan above, the small flag in the bottom-left corner and the passenger decal well at the bottom. Out-of-province call signs (VE1, VE3) and a VEBGM error plate exist but are not in the grammar.' },
  { id: 'ham-radio-2002-flag', label: 'Flag base · Waldale', family: 'ham-radio', era: 'ham-flag-1986', period: [2002, 2014],
    recipe: flagBase('ham-2002', 'Ham radio flag base (Waldale)', SRC.ham, 'bc-waldale', 'single', { ink: '#2241b5' }),
    grammar: call([...VE7, ...VA7], 'VE7 or VA7 + two or three letters'), decals: [2002, 2014],
    description: 'The same design made by Waldale from 2002, one decal well.' },
  { id: 'ham-radio-2014-flag', label: 'Flag base · two wells', family: 'ham-radio', era: 'ham-flag-1986', period: [2014, 2026],
    recipe: flagBase('ham-2014', 'Ham radio flag base (dual wells)', SRC.ham, 'bc-waldale', 'dual', { ink: '#2241b5' }),
    grammar: call([...VE7, ...VA7], 'VE7 or VA7 + two or three letters'), decals: [2014, 2023],
    description: 'Waldale base with the dual decal well (day sticker and month/year decal), in use by October 2014 and possibly sooner.' },
  { id: 'ham-radio-booster', label: 'Pre-1963 call-sign booster', family: 'ham-radio', era: 'ham-annual-1963', period: [1955, 1962], status: 'uncertain',
    recipe: recipe('ham-booster', 'Private call-sign booster', { w: 203, h: 64 }, SRC.ham, {
      radius: 4, background: '#c02c2e', ink: '#ca9a83', holes: 'round', holeAt: { x: [0.04, 0.96], y: [0.14, 0.86] }, rim: { inset: 3, width: 2 },
      legends: [], serial: { x: 101.5, baseline: 55, cap: 45, maxWidth: 180, die: 'bc-legend-condensed', separator: { kind: 'none' } } }),
    grammar: call(VE7, 'VE7 + two or three letters'),
    description: 'Before 1963 some operators ordered their own 8 × 2.5 in boosters for above the passenger plate. The one example shown (VE7ANQ, brass letters on red) is only “thought to be” such a plate; its start year is unknown.' },
];

// ── Government & official ────────────────────────────────────────────────────
const d19 = (n: number) => `19-${String(n).padStart(3, '0')}`;
const parksRanges: Array<[number, number]> = [[31501, 31725], [36976, 37200], [35401, 35850], [30026, 30525], [27801, 28200], [29251, 29625], [29576, 29950]];
const RED_RIM = { inset: 2.5, width: 3.2, color: '#c8282a' };
const size1924: Size = { w: 340, h: 148 };

const officialSpecs: Spec[] = [
  { id: 'official-victoria-1913', label: 'Victoria 1913 · hired vehicle', family: 'official', era: 'official-early', period: [1913, 1914],
    recipe: recipe('official-victoria-1913', 'Victoria 1913 hired vehicle', { w: 203, h: 127 }, SRC.victoria, {
      embossed: false, rim: null, radius: 4, background: '#ebeff6', ink: '#1a1a1a', holes: 'slots', holeAt: { x: [0.34, 0.66], y: [0.09] },
      shapes: [
        { kind: 'line', x1: 203 * 0.17, y1: 0, x2: 203 * 0.17, y2: 127, strokeWidth: 1.4 }, { kind: 'line', x1: 203 * 0.83, y1: 0, x2: 203 * 0.83, y2: 127, strokeWidth: 1.4 },
        ...[[0.04, 0.06], [0.96, 0.06], [0.04, 0.94], [0.96, 0.94]].map(([x, y]) => ({ kind: 'circle' as const, cx: 203 * x, cy: 127 * y, r: 2.6, fill: '#3b3222', stroke: '#9a8a60', strokeWidth: 0.8 })),
      ],
      art: [{ art: 'official-victoria-seal', x: 88.5, y: 2.5, width: 26, height: 26, color: '#1a1a1a' }],
      legends: [...column(['L', 'I', 'C.', 'V', 'E', 'H.'], 203 * 0.085, 25, 19.2, 14, 'bc-legend-condensed', 'lic-veh'),
        ...column([...'VICTORIA'], 203 * 0.915, 20, 14.4, 11, 'bc-legend-condensed', 'victoria')],
      serial: { x: 101.5, baseline: 116, cap: 76, maxWidth: 118, die: 'bc-porcelain-1913' } }),
    grammar: numericGrammar([[1, 500]], false),
    description: 'City of Victoria licence for hired vehicles: 8 × 5 in white porcelain with 3 in black numerals, LIC. VEH. and VICTORIA stacked either side between rules, and the city seal above the number. 500 received in February 1913, possibly used again in 1914. No. 6 was briefly Guinness’s “oldest licence plate” (2010–11).' },
  { id: 'official-foreign-1924', label: '1924 · foreign touring F', family: 'official', era: 'official-early', period: [1924, 1924],
    recipe: base1924('official-foreign-1924', '1924 foreign touring', { w: 343, h: 149 }, SRC.foreign, 'bc-tacey-1924', '-{yy}', { serial: { x: 343 * 0.43, baseline: 149 * 0.67, cap: 149 * 0.54, maxWidth: 343 * 0.74, die: 'bc-tacey-1924', separator: { kind: 'dot' } } }),
    palettes: one(1924, '#ebe6d6', '#1f1a14', 'black on white'), grammar: listed('F-101 … F-200', [101, 200, (n) => `F-${n}`]),
    description: 'Visitors’ plates on the 1924 base: black numerals and F on white, made by J.R. Tacey & Son as F-101 to F-200. From 1925 foreign tourists received permits only.' },
  { id: 'official-doctor-1930', label: '1930 · doctor 19-000', family: 'official', era: 'official-early', period: [1930, 1930],
    recipe: base1924('official-doctor-1930', '1930 doctor', { w: 338, h: 148 }, SRC.md, 'bc-straight-1928', '-{yy}'),
    palettes: years(P1924, [1930]), grammar: listed('19-000 … 19-999', [0, 999, d19]),
    description: 'From 1930 doctors were identified by numbers in the 19-000 block on the regular passenger plate: yellow on maroon with a -30 date.' },
  { id: 'official-doctor-1931', label: '1931–35 · doctor 19-000', family: 'official', era: 'official-early', period: [1931, 1935],
    recipe: base1924('official-doctor-1931', '1931–35 doctor', size1924, SRC.md, 'bc-straight-1928', '{yy}'),
    palettes: years(P1924, range(1931, 1935)), grammar: listed('19-000 … 19-999', [0, 999, d19]),
    dies: [{ id: 'bc-straight-1928', label: 'Straight dies (1932–35)' }, { id: 'bc-tacey-1924', label: 'Slanted dies (1931)' }],
    description: 'The 19-000 doctors’ block on each year’s passenger plate (1934: white on dark blue). Choose the slanted dies for 1931.' },
  { id: 'official-doctor-1936', label: '1936–37 · doctor 19-000', family: 'official', era: 'official-early', period: [1936, 1937],
    recipe: base1936('official-doctor-1936', '1936–37 doctor', { w: 292, h: 142 }, SRC.md, { kind: 'dash' }), palettes: years(P1924, [1936, 1937]),
    grammar: listed('19-000 … 19-999', [0, 999, d19]), description: 'The 19-000 block on the smaller 1936–37 passenger plates with the stacked year; no doctor specimen from these two years is pictured.' },
  { id: 'official-doctor-pn-1938', label: '1938–39 · doctor PN', family: 'official', era: 'official-prefix-1938', period: [1938, 1939],
    recipe: base1936('official-pn-1938', '1938–39 doctor PN', { w: 286, h: 136 }, SRC.md, { kind: 'dot' }), palettes: years(P1924, [1938, 1939]),
    grammar: listed('PN-1 … PN-575 (short numbers sometimes without the dash)', [1, 575, (n) => `PN-${n}`], [1, 575, (n) => `PN${n}`]),
    description: 'From 1938 doctors’ plates took a PN prefix on the passenger base (PN-175 in 1939).' },
  { id: 'official-doctor-pn-1940', label: '1940–43 · doctor PN', family: 'official', era: 'official-prefix-1938', period: [1940, 1943],
    recipe: base1940('official-pn-1940', '1940–43 doctor PN', SRC.md, { kind: 'dot' }), palettes: years(P1940, range(1940, 1943)),
    grammar: listed('PN-1 … PN-575', [1, 575, (n) => `PN-${n}`], [1, 575, (n) => `PN${n}`]),
    description: 'PN1–PN575 (1940), PN1–PN550 (1941–43) on the stacked-year base; discontinued in April 1944 at the doctors’ request after “dope holdups”.' },
  { id: 'official-pw-1938', label: '1938–39 · Public Works PW', family: 'official', era: 'official-prefix-1938', period: [1938, 1939],
    recipe: base1936('official-pw-1938', '1938–39 Public Works', { w: 286, h: 136 }, SRC.pw, { kind: 'dash' }), palettes: years(P1924, [1938, 1939]),
    grammar: listed('PW1 … PW999 (short numbers may carry a dash)', [1, 999, (n) => `PW${n}`], [1, 99, (n) => `PW-${n}`]),
    description: 'Public Works Department vehicles carried a PW prefix on the passenger plate from 1938 (PW389 in 1938).' },
  { id: 'official-pw-1940', label: '1940–48 · Public Works PW', family: 'official', era: 'official-prefix-1938', period: [1940, 1948],
    recipe: base1940('official-pw-1940', '1940–48 Public Works', SRC.pw, { kind: 'dash' }), palettes: years(P1940, range(1940, 1948)),
    grammar: listed('PW1 … PW999 (short numbers may carry a dash)', [1, 999, (n) => `PW${n}`], [1, 99, (n) => `PW-${n}`]),
    description: 'PW1–PW900 (1940–41), –PW850 (1942–43), –PW800 (1944–47), –PW999 (1948); the 1948 plate is thought to be the last. PW-12 (1940) shows the dash.' },
  { id: 'official-government-1948', label: '1948 · government E', family: 'official', era: 'official-prefix-1938', period: [1948, 1948],
    recipe: base1940('official-gov-1948', '1948 provincial government', SRC.gov, { kind: 'dot' }, 287, 137), palettes: one(1948, '#eaedef', '#953235', 'red on white'),
    grammar: listed('E-1 … E-999', [1, 999, (n) => `E-${n}`]),
    description: 'In 1948 all provincial government vehicles got special red-on-white plates with an E prefix and a raised dot, on the 287 × 137 mm base. Discontinued after one year; issue numbers unknown.' },
  { id: 'official-defence-1941', label: '1941–48 · National Defence N', family: 'official', era: 'official-prefix-1938', period: [1941, 1948],
    recipe: base1940('official-nd-1941', '1941–48 National Defence', SRC.nd, { kind: 'dot' }), palettes: years(P1940, range(1941, 1948)),
    grammar: { ...listed('N-1 … N-999, N1-000 … N2-999; also the unexplained ND-99A oddities', [1, 999, (n) => `N-${n}`], [1000, 2999, (n) => `N${thousands(n)}`]),
      blocks: [{ pattern: 'ND-[1-9]9A' }] },
    description: 'Military vehicles got N-prefix plates for a nominal fee from 1941 (single plates during the war). 1942 was recorded as N1–N600, yet N1-916 exists; ND-75A (1941) and ND-76J (1942) are unexplained. Colours follow each year’s passenger plate.' },
  { id: 'official-defence-motorcycle', label: '1942–45 · N motorcycle', family: 'official', era: 'official-prefix-1938', period: [1942, 1945],
    recipe: recipe('official-nd-mc', 'National Defence motorcycle', { w: 203, h: 100 }, SRC.nd, {
      radius: 5, holes: 'round', holeAt: { x: [0.46, 0.83], y: [0.13] }, rim: { inset: 3, width: 1.4 }, note: `${NOTE} Size is estimated from photo proportions.`,
      legends: [
        { text: 'BC', x: 203 * 0.155, baseline: 50, cap: 36, maxWidth: 203 * 0.24, die: 'bc-early-1940', role: 'province' },
        { text: '{yyyy}', x: 203 * 0.155, baseline: 86, cap: 18, maxWidth: 203 * 0.24, die: 'bc-early-1940', role: 'year' },
      ],
      serial: { x: 203 * 0.63, baseline: 88, cap: 72, maxWidth: 203 * 0.62, die: 'bc-early-1940' } }),
    palettes: [pal(1944, '#1c1c1e', '#e8e1c8', 'cream on black'), pal(1945, '#c9cccb', '#6a1f2a', 'maroon on white')],
    grammar: listed('N 1 … N 999, N1000 …', [1, 999, (n) => `N ${n}`], [1000, 1999, (n) => `N${n}`]),
    description: 'National Defence motorcycle plates: BC over the year at left and the N number beside it. 1942 ran N1–N250; N1087 (1944) and N 438 (1945) are pictured. Size not stated — estimated from photos.' },
  { id: 'official-defence-1949', label: '1949 & 1954 · National Defence N', family: 'official', era: 'official-prefix-1938', period: [1949, 1954],
    recipe: base1940('official-nd-1949', '1949–54 National Defence', SRC.nd, { kind: 'dot' }, 287, 137),
    palettes: [...years(P1940, [1949]), pal(1954, '#1f1d20', '#c2913e', 'yellow on black')],
    grammar: listed('N-1 … N-999, N1000 …', [1, 999, (n) => `N-${n}`], [1000, 1999, (n) => `N${n}`]),
    description: 'Stacked-year N plates (N-999 in 1949; N-840 and N1371 in 1954, when passengers still renewed the 1952 base but N plates got a new plate). 1950, 1951 and 1953 N plates are not pictured and not offered.' },
  { id: 'official-defence-1952', label: '1952 · National Defence N', family: 'official', era: 'official-prefix-1938', period: [1952, 1952],
    recipe: recipe('official-nd-1952', '1952 National Defence (totem base)', { w: 350, h: 140 }, SRC.nd, {
      radius: 9, holes: 'round', holeAt: { x: [0.27, 0.693], y: [13 / 140, 125 / 140] }, rim: { inset: 2.8, width: 3.2 }, note: BASE_NOTE,
      art: [{ art: 'official-totem', x: 264.8, y: 50.2, width: 69.4, height: 67.6 }],
      legends: [{ text: 'BRITISH COLUMBIA', x: 137, baseline: 122, cap: 21, maxWidth: 243, die: 'bc-legend-1940', role: 'province', spread: true },
        { text: '{yy}', x: 302.6, baseline: 55, cap: 34, maxWidth: 55, die: 'bc-year-1952', role: 'year', spread: true }],
      serial: { x: 137, baseline: 92.5, cap: 70, maxWidth: 244, die: 'bc-early-1940', separator: { kind: 'dot' } } }),
    palettes: years(P1940, [1952]), grammar: listed('N-1 … N-999', [1, 999, (n) => `N-${n}`]),
    description: 'N-24 on the 1952 aluminium totem base (geometry from the passenger totem base, scene.ts), 52 and the totem emblem at the right.' },
  { id: 'official-defence-1955', label: '1955–63 · National Defence N', family: 'official', era: 'official-prefix-1938', period: [1955, 1963],
    recipe: base1955('official-nd-1955', '1955–63 National Defence', SRC.nd, 300, 'bc-legend-1955', true, { kind: 'dot' }),
    palettes: years(P1940, [1955, 1956, 1957, 1959, 1960, 1961, 1962, 1963]),
    grammar: listed('N-1 … N-999 or N1 … N999', [1, 999, (n) => `N-${n}`], [1, 999, (n) => `N${n}`]),
    description: 'N plates on the 300 × 150 mm annual base (N-345 in 1957, N29 in 1961). The small mark before the year is a hole on 1955–57 and a raised dot later; one dot is drawn. Issue ranges are unknown; the 1958 centenary layout is not offered.' },
  { id: 'official-defence-1964', label: '1964 · National Defence N', family: 'official', era: 'official-prefix-1938', period: [1964, 1964],
    recipe: beautiful('official-nd-1964', '1964 National Defence', SRC.nd, 300, 'bottom', { kind: 'dot' }), palettes: years(P1964, [1964]),
    grammar: listed('N1 … N2-400', [1, 999, (n) => `N${n}`], [1000, 2400, (n) => `N${thousands(n)}`]), description: 'N58 on the 1964 BEAUTIFUL base; 1964–66 ran N1 to N2-400.' },
  { id: 'official-defence-1965', label: '1965–67 · National Defence N', family: 'official', era: 'official-prefix-1938', period: [1965, 1967],
    recipe: beautiful('official-nd-1965', '1965–67 National Defence', SRC.nd, 302, 'top', { kind: 'dot' }), palettes: years(P1964, [1965, 1966, 1967]),
    grammar: listed('N1 … N2-400', [1, 999, (n) => `N${n}`], [1000, 2400, (n) => `N${thousands(n)}`]), description: 'Year top right (N111 on the 1967 Centennial red on white). 1967–69 ran N1 to N2-200.' },
  { id: 'official-defence-1968', label: '1968–69 · National Defence N', family: 'official', era: 'official-prefix-1938', period: [1968, 1969],
    recipe: beautiful('official-nd-1968', '1968–69 National Defence', SRC.nd, 302, 'split', { kind: 'dot' }), palettes: years(P1964, [1968, 1969]),
    grammar: listed('N1 … N2-200', [1, 999, (n) => `N${n}`], [1000, 2200, (n) => `N${thousands(n)}`]), description: '19 and the year in the top corners (N1-325 in 1969); provincial N plates ended in 1969.' },
  { id: 'official-defence-canada', label: '1970– · federal CANADA', family: 'official', era: 'official-federal', period: [1970, 2026],
    recipe: recipe('official-canada', 'Federal CANADA plate', { w: 300, h: 150 }, SRC.nd, {
      radius: 7, background: '#e4ded0', ink: '#1e1e22', holes: 'round', holeAt: { x: [0.2, 0.78], y: [0.08, 0.93] }, rim: { inset: 3.5, width: 1.4 }, note: `${NOTE} Dimensions are not stated; the standard 300 × 150 mm is assumed.`,
      art: [{ art: 'official-maple-leaf', x: 16, y: 12, width: 20, height: 20 }, { art: 'official-maple-leaf', x: 264, y: 12, width: 20, height: 20 }],
      shapes: [{ kind: 'rect', x: 12, y: 47, width: 276, height: 88, rx: 5, strokeWidth: 1.2 }],
      legends: [{ text: 'CANADA', x: 150, baseline: 38, cap: 21, maxWidth: 120, die: 'bc-legend-1964', color: '#2a3a33', role: 'country', spread: true }],
      serial: { x: 150, baseline: 127, cap: 66, maxWidth: 262, die: 'bc-astro-4' } }),
    grammar: { blocks: [{ pattern: '99 999' }], hint: '99 999' },
    description: 'From 1970 the federal government used one standard plate for its vehicles across Canada: black number in a raised panel, CANADA between red maple leaves. Replaced the provincial N plates.' },
  { id: 'official-defence-pcmr', label: 'P.C.M.R. · militia rangers', family: 'official', era: 'official-prefix-1938', period: [1942, 1945], status: 'uncertain',
    recipe: recipe('official-pcmr', 'Pacific Coast Militia Rangers', { w: 300, h: 150 }, SRC.nd, {
      embossed: false, radius: 3, background: '#f6efd1', ink: '#23242b', holes: 'none', rim: { inset: 9, width: 2.6 }, note: `${NOTE} Size unknown; smooth reconstruction of the painted Company 71 specimen. Other companies used different designs.`,
      legends: column(['C', 'O', '7', '1'], 267, 42, 30, 24, 'bc-pcmr-71-company', 'company'),
      serial: { x: 132, baseline: 111.5, cap: 76, maxWidth: 232, die: 'bc-pcmr-71', separator: { kind: 'none' }, kerning: {'P.': -7, '.C': 22, 'C.': -7, '.M': 7, 'M.': -5, '.R': 9, 'R.': -5} } }),
    grammar: { blocks: [{ pattern: 'P.C.M.R.' }], hint: 'P.C.M.R.' },
    description: 'Painted plates of the wartime Pacific Coast Militia Rangers; this is company 71 (Penticton). Their legal status is not recorded and designs vary by company.' },
  { id: 'official-defence-esquimalt', label: 'Esquimalt Garrison · D.N.D.', family: 'official', era: 'official-prefix-1938', period: [1956, 1957], status: 'uncertain',
    recipe: recipe('official-esquimalt', 'Esquimalt Garrison base plate', { w: 300, h: 165 }, SRC.nd, {
      radius: 6, background: '#ae1f28', ink: '#e8d8b8', holes: 'round', holeAt: { x: [0.04, 0.96], y: [0.07, 0.93] }, rim: { inset: 4, width: 1.6 }, note: `${NOTE} Size and dates unknown.`,
      shapes: [{ kind: 'rect', x: 95, y: 58, width: 110, height: 58, rx: 3, strokeWidth: 1.2 }],
      legends: [{ text: 'ESQ. GARRISON', x: 150, baseline: 44, cap: 25, maxWidth: 250, die: 'bc-legend-1940', role: 'base' },
        { text: 'D.N.D.', x: 150, baseline: 150, cap: 24, maxWidth: 150, die: 'bc-legend-1940', role: 'dnd', spread: true }],
      serial: { x: 150, baseline: 108, cap: 42, maxWidth: 100, die: 'bc-early-1940' } }),
    grammar: { blocks: [{ pattern: '999' }], hint: '999' },
    description: 'Base access plates are understood to have been issued to members stationed at the bases; many known examples are manufacturer samples. Cream on red, number in a raised panel.' },
  { id: 'official-defence-comox', label: 'RCAF Comox base plate', family: 'official', era: 'official-prefix-1938', period: [1956, 1957], status: 'uncertain',
    recipe: recipe('official-comox', 'RCAF Comox base plate', { w: 300, h: 165 }, SRC.nd, {
      radius: 6, background: '#f0efe8', ink: '#151515', holes: 'round', holeAt: { x: [0.05, 0.95], y: [0.07, 0.93] }, rim: { inset: 4, width: 1.6 }, note: `${NOTE} Size and dates unknown.`,
      legends: [{ text: 'RCAF', x: 90, baseline: 38, cap: 22, maxWidth: 100, die: 'bc-legend-1964', role: 'service' },
        { text: 'COMOX', x: 212, baseline: 38, cap: 22, maxWidth: 120, die: 'bc-legend-1964', role: 'base' }],
      serial: { x: 150, baseline: 138, cap: 80, maxWidth: 240, die: 'bc-oakalla-1955' } }),
    grammar: { blocks: [{ pattern: '999' }, { pattern: '[1-9]999' }], hint: '999 or 9999' },
    description: 'RCAF Comox station plate, black on white (No. 1059; Comox 1956 No. 532 is also recorded). Purpose and dates unconfirmed.' },
  { id: 'official-parks-1927', label: '1927–35 · red-bordered (Golden)', family: 'official', era: 'official-early', period: [1927, 1935],
    recipe: base1924('official-parks-1927', '1927–35 red-bordered', size1924, SRC.parks, 'bc-straight-1928', '{yy}', { rim: RED_RIM }),
    palettes: years(P1924, [1927, 1928, 1931, 1932, 1933, 1934, 1935]), grammar: numericGrammar(parksRanges, true),
    dies: [{ id: 'bc-straight-1928', label: 'Straight dies (1928, 1932–35)' }, { id: 'bc-tacey-1924', label: 'Slanted dies (1927, 1931)' }],
    description: 'Passenger plates from the Golden office with the rim painted red, very likely so residents could enter Banff National Park freely. Blocks: 31,501–31,725 (1927), 36,976–37,200 (1928), 35,401–35,850 (1931), 30,026–30,525 (1932), 27,801–28,200 (1933), 29,251–29,625 (1934), 29,576–29,950 (1935). Choose the slanted dies for 1927 and 1931.' },
  { id: 'official-parks-1930', label: '1930 · red-bordered (Golden)', family: 'official', era: 'official-early', period: [1930, 1930],
    recipe: base1924('official-parks-1930', '1930 red-bordered', { w: 338, h: 148 }, SRC.parks, 'bc-straight-1928', '-{yy}', { rim: RED_RIM }),
    palettes: years(P1924, [1930]), grammar: numericGrammar([[45751, 46075]], true),
    description: 'The 1930 Golden block 45,751–46,075, yellow on maroon with a -30 date and the red rim. No 1929 block is recorded.' },
  { id: 'official-parks-1936', label: '1936 · red-bordered CF', family: 'official', era: 'official-early', period: [1936, 1936],
    recipe: base1936('official-parks-1936', '1936 red-bordered', { w: 292, h: 142 }, SRC.parks, { kind: 'dash' }, { rim: RED_RIM }),
    palettes: years(P1924, [1936]), grammar: listed('CF-451 … CF-575', [451, 575, (n) => `CF-${n}`]),
    description: 'In 1936 the Golden plates were CF451–CF575 (CF-472 pictured), cream on green with the red rim and stacked year.' },
  { id: 'official-lt-governor-arms', label: 'Lieutenant Governor · coat of arms', family: 'official', era: 'official-federal', period: [1998, 2016],
    recipe: recipe('official-lg-arms', 'Lieutenant Governor coat of arms', { w: 300, h: 150 }, SRC.lg, {
      embossed: false, radius: 6, background: '#080a0d', ink: '#b08a3a', holes: 'round', holeAt: { x: [0.2, 0.8], y: [0.08] }, rim: null, note: `${NOTE} Size assumed 300 × 150 mm. A filled gold relief reconstruction replaces the fine-line tin-plate arms; its contour and metallic relief remain approximate. The late-1990s start is uncertain; source photos show the arms in 2003 and 2016.`,
      art: [{ art: 'official-lg-arms-solid', x: 84, y: 13, width: 132, height: 124 }], legends: [], serial: NO_NUMBER }),
    grammar: noNumber,
    description: 'A solid die-struck British Columbia coat of arms on black. The source describes replacement by the crest in 2008 but also photographs the older arms in 2016, so both designs overlap in the catalogue. The start date is not known (possibly the late 1990s); the 1998 period anchor is approximate.' },
  { id: 'official-lt-governor-crest', label: 'Lieutenant Governor · crest', family: 'official', era: 'official-federal', period: [2008, 2026],
    recipe: recipe('official-lg-crest', 'Lieutenant Governor crest', { w: 300, h: 150 }, SRC.lg, {
      embossed: false, radius: 6, background: '#080a0d', ink: '#c5a34a', holes: 'round', holeAt: { x: [0.2, 0.8], y: [0.88] }, rim: null, note: `${NOTE} Size assumed 300 × 150 mm. The supplied crest vector retains its red, white and blue details with yellow changed to gold, inside a full-height blue plaque with a gold trim. Plaque placement and enamel colours are approximate source readings.`,
      art: [{ art: 'official-lg-crest-supplied', x: 75, y: 0, width: 150, height: 150 }], legends: [], serial: NO_NUMBER }),
    grammar: noNumber,
    description: 'Since 2008: the Lieutenant Governor’s crest (the B.C. shield in a circlet of ten gold maple leaves under the crown, on royal blue) as a plaque on a black blank.' },
];

// ── Events & ceremonial ──────────────────────────────────────────────────────
const EXPO_BLUE = '#3d7fd0';
/** Photo-calibrated wordmark spacing; the shared Medium glyphs retain their native shapes. */
const EXPO_KERNING = {EX: -4, XP: -10.1, PO: -11.7, O8: 6.5, '86': -17.6};
const expoWordmark = (x: number, baseline: number, cap: number, maxWidth: number, color = EXPO_BLUE): KitText =>
  ({text: 'EXPO86', x, baseline, cap, maxWidth, color, die: 'bc-frankfurter-expo', role: 'expo-wordmark', kerning: EXPO_KERNING});
const serif = (text: string, x: number, baseline: number, size: number, color: string, width?: number, weight = 400, italic = false): KitFontText =>
  ({ text, x, baseline, size, font: 'serif', color, weight, italic, role: 'legend', ...(width ? { width } : {}) });
const sans = (text: string, x: number, baseline: number, size: number, color: string, width?: number, weight = 500): KitFontText =>
  ({ text, x, baseline, size, font: 'sans', color, weight, role: 'legend', ...(width ? { width } : {}) });
const COURTESY = ['Courtesy of Govt of British Columbia', 'Ministry of Transportation and Highways', 'Motor Vehicle Dept.', 'Honourable A.V. Fraser, Minister'];
function expoBooster(id: string, aamva: boolean): KitRecipe {
  const w = 180, h = 112;
  return recipe(id, `Expo 86 motorcycle-base booster${aamva ? ' (AAMVA)' : ''}`, { w, h }, SRC.expo, {
    embossed: false, radius: 6, background: '#e6e7e3', ink: '#1f3a8a', holes: 'slots', holeAt: { x: [0.2, 0.8], y: [0.08, 0.9] }, rim: { inset: 3, width: 1, color: '#c5cfda' },
    note: `${NOTE} Motorcycle-base size is not stated; estimated from photo proportions.`,
    art: [{ ...cornerFlag, x: 8, y: 83, width: 26, height: 20 }],
    shapes: [{ kind: 'rect', x: 58, y: 84, width: 72, height: 22, rx: 2, stroke: '#c9ccd2', strokeWidth: 0.8 }],
    fontLegends: [serif('Beautiful British Columbia', 90, 19, 13, '#1f3a8a', 150, 700), serif('What the World is Coming to!', 90, 79, 10, '#111', 130, 700),
      ...COURTESY.map((t, i) => sans(t, 94, 90 + i * 3.7, 3, '#222')),
      ...(aamva ? [sans('A.A.M.V.A.', 156, 93, 5.5, '#1f3a8a'), serif('Edmonton ’85', 156, 99, 5.5, '#1f3a8a')] : [])],
    legends: [expoWordmark(90, 66, 28.5, 155)], serial: NO_NUMBER,
  });
}

const eventSpecs: Spec[] = [
  { id: 'events-royal-1951', label: '1951 Royal Tour', family: 'events', era: 'events-royal', period: [1951, 1951],
    recipe: recipe('events-royal-1951', '1951 Royal Tour', { w: 305, h: 165 }, SRC.royal, {
      embossed: false, radius: 5, background: '#800217', ink: '#c8b070', holes: 'round', holeAt: { x: [0.2, 0.8], y: [0.08, 0.92] }, rim: null,
      shapes: [{ kind: 'rect', x: 6, y: 6, width: 293, height: 153, rx: 3, stroke: '#c8b070', strokeWidth: 0.8 }],
      note: `${NOTE} The central arms use the exact user-supplied transparent PNG, scaled uniformly; placement remains approximate.`,
      artworkAccuracy: 'exact user-supplied raster image; approximate placement',
      art: [{ art: 'royal-canada-arms-supplied', x: 100, y: 10, width: 105, height: 145 }],
      fontLegends: [], legends: [
        {text: '19', x: 66.8, baseline: 95, cap: 33, die: 'bc-royal-1951', kerning: {'19': 29}, role: 'year-left'},
        {text: '51', x: 240.7, baseline: 95, cap: 33, die: 'bc-royal-1951', kerning: {'51': 33}, role: 'year-right'},
      ], serial: NO_NUMBER }),
    grammar: noNumber,
    description: 'Princess Elizabeth’s 1951 tour plate: the Royal Arms of Canada in colour between a gold 19 and 51 on crimson, 12 × 6.5 in rather than the new 12 × 6 in standard. It was used across Canada, not only in B.C.' },
  { id: 'events-royal-1987', label: '1987 ROYAL 1–20', family: 'events', era: 'events-royal', period: [1987, 1987],
    recipe: flagBase('events-royal-1987', '1987 ROYAL (ham base)', SRC.royal, 'bc-royal-1987', 'single', {
      ink: '#d8342c', serial: {x: 153, baseline: 109.5, cap: 66.5, maxWidth: 268, die: 'bc-royal-1987', color: '#d8342c', separator: {kind: 'none'}},
      fontLegends: [], legends: [{text: 'Beautiful British Columbia', x: 153, baseline: 37, cap: 16.5, spacing: -4,
        die: 'bc-royal-screened-slogan', color: '#174db7', role: 'slogan'}],
      note: `${BASE_NOTE} One coherent lettering construction checked against ROYAL 1 and ROYAL 18; physical die identity and unobserved digit contours remain unconfirmed.`,
    }),
    grammar: { blocks: [{ pattern: 'ROY\\AL[1-9]' }, { pattern: 'ROY\\AL1[0-9]' }, { pattern: 'ROY\\AL20' }], hint: 'ROYAL1 … ROYAL20' },
    description: 'For the 1987 Commonwealth Heads of Government visit, twenty pairs ROYAL 1–ROYAL 20 were made on the Ham Radio blank, with red serials in the colour of the 1986 prorated plates. The decal box stays empty.' },
  { id: 'events-royal-1994', label: '1994 Commonwealth Games visit', family: 'events', era: 'events-royal', period: [1994, 1994],
    recipe: flagBase('events-royal-1994', '1994 Royal Visit (Commonwealth Games)', SRC.royal, 'bc-astro-4', 'none', {
      ink: '#1e4fb0', fontLegends: [serif('XV COMMONWEALTH GAMES', 150, 36, 18, '#3a64b8', 232, 700, true)],
      art: [cornerFlag, { art: 'official-royal-visit-1994', x: 55, y: 42, width: 62, height: 62, role: 'visit-badge' }],
      shapes: [{ kind: 'rect', x: 92, y: 117, width: 104, height: 23, fill: '#1e4fb0' }],
      legends: [{ text: 'VICTORIA B.C.', x: 144, baseline: 134, cap: 13, maxWidth: 96, die: 'bc-legend-condensed', color: '#ffffff', role: 'city' }],
      serial: { x: 196, baseline: 104, cap: 62, maxWidth: 110, die: 'bc-astro-4', color: '#1e4fb0', separator: { kind: 'none' } } }),
    grammar: { blocks: [{ pattern: '[CFPRS][1-5]' }], hint: 'C, F, P, R or S + 1–5' },
    description: 'Plates for the royal party at the XV Commonwealth Games, Victoria: the Ham Radio blank with the Visit Badge (E II R, crown and maple leaf on gold), and VICTORIA B.C. in a blue panel over the decal area. Alphanumeric serials such as R1, C1, S3 (19 sets); 18 pairs were later sold by sealed bid.' },
  { id: 'events-royal-1994-prototype', label: '1994 Commonwealth Games prototype', family: 'events', era: 'events-royal', period: [1994, 1994], status: 'prototype',
    recipe: flagBase('events-royal-1994-proto', '1994 Commonwealth Games prototype', SRC.royal, 'bc-astro-4', 'none', {
      ink: '#1e4fb0', fontLegends: [serif('XV COMMONWEALTH GAMES', 150, 36, 18, '#3a64b8', 232, 700, true)],
      art: [cornerFlag, { art: 'official-royal-visit-1994', x: 55, y: 42, width: 62, height: 62, role: 'visit-badge' }],
      shapes: [{ kind: 'rect', x: 92, y: 117, width: 104, height: 23, fill: '#1e4fb0' }],
      legends: [{ text: 'VICTORIA B.C.', x: 144, baseline: 134, cap: 13, maxWidth: 96, die: 'bc-legend-condensed', color: '#ffffff', role: 'city' }],
      serial: { x: 196, baseline: 104, cap: 62, maxWidth: 110, die: 'bc-astro-4', color: '#1e4fb0', separator: { kind: 'none' } } }),
    grammar: { blocks: [{ pattern: '94' }, { pattern: '24' }], hint: '94 or 24' },
    description: 'Astrographic prototypes of the Games plate with a plain number and no letter prefix (Nos. 94 and 24).' },
  { id: 'events-royal-crown', label: 'Royal car · gold crown on red', family: 'events', era: 'events-royal', period: [1987, 2016],
    recipe: recipe('events-royal-crown', 'Royal vehicle crown plate', { w: 300, h: 150 }, SRC.royal, {
      embossed: false, radius: 10, background: '#c8282a', ink: '#d4b04a', holes: 'round', holeAt: { x: [0.2, 0.78], y: [0.08] }, rim: null,
      note: `${NOTE} Size unknown (300 × 150 mm assumed); the 2002 and 2009 photos show a crown. The supplied St Edward’s crown vector replaces the simplified crown construction. Placement and metallic finish remain approximate.`,
      art: [{ art: 'official-edward-crown-supplied', x: 96, y: 29, width: 108, height: 96 }], legends: [], serial: NO_NUMBER }),
    grammar: noNumber,
    description: 'The Sovereign’s limousine on visits carried a red plate with a gold emblem instead of a number (seen in 2002 and 2009).' },
  { id: 'events-apec-1997', label: 'APEC 1997 motorcade (ICBC)', family: 'events', era: 'events-apec-1997', period: [1997, 1997],
    recipe: recipe('events-apec-1997', 'APEC 1997 motorcade', { w: 300, h: 150 }, SRC.apec, {
      radius: 7, background: '#ece6e0', ink: '#1f8aa0', holes: 'slots', holeAt: { x: [0.21, 0.79], y: [0.113, 0.88] }, rim: { inset: 4.5, width: 1.2, color: '#c5cfda' },
      note: `${NOTE} Size assumed from the contemporary 300 × 150 mm base; the three logos use supplied vector reconstructions; historical colours and placement remain approximate.`,
      art: [{ art: 'official-asia-pacific', x: 8, y: 9, width: 34, height: 30 }, { art: 'official-pacific-gateway', x: 257, y: 7, width: 30, height: 37 },
        { art: 'official-apec', x: 31, y: 49, width: 124, height: 65 }],
      fontLegends: [],
      legends: [
        {text: 'Vancouver', x: 152, baseline: 21.2, cap: 11.2, spacing: -3, die: 'bc-apec-screened-legends', color: '#222', role: 'city'},
        {text: 'British Columbia', x: 152, baseline: 38.1, cap: 11.8, spacing: -3, die: 'bc-apec-screened-legends', color: '#222', role: 'province'},
        {text: 'Canada', x: 94, baseline: 125, cap: 7.2, die: 'bc-apec-screened-legends', color: '#222', role: 'country'},
        {text: 'Nov. 19 - 25 1997', x: 94, baseline: 131, cap: 4.2, die: 'bc-apec-screened-legends', color: '#222', role: 'date'},
      ], serial: { x: 226, baseline: 124, cap: 66, maxWidth: 130, die: 'bc-astro-4', separator: { kind: 'none' } } }),
    grammar: numericGrammar([[100, 350]], false),
    references: [{title: 'Agriculture and Agri-Food Canada · Agriculture and agri-food moving forward (1997), p. 3', url: 'https://publications.gc.ca/collections/collection_2014/aac-aafc/agrhist/A22-165-1997-eng.pdf#page=3'}],
    description: 'ICBC made 250 pairs for the APEC leaders’ motorcade, thought to run from No. 100 to No. 350: teal embossed number, the APEC globe, the federal “Canada’s Year of Asia Pacific” mark (top left) and B.C.’s “Pacific Gateway” welcome symbol (top right). The Asia Pacific logo is a stylized crane whose wings evoke a Canadian maple leaf, designed by Amy Ho, then a first-year design student at Kwantlen University College in Richmond, B.C. Canada’s Year of Asia Pacific began in January 1997 to strengthen trade and cultural links with Asia. A contemporary Agriculture and Agri-Food Canada publication reported more than $4.4 billion in agri-food exports to the area in 1995–96.' },
  { id: 'events-apec-1997-military', label: 'APEC 1997 · CANADA military', family: 'events', era: 'events-apec-1997', period: [1997, 1997],
    recipe: recipe('events-apec-military', 'APEC 1997 military CANADA plate', { w: 300, h: 150 }, SRC.apec, {
      radius: 7, background: '#ebe0d6', ink: '#151515', holes: 'slots', holeAt: { x: [0.2, 0.78], y: [0.07, 0.93] }, rim: { inset: 3.5, width: 1.4, color: '#2c4a3c' },
      note: `${NOTE} Size assumed 300 × 150 mm; the APEC sticker is simplified.`,
      shapes: [{ kind: 'rect', x: 12, y: 47, width: 276, height: 88, rx: 5, strokeWidth: 1.2, stroke: '#2c4a3c' }],
      art: [{ art: 'official-apec-sticker', x: 18, y: 55, width: 82, height: 70 }],
      legends: [{ text: 'CANADA', x: 150, baseline: 38, cap: 21, maxWidth: 120, die: 'bc-legend-1964', color: '#2c4a3c', role: 'country', spread: true }],
      serial: { x: 196, baseline: 127, cap: 66, maxWidth: 170, die: 'bc-astro-4' } }),
    grammar: { blocks: [{ pattern: '[1-9]99' }], hint: '999 (range unknown)' },
    description: 'Canadian Forces vehicles in the APEC motorcade used the federal CANADA plate with an APEC sticker at left. No. 134 also has red maple leaves beside CANADA (not drawn); the number range is unknown.' },
  { id: 'events-expo86-presentation', label: 'EXPO 86 presentation plate', family: 'events', era: 'events-expo-1985', period: [1985, 1986],
    recipe: { ...flagBase('events-expo86', 'EXPO 86 presentation plate', SRC.expo, 'bc-astro-4', 'single', { ink: '#193780', art: [] }),
      serial: { x: 150, baseline: 109.5, cap: 64, maxWidth: 268, die: 'bc-astro-4', color: '#193780', separator: { kind: 'art', gap: 2.5, art: { art: 'bc-spirit-flag', x: 0, y: 63, width: 42, height: 32 } } } },
    grammar: { blocks: [{ pattern: 'EXPO-86' }], hint: 'EXPO-86 (the flag stands in for the dash)' },
    description: 'On 21 March 1985 Premier Bill Bennett presented Rick Hansen with the first set of the new flag-series plates, reading EXPO [flag] 86.' },
  { id: 'events-expo86-booster', label: 'Expo 86 motorcycle-base booster', family: 'events', era: 'events-expo-1985', period: [1985, 1986], status: 'souvenir',
    recipe: expoBooster('events-expo86-booster', false), grammar: noNumber,
    description: 'Promotional booster on the motorcycle flag base: the Expo 86 logo, “What the World is Coming to!” and a courtesy line from the Ministry of Transportation and Highways in the decal area. Who received them is not known.' },
  { id: 'events-expo86-booster-aamva', label: 'Expo 86 booster · AAMVA ’85', family: 'events', era: 'events-expo-1985', period: [1985, 1985], status: 'souvenir',
    recipe: expoBooster('events-expo86-booster-aamva', true), grammar: noNumber,
    description: 'Variant of the Expo 86 booster with “A.A.M.V.A. Edmonton ’85” added at bottom right.' },
  { id: 'events-expo86-prototype', label: 'Expo 86 promotional prototype', family: 'events', era: 'events-expo-1985', period: [1985, 1985], status: 'prototype',
    recipe: recipe('events-expo86-prototype', 'Expo 86 promotional prototype', { w: 300, h: 150 }, SRC.expo, {
      radius: 7, background: '#e6e7e3', ink: '#1a2a5a', holes: 'round', holeAt: { x: [0.25, 0.75], y: [0.07, 0.93] }, rim: { inset: 4.5, width: 1.2, color: '#c5cfda' },
      art: [{ ...cornerFlag, x: 12, y: 118, width: 30, height: 24 }, { ...cornerFlag, x: 258, y: 118, width: 30, height: 24 }],
      fontLegends: [serif('Beautiful British Columbia', 150, 30, 19.5, '#1f3a8a', 237), serif('What the World is Coming to!', 150, 112, 13, '#111', 210, 700)],
      legends: [expoWordmark(150, 95, 52, 264)], serial: { x: 150, baseline: 146, cap: 18, maxWidth: 110, die: 'bc-astro-4', separator: { kind: 'none' } } }),
    grammar: { blocks: [{ pattern: '999 999' }], hint: '999 999 (stamped in the decal area)' },
    description: 'Prototype of the promotional plate on the full-size passenger base, with a number stamped in the decal area (201 307); the plate was eventually produced on the motorcycle base.' },
  { id: 'events-expo86-souvenir', label: 'Expo 86 souvenir (Universal Exchange)', family: 'events', era: 'events-expo-1985', period: [1986, 1986], status: 'souvenir',
    recipe: recipe('events-expo86-souvenir', 'Expo 86 souvenir plate', { w: 300, h: 150 }, SRC.expo, {
      embossed: false, radius: 16, background: '#eff1f0', ink: '#2b67aa', holes: 'slots', holeAt: { x: [0.22, 0.78], y: [0.12, 0.88] }, rim: { inset: 9.5, width: 1.4 },
      art: [],
      legends: [expoWordmark(150, 102, 51.4, 280, '#2b67aa'),
        { text: 'VANCOUVER', x: 150, baseline: 32, cap: 12, maxWidth: 110, die: 'bc-legend-1973', role: 'city', spread: true },
        { text: 'BRITISH COLUMBIA', x: 150, baseline: 128, cap: 12, maxWidth: 226, die: 'bc-legend-1973', role: 'province', spread: true }],
      serial: NO_NUMBER }),
    grammar: noNumber,
    description: 'Retail souvenir plate by Universal Exchange with Astrographic (about 10,000 made by February 1986, $6.98). The rounded EXPO86 wordmark uses Frankfurter Std Medium fixed outlines, selected by comparing all six characters with the photograph. Original typeface attribution remains a visual match; the linked official event symbol is a separate design.' },
  { id: 'events-expo86-stencil', label: 'EXPO-86 stencilled booster', family: 'events', era: 'events-expo-1985', period: [1986, 1986], status: 'souvenir',
    recipe: recipe('events-expo86-stencil', 'EXPO-86 stencilled booster', { w: 300, h: 150 }, SRC.expo, {
      embossed: false, radius: 6, background: '#2c5da8', ink: '#ddaf24', holes: 'slots', holeAt: { x: [0.25, 0.75], y: [0.06, 0.94] }, rim: { inset: 3, width: 1 },
      note: `${NOTE} Size estimated.`, legends: [], serial: { x: 150, baseline: 128, cap: 100, maxWidth: 272, die: 'bc-oakalla-1970', separator: { kind: 'dot' } } }),
    grammar: { blocks: [{ pattern: 'EXPO-86' }], hint: 'EXPO-86' },
    description: 'Flat stencilled yellow-on-blue EXPO·86 plate; it is unknown whether it was a motorist’s one-off or an unlicensed booster.' },
  { id: 'events-expo86-concours', label: 'Concours d’Elegance 1986', family: 'events', era: 'events-expo-1985', period: [1986, 1986], status: 'souvenir',
    recipe: recipe('events-expo86-concours', 'Vintage International Concours d’Elegance', { w: 300, h: 150 }, SRC.concours, {
      radius: 7, background: '#ece6e0', ink: '#2a4fb0', holes: 'slots', holeAt: { x: [0.24, 0.76], y: [0.07, 0.93] }, rim: { inset: 4, width: 1, color: '#c5cfda' },
      decal: { x: 103, y: 116, width: 94, height: 29 },
      shapes: [{ kind: 'line', x1: 32, y1: 23.5, x2: 268, y2: 23.5, stroke: '#c83030', strokeWidth: 0.6 }],
      art: [{ art: 'bc-spirit-flag', x: 152, y: 60, width: 42, height: 32 }, { art: 'official-maple-leaf', x: 239, y: 129, width: 12, height: 12 }],
      fontLegends: [serif('Concours d’Elegance', 150, 20, 13, '#c83030', 132), serif('VINTAGE INTERNATIONAL', 150, 39, 14, '#1a1a1a', 236),
        serif('VANCOUVER', 56, 124, 10, '#1a1a1a'), serif('B.C.', 56, 135, 10, '#1a1a1a'), serif('CANADA', 245, 124, 10, '#1a1a1a')],
      legends: [{ text: 'EXPO', x: 82, baseline: 104, cap: 58, maxWidth: 122, die: 'bc-astro-4', role: 'expo' }, { text: '86', x: 245, baseline: 104, cap: 58, maxWidth: 66, die: 'bc-astro-4', role: 'expo-year' }],
      serial: { x: 150, baseline: 141, cap: 20, maxWidth: 70, die: 'bc-astro-4', separator: { kind: 'none' } } }),
    grammar: listed('001 … 500 (stall number)', [1, 500, (n) => String(n).padStart(3, '0')]),
    description: 'Plates for the Vintage International antique auto show at BC Place during Expo 86: EXPO [flag] 86 with the car’s stall number (1–500) stamped in the decal box. Late registrants got un-numbered plates; a few higher numbers (1931, 1957 …) were probably special orders.' },
  { id: 'events-expo86-nwt', label: 'Expo 86 · NWT pavilion polar bear', family: 'events', era: 'events-expo-1985', period: [1986, 1986], status: 'uncertain',
    recipe: recipe('events-expo86-nwt', 'NWT pavilion polar-bear plate', { w: 300, h: 150 }, SRC.expo, {
      radius: 0, background: 'none', ink: '#3262bc', holes: 'slots', rim: null,
      cutOutline: {path: NWT_POLAR_BEAR_PATH, viewBox: [600, 300]},
      holeGeometry: NWT_POLAR_BEAR_SLOTS.map(({cx, cy, width, height, rx}) => ({cx: cx / 2, cy: cy / 2, width: width / 2, height: height / 2, rx: rx / 2})),
      note: `${NOTE} Uses the shared NWT reference reconstruction and independent inset border, with transparent cut edges and slotted mounts. Exact Expo-era tooling and overall size remain unverified.`,
      art: [{ art: 'official-polar-bear', x: 0, y: 0, width: 300, height: 150, role: 'bear-shape' }],
      fontLegends: [sans('EXPLORE CANADA’S ARCTIC', 136, 39, 17, '#3262bc', 220, 600), sans('NORTHWEST TERRITORIES', 127, 118, 17, '#3262bc', 198, 600)],
      legends: [], serial: { x: 130, baseline: 100, cap: 57, maxWidth: 204, die: 'bc-astro-3', separator: { kind: 'none' } } }),
    grammar: { blocks: [{ pattern: 'EXPO [1-9]' }, { pattern: 'EXPO 86' }], hint: 'EXPO 9 (pavilion vehicles) or EXPO 86 (samples/souvenirs)' },
    description: 'Northwest Territories plates in the polar-bear shape for its Expo 86 pavilion: single-digit EXPO plates were used on pavilion vehicles; the commoner EXPO 86 plates were samples or souvenirs.' },
  { id: 'events-vancouver-100', label: 'Vancouver 100 souvenir', family: 'events', era: 'events-expo-1985', period: [1986, 1986], status: 'souvenir',
    recipe: recipe('events-vancouver-100', 'Vancouver centennial souvenir', { w: 300, h: 150 }, SRC.expo, {
      embossed: false, radius: 7, background: '#f3f5f2', ink: '#0047BA', holes: 'slots', holeAt: { x: [0.22, 0.79], y: [0.10, 0.90] }, rim: null,
      note: `${NOTE} User-supplied geometric Centennial reconstruction; colours and physical placement are approximate.`,
      art: [{ art: 'official-vancouver-100', x: 76, y: 15, width: 148, height: 113 }],
      shapes: [{ kind: 'line', x1: 8, y1: 136, x2: 292, y2: 136, stroke: '#38B114', strokeWidth: 3.4 }, { kind: 'line', x1: 8, y1: 143, x2: 292, y2: 143, stroke: '#0047BA', strokeWidth: 3.4 }],
      legends: [...column([...'1886'], 53, 50, 19, 14, 'bc-frankfurter-centennial-years', 'from').map((t) => ({ ...t, color: '#38B114' })),
        ...column([...'1986'], 247, 50, 19, 14, 'bc-frankfurter-centennial-years', 'to').map((t) => ({ ...t, color: '#0047BA' }))],
      fontLegends: [], serial: NO_NUMBER }),
    grammar: noNumber,
    description: 'Vancouver Centennial souvenir: supplied outlined VANCOUVER and city of the century wordmarks, joined 100, mountain bands, skyline and water. The supplied artwork is a geometric reconstruction. Green 1886 and blue 1986 columns follow the photographed souvenir; original font attribution remains a visual identification.' },
];

export const BC_OFFICIAL_FORMATS: PlateFormat[] = [...hamSpecs, ...officialSpecs, ...eventSpecs].map((s) => kitFormat({
  id: s.id, label: s.label, family: s.family, era: s.era, period: s.period, ...(s.status ? { status: s.status } : {}),
  recipe: s.recipe, grammar: s.grammar, description: s.description,
  ...(s.references ? {references: s.references} : {}),
  ...(s.palettes ? { palettes: s.palettes } : {}), ...(s.dies ? { dies: s.dies } : {}), ...(s.decals ? { decals: s.decals } : {}),
}));
