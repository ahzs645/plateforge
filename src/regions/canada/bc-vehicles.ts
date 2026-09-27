/**
 * B.C. vehicle-class plates: commercial trucks, farm tractors and trucks,
 * trailers (commercial, utility, floater) and motorcycles (incl. dealer),
 * 1921–2025. Facts, layouts and colours come from the BCpl8s class chapters;
 * colours are read from single aged photographs and are approximate.
 *
 * From 1985 most classes use the ordinary flag plate with no class word, so
 * those formats reuse the passenger flag recipes from bc-flag.ts and differ only
 * in serial format. 1976 and 1979 layouts follow the passenger bases of those
 * years (later-scene.ts geometry, scaled from photos).
 */
import '../../templates/bc/art-vehicles';
import './bc-flag'; // registers the passenger flag recipes reused below
import type { PlateEra, PlateFamily, PlateFormat, PlateStatus } from '../../core/types';
import type { KitDecal, KitFontText, KitRecipe, KitSerial, KitShape, KitText } from '../../templates/bc/kit';
import { kitFormat, kitRecipe, numericGrammar, type KitPalette, type SerialGrammar } from './bc-kit';

const page = (file: string, title: string) => ({ title: `BCpl8s · ${title}`, url: `https://www.bcpl8s.ca/${file}` });
const SRC = {
  c1924: page('CommercialTruck1924.html', 'Commercial Truck 1924'),
  c1936: page('CommercialTruck1936-1948.html', 'Commercial Truck 1936–1948'),
  c1949: page('CommercialTruck1949-1951.html', 'Commercial Truck 1949–1951'),
  c1952: page('CommercialTruck1952-1954.html', 'Commercial Truck 1952–1954'),
  c1955: page('CommercialTruck1955-1956.html', 'Commercial Truck 1955–1956'),
  c1957: page('CommercialTruck1957-1963.html', 'Commercial Truck 1957–1963'),
  c1964: page('CommercialTruck1964-1971.html', 'Commercial Truck 1964–1971'),
  c1972: page('CommercialTruck1972-1975.html', 'Commercial Truck 1972–1975'),
  c1976: page('CommercialTruck1976-1978.html', 'Commercial Truck 1976–1978'),
  c1979: page('CommercialTruck1979-1986.html', 'Commercial Truck 1979–1986'),
  c1985: page('CommercialTruck1985-2009.html', 'Commercial Truck 1985–2009'),
  c2008: page('CommercialTruck2008-2025.html', 'Commercial Truck 2008–2025'),
  farm: page('Farm.html', 'Farm Tractor'),
  farmTruck: page('Farm-Truck.html', 'Farm Truck'),
  trailer: page('Trailer.htm', 'Trailer'),
  utility: page('Trailer-Utility.htm', 'Utility Trailer'),
  floater: page('Trailer-Floater.htm', 'Trailer Floater'),
  mc: page('Motorcycle.htm', 'Motorcycle'),
  mcDealer: page('Dealer-Motorcycle.htm', 'Motorcycle Dealer'),
};
type Source = typeof SRC[keyof typeof SRC];

const NOTE = 'Vehicle-class reconstruction from BCpl8s photographs: layout proportions are measured from photos, colours are read from aged plates, and dies are the nearest passenger die of the period. Validation checks the documented serial format, not a real registration.';
const FLAG_NOTE = 'Same flag base as passenger plates (no class legend); only the serial format identifies the class. Slogan typeface, flag artwork and paint are approximate.';
const SMALL_NOTE = 'Small-format plate. Size is estimated (see description); layout proportions are measured from photos.';

// ── shared construction helpers ─────────────────────────────────────────────
interface Look { w: number; h: number; bg: string; ink: string }
const pal = (year: number, bg: string, ink: string, words: string, extra = ''): KitPalette =>
  ({ id: String(year), label: `${year} · ${words}${extra}`, background: bg, ink, year });

/** A die legend placed by fractions of the plate (x, baseline, cap height; maxWidth as a fraction of width). */
function T(b: Look, text: string, x: number, y: number, cap: number, die: string, role: string, mw?: number, more: Partial<KitText> = {}): KitText {
  return { text, x: b.w * x, baseline: b.h * y, cap: b.h * cap, die, role, ...(mw ? { maxWidth: b.w * mw } : {}), ...more };
}
function F(b: Look, text: string, x: number, y: number, size: number, role: string, more: Partial<KitFontText> = {}): KitFontText {
  return { text, x: b.w * x, baseline: b.h * y, size: b.h * size, font: 'serif', role, ...more };
}
function SER(b: Look, x: number, y: number, cap: number, mw: number, die: string, more: Partial<KitSerial> = {}): KitSerial {
  return { x: b.w * x, baseline: b.h * y, cap: b.h * cap, maxWidth: b.w * mw, die, ...more };
}
const box = (b: Look, x0: number, y0: number, x1: number, y1: number): KitDecal => ({ x: b.w * x0, y: b.h * y0, width: b.w * (x1 - x0), height: b.h * (y1 - y0), rx: 2 });

/** A two-digit year stacked vertically (1936–51 commercial, 1955–69 utility), from the palette's year. */
function stackedYear(b: Look, x: number, y1: number, y2: number, cap: number, die: string): KitText[] {
  return [T(b, '{y1}', x, y1, cap, die, 'year-decade'), T(b, '{y2}', x, y2, cap, die, 'year-unit')];
}
/** A single character stacked in a column (B over C). */
const column = (b: Look, chars: string, x: number, ys: number[], cap: number, die: string, role: string): KitText[] =>
  [...chars].map((c, i) => T(b, c, x, ys[i], cap, die, `${role}-${i}`));

function recipe(id: string, label: string, b: Look, source: Source, rest: Partial<KitRecipe> & Pick<KitRecipe, 'serial' | 'legends'>): KitRecipe {
  return { id, label, width: b.w, height: b.h, radius: 6, background: b.bg, ink: b.ink, embossed: true, source, note: NOTE,
    holes: 'slots', rim: { inset: 3.5, width: 1.6 }, ...rest };
}
const lookOf = (w: number, h: number, p: KitPalette): Look => ({ w, h, bg: p.background, ink: p.ink });

interface Spec {
  id: string; label: string; family: string; era: string; period: [number, number]; recipe: KitRecipe; grammar: SerialGrammar;
  description: string; palettes?: KitPalette[]; dies?: { id: string; label?: string }[]; decals?: [number, number]; status?: PlateStatus;
}
const g = (hint: string, blocks: string[], sets?: Record<string, string>, avoid?: (s: string) => boolean): SerialGrammar =>
  ({ hint, blocks: blocks.map((pattern) => ({ pattern })), ...(sets ? { sets } : {}), ...(avoid ? { avoid } : {}) });

// ── annual layouts, 1924–1973 ───────────────────────────────────────────────
/** 1924: serial with a small -24 date at right, BRITISH COLUMBIA along the bottom (passenger 1924 geometry). */
function layout1924(id: string, label: string, b: Look, source: Source): KitRecipe {
  return recipe(id, label, b, source, {
    holeAt: { x: [0.195, 0.805], y: [0.06] }, rim: { inset: 3, width: 1.6 },
    legends: [T(b, '-24', 0.9, 0.49, 0.17, 'bc-tacey-1924', 'year', 0.14),
      T(b, 'BRITISH COLUMBIA', 0.5, 0.88, 0.13, 'bc-legend-1924', 'province', 0.9, { spread: true })],
    serial: SER(b, 0.43, 0.67, 0.54, 0.74, 'bc-tacey-1924'),
  });
}
/** 1936–1951: serial with the year stacked at the far right, BRITISH COLUMBIA below (C7-609, C28-129). */
function layoutStacked(id: string, label: string, b: Look, source: Source, die: string): KitRecipe {
  return recipe(id, label, b, source, {
    holeAt: { x: [0.21, 0.77], y: [0.06, 0.94] },
    legends: [...stackedYear(b, 0.945, 0.37, 0.61, 0.19, die),
      T(b, 'BRITISH COLUMBIA', 0.49, 0.87, 0.13, 'bc-legend-1940', 'province', 0.86, { spread: true })],
    serial: SER(b, 0.46, 0.69, 0.5, 0.84, die, { separator: { kind: 'dot' } }),
  });
}
/** 1952 totem base: 52 top right over the totem (maple leaf dropped), serial left, BRITISH COLUMBIA below (C29-419). */
function layoutTotem(id: string, label: string, b: Look, source: Source, date: boolean, extra: Partial<KitRecipe> = {}): KitRecipe {
  return recipe(id, label, b, source, {
    holeAt: { x: [0.21, 0.77], y: [0.06, 0.94] },
    art: [{ art: 'vehicles-totem', x: b.w * 0.87, y: b.h * 0.32, width: b.w * 0.1, height: b.h * 0.44, role: 'totem' }],
    legends: [...(date ? [T(b, '{yy}', 0.925, 0.27, 0.17, 'bc-early-1940', 'year', 0.1)] : []),
      T(b, 'BRITISH COLUMBIA', 0.45, 0.89, 0.13, 'bc-legend-1940', 'province', 0.8, { spread: true })],
    serial: SER(b, 0.44, 0.66, 0.46, 0.8, 'bc-early-1940', { separator: { kind: 'dot' } }),
    ...extra,
  });
}
/** 1955–63: serial, BRITISH COLUMBIA with the year after it along the bottom (C32-155). */
function layout1955(id: string, label: string, b: Look, source: Source): KitRecipe {
  return recipe(id, label, b, source, {
    legends: [T(b, 'BRITISH COLUMBIA', 0.42, 0.9, 0.13, 'bc-legend-1955', 'province', 0.74, { spread: true }),
      T(b, '{yy}', 0.905, 0.9, 0.14, 'bc-legend-1955', 'year', 0.1)],
    serial: SER(b, 0.5, 0.64, 0.52, 0.9, 'bc-oakalla-1955', { separator: { kind: 'dot' } }),
  });
}
/** 1964–73 BEAUTIFUL layouts: 1964 date bottom right; 1965–67 top right; 1968–73 split 19 … yy. */
function layoutBeautiful(id: string, label: string, b: Look, source: Source, date: '1964' | 'top' | 'split', die: string, legendDie: string, top = 'BEAUTIFUL', extra: Partial<KitRecipe> = {}): KitRecipe {
  const legends: KitText[] = [T(b, top, 0.5, 0.19, 0.12, legendDie, 'top-legend', 0.44, { spread: top === 'BEAUTIFUL' })];
  if (date === '1964') legends.push(T(b, 'BRITISH COLUMBIA', 0.43, 0.91, 0.12, legendDie, 'province', 0.72, { spread: true }), T(b, '{yy}', 0.905, 0.91, 0.13, legendDie, 'year', 0.1));
  else legends.push(T(b, 'BRITISH', 0.27, 0.91, 0.12, legendDie, 'province-left', 0.3), T(b, 'COLUMBIA', 0.73, 0.91, 0.12, legendDie, 'province-right', 0.34),
    T(b, '{yy}', 0.91, 0.19, 0.13, legendDie, 'year', 0.1));
  if (date === 'split') legends.push(T(b, '19', 0.09, 0.19, 0.13, legendDie, 'century', 0.1));
  return recipe(id, label, b, source, { legends, serial: SER(b, 0.5, 0.71, 0.48, 0.92, die, { separator: { kind: 'dot' } }), ...extra });
}
/** 1976 base: top word, corner decal boxes formed by L-shaped rules, BRITISH COLUMBIA and a small 76 below. */
function layout1976(id: string, label: string, b: Look, source: Source, top = 'BEAUTIFUL', serialCap = 0.5): KitRecipe {
  const x0 = 0.035, y0 = 0.035, bx = 0.17, by = 0.21;
  const corner = (left: boolean): KitShape[] => {
    const xs = left ? [x0, bx] : [1 - x0, 1 - bx];
    return [{ kind: 'line', x1: b.w * xs[0], y1: b.h * by, x2: b.w * xs[1], y2: b.h * by, strokeWidth: 1.3 },
      { kind: 'line', x1: b.w * xs[1], y1: b.h * by, x2: b.w * xs[1], y2: b.h * y0, strokeWidth: 1.3 }];
  };
  return recipe(id, label, b, source, {
    shapes: [...corner(true), ...corner(false)],
    legends: [T(b, top, 0.5, 0.18, 0.11, 'bc-legend-1973', 'top-legend', 0.5, { spread: top === 'BEAUTIFUL' }),
      T(b, 'BRITISH COLUMBIA', 0.47, 0.91, 0.11, 'bc-legend-1973', 'province', 0.72, { spread: true }),
      T(b, '76', 0.92, 0.93, 0.09, 'bc-legend-1973', 'base-year', 0.08)],
    serial: SER(b, 0.5, 0.75, serialCap, 0.93, 'bc-oakalla-1973', { separator: { kind: 'dot' } }),
    decal: { x: b.w * (1 - bx) + 1, y: b.h * y0 + 1, width: b.w * (bx - x0) - 2, height: b.h * (by - y0) - 2, rx: 1 },
  });
}
/** 1979 base (as the blue passenger base): top word, BRITISH [decal box] COLUMBIA along the bottom. */
function layout1979(id: string, label: string, b: Look, source: Source, top: string, extra: Partial<KitRecipe> = {}): KitRecipe {
  return recipe(id, label, b, source, {
    legends: [T(b, top, 0.5, 0.19, 0.11, 'bc-legend-acme', 'top-legend', 0.38, { spread: top === 'BEAUTIFUL' }),
      T(b, 'BRITISH', 0.165, 0.91, 0.11, 'bc-legend-acme', 'province-left', 0.24), T(b, 'COLUMBIA', 0.835, 0.91, 0.11, 'bc-legend-acme', 'province-right', 0.27)],
    serial: SER(b, 0.5, 0.67, 0.44, 0.92, 'bc-acme-1979', { separator: { kind: 'dash' } }),
    decal: box(b, 0.32, 0.71, 0.68, 0.95),
    ...extra,
  });
}
const ACME = [{ id: 'bc-acme-1979', label: 'ACME (1979 base)' }, { id: 'bc-hisigns-1982', label: 'Hi-Signs (from 1982)' }];

// ── flag base (1985–), reused from the passenger recipes ────────────────────
const FLAG = kitRecipe('flag-1985'), FLAG_DUAL = kitRecipe('flag-2013');
const FLAG_INK = FLAG.ink, FLAG_BG = FLAG.background, FLAG_LEGEND = FLAG.fontLegends?.[0]?.color ?? FLAG.ink;
function flagClass(id: string, label: string, source: Source, dual: boolean, extra: Partial<KitRecipe> = {}): KitRecipe {
  return { ...(dual ? FLAG_DUAL : FLAG), id, label, source, note: FLAG_NOTE, ...extra };
}
const FLAG_DIES = [{ id: 'bc-astro-3', label: 'Astrographic · non-passenger dies' }, { id: 'bc-astro-4', label: 'Astrographic · Classic' }, { id: 'bc-waldale', label: 'Waldale' }];
const WALDALE = [{ id: 'bc-waldale', label: 'Waldale' }];
/** Flag plates whose slogan is replaced by a class word, with small serif British / Columbia either side of the well. */
function flagWorded(id: string, label: string, source: Source, word: string): KitRecipe {
  const b: Look = { w: FLAG.width, h: FLAG.height, bg: FLAG_BG, ink: FLAG_INK };
  return flagClass(id, label, source, false, {
    fontLegends: [F(b, word, 0.5, 0.26, 0.13, 'class-legend', { width: b.w * 0.62, color: FLAG_INK }),
      F(b, 'British', 0.16, 0.85, 0.1, 'province-left', { color: FLAG_INK }), F(b, 'Columbia', 0.84, 0.85, 0.1, 'province-right', { color: FLAG_INK })],
    note: `${word} replaces the slogan on this flag base. Typefaces, flag artwork and paint are approximate.`,
  });
}

/**
 * Small flag plates (motorcycle, utility trailer, motorcycle dealer). Utility
 * trailers are documented as 5 × 8 in; motorcycle sizes are not stated, so the
 * same 203 mm width is used with the ~1.55:1 photo aspect.
 */
const SMALL = { w: 203, h: 131 }, UTIL = { w: 203, h: 127 };
function smallFlag(id: string, label: string, source: Source, size: { w: number; h: number }, wells: 'single' | 'dual' | 'none', fontLegends: (b: Look) => KitFontText[], extra: Partial<KitRecipe> = {}): KitRecipe {
  const b: Look = { ...size, bg: FLAG_BG, ink: FLAG_INK };
  const flagH = b.h * 0.2, flagW = flagH * (100 / 76);
  return recipe(id, label, b, source, {
    radius: 6, rim: { inset: 3, width: 1, color: FLAG.rim?.color }, holeAt: { x: [0.2, 0.8], y: [0.075, 0.925] },
    legends: [], fontLegends: fontLegends(b),
    serial: SER(b, 0.5, 0.645, 0.37, 0.93, 'bc-astro-3', { color: FLAG_INK,
      separator: { kind: 'art', gap: 1.5, art: { art: 'bc-spirit-flag', x: 0, y: b.h * (0.645 - 0.185) - flagH / 2, width: flagW, height: flagH } } }),
    decal: wells === 'none' ? null : wells === 'single' ? box(b, 0.27, 0.705, 0.76, 0.945) : box(b, 0.45, 0.705, 0.74, 0.94),
    extraWells: wells === 'dual' ? [box(b, 0.29, 0.705, 0.42, 0.94)] : [],
    embossed: true, note: `${SMALL_NOTE} Flag-base slogan typeface and flag artwork are approximate.`, ...extra,
  });
}
const slogan = (b: Look): KitFontText => F(b, 'Beautiful British Columbia', 0.5, 0.235, 0.11, 'slogan', { width: b.w * 0.86, color: FLAG_LEGEND });

// ── commercial trucks ───────────────────────────────────────────────────────
const C1936: KitPalette[] = [
  pal(1936, '#42574f', '#c2b8a0', 'cream on green'), pal(1937, '#ccbd8c', '#383836', 'black on cream'),
  pal(1938, '#56393b', '#cfb393', 'cream on maroon'), pal(1939, '#d2ae47', '#2f251f', 'black on yellow'),
  pal(1940, '#2e2a2e', '#d0b65f', 'yellow on black'), pal(1941, '#edeeeb', '#0f2650', 'dark blue on white'),
  pal(1942, '#372a2b', '#ac8d77', 'cream on dark brown'), pal(1943, '#be976b', '#241b1a', 'black on tan'),
  pal(1944, '#171617', '#c7b48c', 'cream on black'), pal(1945, '#e4dcd4', '#a72b2d', 'red on white'),
  pal(1946, '#973437', '#d2bfb0', 'white on red'), pal(1947, '#d6c6b0', '#305937', 'green on white'),
  pal(1948, '#17451f', '#c8c5b8', 'white on dark green'),
];
const C1949: KitPalette[] = [pal(1949, '#d0a62e', '#2e2a22', 'black on yellow'), pal(1950, '#2a2b26', '#c8a544', 'yellow on black'), pal(1951, '#dcd6d0', '#0f3f6b', 'blue on white')];
const C1952: KitPalette[] = [pal(1952, '#c7c9ca', '#1f2127', 'black on aluminium'), pal(1954, '#141414', '#c2a551', 'yellow on black (steel re-issue)')];
const C1955: KitPalette[] = [
  pal(1955, '#d6a543', '#241f1a', 'black on yellow'), pal(1956, '#212529', '#c6934c', 'gold on black'), pal(1957, '#deddd9', '#092058', 'dark blue on white'),
  pal(1959, '#511a20', '#34e4e1', 'turquoise on maroon'), pal(1960, '#23cfc6', '#190708', 'black on turquoise'), pal(1961, '#e8d2db', '#5b2c34', 'maroon on pink'),
  pal(1962, '#613147', '#f0ddef', 'pink on maroon'), pal(1963, '#2a82be', '#e1deda', 'white on blue'),
];
const C1958 = pal(1958, '#edcf72', '#525c30', 'green on yellow');
const C1964 = pal(1964, '#dcddda', '#216ba1', 'blue on white');
const C1965: KitPalette[] = [pal(1965, '#1d679b', '#d6e2ec', 'white on blue'), pal(1966, '#d6d8d6', '#2f6b94', 'blue on white'), pal(1967, '#e6e0e2', '#d40d0e', 'red on white')];
const C1968: KitPalette[] = [pal(1968, '#e1e0dc', '#2068b6', 'blue on white'), pal(1969, '#135ea5', '#dce8f2', 'white on blue'), pal(1970, '#deded8', '#3a6795', 'blue on white'), pal(1971, '#135ba4', '#dce3e5', 'white on blue')];
const C1972 = pal(1972, '#e3e5e6', '#cc3c33', 'red on white'), C1973 = pal(1973, '#dcdddd', '#24232e', 'black on white');
const ORANGE = { bg: '#e6e8e8', ink: '#cf501f' }, GREEN = { bg: '#e8eeee', ink: '#309077' };

const C_EARLY = '1936–39 slanted dies';
const cStd = { w: 302, h: 150 };
/** C serials up to 9-999; letter blocks used for C10-000 and up in 1936–48 (CA-57, CB-621). */
const C_LETTERS = 'ABCDEFGHJKLMNP';

const commercial: Spec[] = [
  { id: 'commercial-1924', label: 'Commercial 1924 · T', family: 'commercial', era: 'commercial-annual', period: [1924, 1924],
    recipe: layout1924('commercial-1924', 'Commercial truck 1924', { w: 343, h: 149, bg: '#2e3242', ink: '#b59c62' }, SRC.c1924),
    grammar: g('T1 to T8500', ['T[1-9]', 'T[1-9]9', 'T[1-9]99', 'T[1-7]999', 'T8[0-4]99', 'T8500']), description: 'The short-lived T for Trucks, used only in 1924 (T-1 to T-7500, over-run to T-8500). Same base as the 1924 passenger plate (343 × 149 mm reused; no truck size is stated): gold on dark navy, a -24 date and BRITISH COLUMBIA below. The T is stamped as part of the serial.' },
  { id: 'commercial-1936', label: 'Commercial 1936–48 · C', family: 'commercial', era: 'commercial-annual', period: [1936, 1948],
    recipe: layoutStacked('commercial-1936', 'Commercial truck 1936–48', lookOf(290, 137, C1936[0]), SRC.c1936, 'bc-tacey-1936'),
    palettes: C1936, dies: [{ id: 'bc-tacey-1936', label: C_EARLY }, { id: 'bc-early-1940', label: '1940–48 rounded dies' }],
    grammar: g('C-999, C9-999, then letter blocks CA-999 … CP-999 beyond 9,999', ['C-[1-9]99', 'C-[1-9]9', 'C[1-9]-999', 'C{c}-[1-9]99', 'C{c}-[1-9]9'], { c: C_LETTERS }),
    description: 'A new colour pair every year (13 palettes, read from one photo each), the C prefix before a dot-separated number and the two-figure year stacked at right. Beyond 9,999 extra letters extended the prefix (1936: C-1 to CP-800). No size is stated; the 1940 passenger size (290 × 137 mm) is used. Not drawn: the long dash on letter-block plates (CA —57), the long leading bar on 1941 three-figure plates, and the 1942–43 C-999-A suffix run.' },
  { id: 'commercial-1949', label: 'Commercial 1949–51 · short', family: 'commercial', era: 'commercial-annual', period: [1949, 1951],
    recipe: layoutStacked('commercial-1949', 'Commercial truck 1949–51 short base', lookOf(287, 137, C1949[0]), SRC.c1949, 'bc-early-1940'),
    palettes: C1949, grammar: g('C9-999 (short base, up to C9-999)', ['C[1-9]-999', 'C-[1-9]99']),
    description: 'Only the C prefix remained. Numbers to C9-999 went on the documented 287 × 137 mm short base, with the year stacked at right. Annual colours 1949–51 from photos.' },
  { id: 'commercial-1949-long', label: 'Commercial 1949–51 · long', family: 'commercial', era: 'commercial-annual', period: [1949, 1951],
    recipe: layoutStacked('commercial-1949-long', 'Commercial truck 1949–51 long base', lookOf(335, 137, C1949[0]), SRC.c1949, 'bc-early-1940'),
    palettes: C1949, grammar: g('C10-000 to C65-000 (long base)', ['C[1-5]9-999', 'C6[0-4]-999']),
    description: 'Numbers C10-000 and over went on the documented 335 × 137 mm long base (1949: to C55,250; 1951: to C65,000).' },
  { id: 'commercial-1952', label: 'Commercial 1952 · totem', family: 'commercial', era: 'commercial-annual', period: [1952, 1954],
    recipe: layoutTotem('commercial-1952', 'Commercial truck 1952 totem base', lookOf(335, 137, C1952[0]), SRC.c1952, true),
    palettes: C1952, grammar: g('C1 to C90-000 (C99-999)', ['C[1-8]9-999', 'C[1-9]-999']),
    description: 'Aluminium 335 × 137 mm base with the 52 date and the thunderbird totem at right; the maple leaf of the passenger base was dropped to make room for the number. In 1954 the series was re-made in steel, yellow on black with a 54 date (second palette). Totem artwork reuses the passenger totem geometry.' },
  { id: 'commercial-1953-tab', label: 'Commercial 1953 · tab', family: 'commercial', era: 'commercial-annual', period: [1953, 1953],
    recipe: layoutTotem('commercial-1953-tab', 'Commercial truck 1952 base with 1953 tab', lookOf(335, 137, C1952[0]), SRC.c1952, true, {
      legends: [T({ w: 335, h: 137, bg: '', ink: '' }, 'BRITISH COLUMBIA', 0.45, 0.89, 0.13, 'bc-legend-1940', 'province', 0.8, { spread: true })],
      panels: [{ x: 335 * 0.855, y: 137 * 0.05, width: 335 * 0.13, height: 137 * 0.9, radius: 3, background: '#2a78a8', ink: '#e8eef2', role: 'renewal-tab',
        texts: [{ text: '53', x: 335 * 0.065, baseline: 137 * 0.24, cap: 137 * 0.15, maxWidth: 335 * 0.1, die: 'bc-early-1940', role: 'tab-year' }],
        art: [{ art: 'vehicles-totem', x: 335 * 0.015, y: 137 * 0.3, width: 335 * 0.1, height: 137 * 0.52, color: '#e8eef2' }] }] }),
    grammar: g('C1 to CA3-000 (renewals and 1953 new issues)', ['C[1-9]9-999', 'C[1-9]-999', 'C\\A[0-2]-999']),
    description: 'Both renewals and 1953 new registrations got a white-on-blue aluminium tab stamped 53 with the thunderbird, fixed over the date and totem (tabs numbered 400,001–485,000). The commercial tab was narrower than the passenger one, with no maple leaf and a notch for the A of COLUMBIA; the notch is not drawn and the tab colour is read loosely from one photo.' },
  { id: 'commercial-1955', label: 'Commercial 1955–63', family: 'commercial', era: 'commercial-annual', period: [1955, 1963],
    recipe: layout1955('commercial-1955', 'Commercial truck 1955–63', lookOf(cStd.w, cStd.h, C1955[0]), SRC.c1957),
    palettes: C1955, grammar: g('C9-999, C99-999, CA9-999 / CE / CH / CJ', ['C[1-9]-999', 'C[1-9]9-999', 'C[AEHJ][1-9]-999']),
    description: 'Documented 302 × 150 mm (12 × 6 in) base, a new colour pair each year and the year after BRITISH COLUMBIA along the bottom. 1955 plates show a gap after the C (C 6-407), and a stacked CF prefix appeared in 1960; neither is drawn. 1958 had its own centenary layout.' },
  { id: 'commercial-1958', label: 'Commercial 1958 · centenary', family: 'commercial', era: 'commercial-annual', period: [1958, 1958],
    recipe: recipe('commercial-1958', 'Commercial truck 1958 centenary', lookOf(cStd.w, cStd.h, C1958), SRC.c1957, {
      legends: [T({ ...cStd, bg: '', ink: '' }, 'BRITISH COLUMBIA', 0.5, 0.235, 0.12, 'bc-legend-1955', 'province', 0.78, { spread: true }),
        T({ ...cStd, bg: '', ink: '' }, '1858', 0.1, 0.93, 0.1, 'bc-legend-1955', 'centenary-from', 0.14),
        T({ ...cStd, bg: '', ink: '' }, 'CENTENARY', 0.5, 0.93, 0.12, 'bc-legend-1955', 'centenary', 0.5, { spread: true }),
        T({ ...cStd, bg: '', ink: '' }, '1958', 0.9, 0.93, 0.1, 'bc-legend-1955', 'centenary-to', 0.14)],
      serial: SER({ ...cStd, bg: '', ink: '' }, 0.5, 0.74, 0.46, 0.9, 'bc-oakalla-1955', { separator: { kind: 'dot' } }) }),
    grammar: g('C9-999, C99-999', ['C[1-9]-999', 'C[1-9]9-999']),
    description: 'The centenary layout: BRITISH COLUMBIA above the number and 1858 CENTENARY 1958 below, green on yellow (C5-174).' },
  { id: 'commercial-1964', label: 'Commercial 1964 · BEAUTIFUL', family: 'commercial', era: 'commercial-annual', period: [1964, 1964],
    recipe: layoutBeautiful('commercial-1964', 'Commercial truck 1964', lookOf(cStd.w, cStd.h, C1964), SRC.c1964, '1964', 'bc-oakalla-1955', 'bc-legend-1964'),
    palettes: [C1964], grammar: g('C1 to CJ6-775', ['C[1-9]9-999', 'C[1-9]-999', 'C[EJ][1-9]-999']),
    description: 'The BEAUTIFUL slogan arrives, with BRITISH COLUMBIA 64 along the bottom; blue on white. 1964 was the last year of two-letter prefixes (to CJ6-775).' },
  { id: 'commercial-1965', label: 'Commercial 1965–67', family: 'commercial', era: 'commercial-annual', period: [1965, 1967],
    recipe: layoutBeautiful('commercial-1965', 'Commercial truck 1965–67', lookOf(cStd.w, cStd.h, C1965[0]), SRC.c1964, 'top', 'bc-oakalla-1955', 'bc-legend-1964'),
    palettes: C1965, grammar: g('C999, C9-999, C99-999; J99-999 after the C series ran out', ['C[1-9]99', 'C[1-9]-999', 'C[1-9]9-999', 'J[1-9]-999', 'J[1-9]9-999']),
    description: 'BEAUTIFUL with the year at top right, BRITISH and COLUMBIA split along the bottom. From 1965 the single prefix J followed the exhausted C series. Three-figure numbers have no dot (C166).' },
  { id: 'commercial-1965-decal', label: 'Commercial 1965 · decal box', family: 'commercial', era: 'commercial-annual', period: [1965, 1965],
    recipe: layoutBeautiful('commercial-1965-decal', 'Commercial truck 1965 with sticker box', lookOf(cStd.w, cStd.h, C1965[0]), SRC.c1964, 'top', 'bc-oakalla-1955', 'bc-legend-1964', 'BEAUTIFUL', {
      shapes: [{ kind: 'rect', x: cStd.w * 0.395, y: cStd.h * 0.79, width: cStd.w * 0.14, height: cStd.h * 0.185, strokeWidth: 1.3 }] }),
    palettes: [C1965[0]], grammar: g('C9-999 (small early bloc)', ['C[1-9]-999']),
    description: 'A small bloc of plates issued early in the 1965 series with a sticker decal box in the bottom centre between BRITISH and COLUMBIA (C4-286). The box size is read from one photo; the different date type is not reproduced.' },
  { id: 'commercial-1968', label: 'Commercial 1968–71', family: 'commercial', era: 'commercial-annual', period: [1968, 1971],
    recipe: layoutBeautiful('commercial-1968', 'Commercial truck 1968–71', lookOf(cStd.w, cStd.h, C1968[0]), SRC.c1964, 'split', 'bc-oakalla-1955', 'bc-legend-1964'),
    palettes: C1968, dies: [{ id: 'bc-oakalla-1955', label: 'Oakalla 1955–69 dies' }, { id: 'bc-oakalla-1970', label: 'Oakalla 1970–72 dies' }],
    grammar: g('C9-999, C99-999, J99-999', ['C[1-9]-999', 'C[1-9]9-999', 'J[1-9]9-999']),
    description: '19 at top left, BEAUTIFUL, the year at top right; BRITISH and COLUMBIA split below. Annual colours alternate blue on white and white on blue. 1971 ran from C1 to CK37-000; the CK run is not modelled.' },
  { id: 'commercial-1972', label: 'Commercial 1972 · numeric', family: 'commercial', era: 'commercial-annual', period: [1972, 1972],
    recipe: layoutBeautiful('commercial-1972', 'Commercial truck 1972', lookOf(cStd.w, cStd.h, C1972), SRC.c1972, 'split', 'bc-oakalla-1970', 'bc-legend-1964'),
    palettes: [C1972], grammar: numericGrammar([[730001, 979000]], true),
    description: 'For the first time commercial trucks used the all-numeric block once reserved for passenger cars: 730-001 to 979-000, red on white, on the 1968 layout.' },
  { id: 'commercial-1973', label: 'Commercial 1973 base', family: 'commercial', era: 'commercial-decal', period: [1973, 1975],
    recipe: layoutBeautiful('commercial-1973', 'Commercial truck 1973 base', lookOf(cStd.w, cStd.h, C1973), SRC.c1972, 'split', 'bc-oakalla-1973', 'bc-legend-1964'),
    palettes: [C1973], grammar: numericGrammar([[500001, 764000], [30000, 39999]], true),
    description: 'Black on white 1973 base, renewed by decal in 1974 and 1975 (placed between BRITISH and COLUMBIA; there is no embossed box, so none is drawn). Serials 500-001 to 764-000, and a final over-run block 30-000 to 39-999 in 1975.' },
  { id: 'commercial-1973-no-dash', label: 'Commercial 1973 · 900,000 block', family: 'commercial', era: 'commercial-decal', period: [1975, 1975],
    recipe: layoutBeautiful('commercial-1973-no-dash', 'Commercial truck 1973 base, 900,000 block', lookOf(cStd.w, cStd.h, C1973), SRC.c1972, 'split', 'bc-oakalla-1973', 'bc-legend-1964'),
    palettes: [C1973], grammar: numericGrammar([[900001, 999999]], false),
    description: 'On the 900,000 block “the dash between the third and fourth character has disappeared” (906 711). Block limits beyond 900,000 are not documented.' },
  { id: 'commercial-1976', label: 'Commercial 1976 · 99·99·AA', family: 'commercial', era: 'commercial-decal', period: [1976, 1978],
    recipe: layout1976('commercial-1976', 'Commercial truck 1976 base', { ...cStd, ...ORANGE }, SRC.c1976), decals: [1976, 1978],
    grammar: g('99·99·AA, suffixes AA to DN (BB and BC not made)', ['99·99·\\A{s}', '99·99·B{s}', '99·99·C{s}', '99·99·D[A-HJ-N]'], { s: 'ABCDEFGHJKLMNPRSTVWXY' }, (s) => /·B[BC]$/.test(s)),
    description: 'Orange on white with the letters moved to the end and raised dots between the pairs (56·53·CA). BEAUTIFUL at top, BRITISH COLUMBIA and a small 76 below, and L-shaped rules forming renewal boxes in both top corners; the decal went top right. The series started at 00·01·CA and never passed DN. Size assumed 12 × 6 in. The serial is typed with the dots (the kit converts only one dash).' },
  { id: 'commercial-1979', label: 'Commercial 1979 · 99-99-AA', family: 'commercial', era: 'commercial-decal', period: [1979, 1986],
    recipe: layout1979('commercial-1979', 'Commercial truck 1979 base', { ...cStd, ...GREEN }, SRC.c1979, 'BEAUTIFUL'), dies: ACME, decals: [1980, 1985],
    palettes: [{ id: 'painted', label: 'Painted white base', background: GREEN.bg, ink: GREEN.ink }, { id: 'reflective', label: 'Reflectorized base (early 1980s)', background: '#c4cacb', ink: '#2a8a70' }],
    grammar: g('99-99-AA, suffixes FA to LY', ['99-99-[FGHJKL]{s}'], { s: 'ABCDEFGHJKLMNPRSTVWXY' }),
    description: 'Green on white, the passenger 1979 layout with BEAUTIFUL on top and a bottom-centre decal box. Suffixes ran from F to L. Some plates were on an experimental reflectorized base (FA-5380). Photos show both raised dots and dashes between the pairs; dashes are drawn.' },
  { id: 'commercial-flag', label: 'Commercial flag · 9999-AA', family: 'commercial', era: 'commercial-flag', period: [1985, 2009],
    recipe: flagClass('commercial-flag', 'Commercial truck flag base · 9999-AA', SRC.c1985, false), dies: FLAG_DIES, decals: [1985, 2012],
    grammar: g('9999-AA (I, O, Q, U, Z excluded)', ['9999-{s}{s}'], { s: 'ABCDEFGHJKLMNPRSTVWXY' }, (s) => /-(M[ADP]|L[V-Y])$/.test(s)),
    description: 'The ordinary flag plate with no class word; commercial trucks are identified by the numbers-first 9999-AA serial, continuing from the 1979 base at 0000-MB (1985) and cycling back to AA in 1994. MA, MD and MP were skipped; LV–LY were set aside for the Veteran base (not drawn). Astrographic made the plates until about GD, then Waldale.' },
  { id: 'commercial-flag-2008', label: 'Commercial flag 2008 · AA-9999', family: 'commercial', era: 'commercial-flag', period: [2008, 2012],
    recipe: flagClass('commercial-flag-2008', 'Commercial truck flag base · AA-9999, one well', SRC.c2008, false), dies: WALDALE, decals: [2008, 2012],
    grammar: g('AM-9999 … AR-9999 (single-well run)', ['\\A[MNPR]-9999']),
    description: 'From 2008 the serial became letters first (AA-0000 to AK were thought reserved for the Olympic base). Plates from about AL-8433 through AR have a single decal well; the others have separate day and month wells (see the two-well format).' },
  { id: 'commercial-flag-2008-dual', label: 'Commercial flag · AA-9999, two wells', family: 'commercial', era: 'commercial-flag', period: [2008, 2025],
    recipe: flagClass('commercial-flag-2008-dual', 'Commercial truck flag base · AA-9999, two wells', SRC.c2008, true), dies: WALDALE, decals: [2008, 2023],
    grammar: g('AL-0000 to AL-7324, AS-9999 … VY-9999', ['\\AL-[0-6]999', '\\A[STVWXY]-9999', '[B-HJ-NPRSTV]{s}-9999'], { s: 'ABCDEFGHJKLMNPRSTVWXY' }),
    description: 'Letters-first commercial serials with separate day and month/year wells: the first AL plates (to about AL-7324) and everything from AS on, reaching VA–VY in 2022.' },
];

// ── farm tractors (F) and farm trucks (A, G) ───────────────────────────────
/** Farm plates followed the annual colours of the year; only years marked "photographed" are checked against a farm plate. */
const assumed = (p: KitPalette, seen: readonly number[]): KitPalette => ({ ...p, label: `${p.label}${seen.includes(p.year!) ? ' (photographed)' : ' (commercial colours)'}` });
const F1955 = C1955.map((p) => (p.year === 1959 ? pal(1959, '#4a2020', '#9fe8e0', 'aqua on maroon') : p)).map((p) => assumed(p, [1959]));
const F1968 = [...C1968, C1972, C1973].map((p) => assumed(p, [1972, 1973]));
const A1955 = [pal(1961, '#e6b3bd', '#4a2028', 'maroon on pink'), ...C1955.filter((p) => p.year! >= 1962)].map((p) => assumed(p, [1961]));
const FARM_ORANGE = { bg: '#ecebe8', ink: '#d86a30' }, FARM_GREEN = { bg: '#eeeef0', ink: '#2a8a5a' };
/** 1974 base: 19 BEAUTIFUL 74 on top, decal between BRITISH and COLUMBIA (no embossed box). */
const layout1974 = (id: string, label: string, source: Source, ink: string) =>
  layoutBeautiful(id, label, { ...cStd, bg: FARM_ORANGE.bg, ink }, source, 'split', 'bc-oakalla-1973', 'bc-legend-1973');
const P1974 = (ink: string) => [pal(1974, FARM_ORANGE.bg, ink, 'orange on white')];

const farm: Spec[] = [
  { id: 'farm-tractor-1948', label: 'Farm tractor 1948 · F', family: 'farm', era: 'farm-annual', period: [1948, 1948],
    recipe: layoutStacked('farm-tractor-1948', 'Farm tractor 1948', lookOf(287, 137, pal(1948, '#1f5a3a', '#e0e0d8', '')), SRC.farm, 'bc-early-1940'),
    palettes: [pal(1948, '#1f5a3a', '#e0e0d8', 'white on green')], grammar: g('F-999, F9-999', ['F-[1-9]99', 'F-[1-9]9', 'F[1-9]-999']),
    description: 'The first F plates for farm tractors (1948), on the passenger layout of the year with the year stacked at right and no FARM legend (F-160). Size assumed from the 1947–48 passenger base (287 × 137 mm).' },
  { id: 'farm-tractor-1955', label: 'Farm tractor 1955–63', family: 'farm', era: 'farm-annual', period: [1955, 1963],
    recipe: layout1955('farm-tractor-1955', 'Farm tractor 1955–63', lookOf(cStd.w, cStd.h, F1955[0]), SRC.farm),
    palettes: F1955, grammar: g('F999, F9-999, F99-999', ['F[1-9]99', 'F[1-9]-999', 'F[1-9]9-999']),
    description: 'F plates on the 1955–63 layout. Farm plates took the annual colours of other types that year; only 1959 (aqua on maroon, F641) is photographed, the other palettes use the commercial colours of the year.' },
  { id: 'farm-tractor-1968', label: 'Farm tractor 1968–73', family: 'farm', era: 'farm-annual', period: [1968, 1973],
    recipe: layoutBeautiful('farm-tractor-1968', 'Farm tractor 1968–73', lookOf(cStd.w, cStd.h, F1968[4]), SRC.farm, 'split', 'bc-oakalla-1970', 'bc-legend-1964'),
    palettes: [F1968[4], F1968[5], ...F1968.slice(0, 4)], grammar: g('F9-999, F99-999', ['F[1-9]-999', 'F[1-9]9-999']),
    description: 'F plates on the 19 BEAUTIFUL yy layout; 1972 red on white (F10-495) and 1973 black on white (F10-480) are photographed, 1968–71 use the commercial colours of the year. F was used solely for tractors from 1961.' },
  { id: 'farm-tractor-1974', label: 'Farm tractor 1974 base', family: 'farm', era: 'farm-decal', period: [1974, 1978],
    recipe: layout1974('farm-tractor-1974', 'Farm tractor 1974 base', SRC.farm, FARM_ORANGE.ink), palettes: P1974(FARM_ORANGE.ink),
    grammar: g('F99-999', ['F[1-9]9-999']),
    description: 'Orange on white 19 BEAUTIFUL 74 base (F10-261), renewed by decal between BRITISH and COLUMBIA; there is no embossed box, so none is drawn.' },
  { id: 'farm-tractor-1976', label: 'Farm tractor 1976 base', family: 'farm', era: 'farm-decal', period: [1976, 1978],
    recipe: layout1976('farm-tractor-1976', 'Farm tractor 1976 base', { ...cStd, ...FARM_ORANGE }, SRC.farm), decals: [1976, 1978],
    grammar: g('F99-999 (a new-old-stock block F00-080 to F00-091 is known)', ['F[0-5]9-999']),
    description: 'The 1976 layout with corner renewal boxes, BEAUTIFUL on top and 76 bottom right (F00-080). Size assumed 12 × 6 in.' },
  { id: 'farm-tractor-1979', label: 'Farm tractor 1979 base', family: 'farm', era: 'farm-decal', period: [1979, 1986],
    recipe: layout1979('farm-tractor-1979', 'Farm tractor 1979 base', { ...cStd, ...FARM_GREEN }, SRC.farm, 'BEAUTIFUL'), dies: ACME, decals: [1980, 1985],
    grammar: g('F60-000 to F65-999', ['F6[0-5]-999']),
    description: 'Green on white 1979 base (F60-925). 6,000 plates were made but few were issued; the exact start number is not documented.' },
  { id: 'farm-tractor-flag', label: 'Farm tractor flag · F9-9999', family: 'farm', era: 'farm-flag', period: [1985, 2012],
    recipe: flagClass('farm-tractor-flag', 'Farm tractor flag base · one well', SRC.farm, false), dies: FLAG_DIES, decals: [1985, 2012],
    grammar: g('F6-6000 onward (F9-9999 format)', ['F6-[6-9]999', 'F[7-9]-9999']),
    description: 'The ordinary flag plate with no FARM legend; the serial continues from the 1979 base at F66-000, shown as F6[flag]6000 (F6-6373). Single decal well.' },
  { id: 'farm-tractor-flag-dual', label: 'Farm tractor flag · two wells', family: 'farm', era: 'farm-flag', period: [2013, 2025],
    recipe: flagClass('farm-tractor-flag-dual', 'Farm tractor flag base · two wells', SRC.farm, true), dies: WALDALE, decals: [2013, 2023],
    grammar: g('F7-0000 onward', ['F[7-9]-9999']),
    description: 'Later farm tractor plates with separate day and month/year wells (F7-1450, 2020); plates beyond F7-0999 use Waldale dies. When the wells changed on this series is not documented.' },
  { id: 'farm-truck-1961', label: 'Farm truck 1961–63 · A', family: 'farm', era: 'farm-annual', period: [1961, 1963],
    recipe: layout1955('farm-truck-1961', 'Farm truck 1961–63', lookOf(cStd.w, cStd.h, A1955[0]), SRC.farmTruck),
    palettes: A1955, grammar: g('A9-999, A99-999', ['\\A[1-9]-999', '\\A[1-9]9-999']),
    description: 'In 1961 farm trucks got their own A prefix, on the annual 1955–63 layout (A7-933, maroon on pink). 1962–63 use the commercial colours of the year.' },
  { id: 'farm-truck-1974', label: 'Farm truck 1974 base', family: 'farm', era: 'farm-decal', period: [1974, 1978],
    recipe: layout1974('farm-truck-1974', 'Farm truck 1974 base', SRC.farmTruck, '#e06a35'), palettes: P1974('#e06a35'),
    grammar: g('A99-999', ['\\A[1-9]9-999']),
    description: 'Orange on white 19 BEAUTIFUL 74 base (A67-086), renewed by decal between BRITISH and COLUMBIA; no embossed box.' },
  { id: 'farm-truck-1976', label: 'Farm truck 1976 base', family: 'farm', era: 'farm-decal', period: [1976, 1978],
    recipe: layout1976('farm-truck-1976', 'Farm truck 1976 base', { ...cStd, bg: FARM_ORANGE.bg, ink: '#e06a35' }, SRC.farmTruck), decals: [1976, 1978],
    grammar: g('A00-000 to A14-999', ['\\A0[0-9]-999', '\\A1[0-4]-999']),
    description: 'The 1976 corner-box layout (A00-314, with a 77 decal top right). The 1979 series began where this one ended, at A15-000. Size assumed 12 × 6 in.' },
  { id: 'farm-truck-1979', label: 'Farm truck 1979 base', family: 'farm', era: 'farm-decal', period: [1979, 1986],
    recipe: layout1979('farm-truck-1979', 'Farm truck 1979 base', { ...cStd, bg: FARM_GREEN.bg, ink: '#2a9a5a' }, SRC.farmTruck, 'BEAUTIFUL'), dies: ACME, decals: [1980, 1985],
    grammar: g('A15-000 to A74-999', ['\\A1[5-9]-999', '\\A[2-6]9-999', '\\A7[0-4]-999']),
    description: 'Green on white 1979 base (A25-411); the serial ran from A15-000 to A74-999.' },
  { id: 'farm-truck-flag', label: 'Farm truck flag · A9-9999 / G9-9999', family: 'farm', era: 'farm-flag', period: [1985, 2012],
    recipe: flagClass('farm-truck-flag', 'Farm truck flag base · one well', SRC.farmTruck, false), dies: FLAG_DIES, decals: [1985, 2012],
    grammar: g('A9-9999 (A75-000 on, then from A00-000), then G0-0000 onward', ['\\A9-9999', 'G9-9999']),
    description: 'The ordinary flag plate with no FARM legend. The A series continued from A75-000 (A8-4688), restarted at A00-000, and about 1999 gave way to G0-0000 (G1-3660). Astrographic dies to about G1-9000, then Waldale.' },
  { id: 'farm-truck-flag-dual', label: 'Farm truck flag · two wells', family: 'farm', era: 'farm-flag', period: [2013, 2025],
    recipe: flagClass('farm-truck-flag-dual', 'Farm truck flag base · two wells', SRC.farmTruck, true), dies: WALDALE, decals: [2013, 2023],
    grammar: g('G9-9999', ['G9-9999']),
    description: 'Later G plates with separate day and month/year wells (G5-9619, 2017). Where on the G series the wells changed is not documented.' },
  { id: 'farm-truck-2025', label: 'Farm truck 2025 · 99-999A', family: 'farm', era: 'farm-flag', period: [2025, 2025],
    recipe: flagClass('farm-truck-2025', 'Farm truck flag base · 2025 format', SRC.farmTruck, false, { decal: null, extraWells: [] }), dies: WALDALE,
    grammar: g('00-001A onward (shown 00[flag]452A)', ['0[0-9]-999\\A']),
    description: 'ICBC announced that G9-9999 would be followed by 00001A; the flag sits after the second figure (00-452A). Only one framed photo is known, so the absence of decal wells (as on 2025 passenger plates) is assumed.' },
];

// ── trailers ────────────────────────────────────────────────────────────────
const T1949: KitPalette[] = [pal(1949, '#d8a840', '#302820', 'black on yellow'), pal(1952, '#c8c8c8', '#202020', 'black on aluminium'),
  pal(1960, '#30c8c0', '#301818', 'maroon on turquoise'), pal(1971, '#1a70c8', '#e8f0f8', 'white on blue')];
const U1955: KitPalette[] = [pal(1955, '#e8b040', '#303030', 'black on yellow'), pal(1965, '#2a80c8', '#f0f4f8', 'white on blue')];
const TR_GREEN = { bg: '#f0f4f0', ink: '#2a9a60' };
const S_NOZ = 'ABCDEFGHJKLMNPRSTVWXY';
const trailerSmall = (w: number, h: number, p: KitPalette): Look => lookOf(w, h, p);

function trailer1949(b: Look): KitRecipe {
  return recipe('trailer-1949', 'Trailer 1949–71', b, SRC.trailer, {
    holeAt: { x: [0.2, 0.8], y: [0.075, 0.925] },
    legends: [T(b, 'TRAILER', 0.42, 0.3, 0.16, 'bc-legend-1940', 'class-legend', 0.56, { spread: true }), T(b, '{yy}', 0.86, 0.3, 0.16, 'bc-legend-1940', 'year', 0.14),
      ...column(b, 'BC', 0.085, [0.6, 0.86], 0.18, 'bc-legend-1940', 'bc')],
    serial: SER(b, 0.57, 0.84, 0.44, 0.76, 'bc-early-1940'),
  });
}
function utility1955(id: string, b: Look, stacked: boolean): KitRecipe {
  return recipe(id, stacked ? 'Utility trailer 1955–69' : 'Utility trailer 1970–73', b, SRC.utility, {
    holeAt: { x: [0.2, 0.8], y: [0.075, 0.925] },
    legends: stacked
      ? [T(b, 'B.C.UTILITY', 0.47, 0.24, 0.13, 'bc-legend-1955', 'class-legend', 0.6), ...stackedYear(b, 0.92, 0.46, 0.68, 0.15, 'bc-legend-1955'),
        T(b, 'TRAILER', 0.47, 0.91, 0.13, 'bc-legend-1955', 'trailer', 0.46, { spread: true })]
      : [T(b, 'B.C. UTILITY', 0.44, 0.24, 0.13, 'bc-legend-1964', 'class-legend', 0.6), T(b, '{yy}', 0.87, 0.24, 0.13, 'bc-legend-1964', 'year', 0.12),
        T(b, 'TRAILER', 0.5, 0.91, 0.13, 'bc-legend-1964', 'trailer', 0.46, { spread: true })],
    serial: SER(b, stacked ? 0.45 : 0.5, 0.7, 0.37, stacked ? 0.76 : 0.86, stacked ? 'bc-oakalla-1955' : 'bc-oakalla-1970'),
  });
}
/** Small 1974 / 1979 bases shared by motorcycles and utility trailers: B.C. at top left, class word along the bottom. */
function small1974(id: string, label: string, b: Look, source: Source, bottom: string, date: string, extra: Partial<KitRecipe> = {}): KitRecipe {
  return recipe(id, label, b, source, {
    holeAt: { x: [0.13, 0.87], y: [0.075, 0.925] },
    legends: [T(b, 'B.C.', 0.14, 0.26, 0.12, 'bc-legend-1973', 'bc'), ...(date ? [T(b, date, 0.86, 0.26, 0.12, 'bc-legend-1973', 'year')] : []),
      T(b, bottom, 0.5, 0.91, 0.12, 'bc-legend-1973', 'class-legend', bottom === 'TRAILER' ? 0.46 : 0.66, { spread: true })],
    serial: SER(b, 0.5, 0.7, 0.36, 0.9, 'bc-oakalla-1973', { separator: { kind: 'dot' } }),
    ...extra,
  });
}
const small1979 = (id: string, label: string, b: Look, source: Source, bottom: string, extra: Partial<KitRecipe> = {}) =>
  small1974(id, label, b, source, bottom, '', { decal: box(b, 0.25, 0.045, 0.73, 0.28), serial: SER(b, 0.5, 0.72, 0.36, 0.9, 'bc-acme-1979'), ...extra });

const floaterLook: Look = { ...cStd, bg: '#f4f4f4', ink: '#202020' };
const trailers: Spec[] = [
  { id: 'trailer-1921', label: 'Trailer 1921–26', family: 'trailer', era: 'trailer-early', period: [1921, 1926],
    recipe: recipe('trailer-1921', 'Trailer 1921–26', { w: 180, h: 104, bg: '#e0b52c', ink: '#3a3a20' }, SRC.trailer, {
      holeAt: { x: [0.25, 0.8], y: [0.07] },
      art: [{ art: 'bc-monogram', x: 180 * 0.03, y: 104 * 0.1, width: 180 * 0.24, height: 104 * 0.5, color: '#3a3a20' }],
      legends: [T({ w: 180, h: 104, bg: '', ink: '' }, '1921', 0.15, 0.93, 0.17, 'bc-block-1918', 'year', 0.24)],
      serial: SER({ w: 180, h: 104, bg: '', ink: '' }, 0.64, 0.86, 0.66, 0.62, 'bc-block-1918') }),
    palettes: [pal(1921, '#e0b52c', '#3a3a20', 'green on yellow')], grammar: numericGrammar([[1, 1000]], false),
    description: 'Motorcycle-style trailer plates without a prefix: the interlaced BC monogram above the year at left (1921: green on yellow, a reverse of the passenger colours). No size is stated; the documented 1927 size (180 × 104 mm, approximate) is used. Later years to 1926 are not photographed; the year legend is fixed at 1921.' },
  { id: 'trailer-1927', label: 'Trailer 1927–35 · T', family: 'trailer', era: 'trailer-early', period: [1927, 1935],
    recipe: recipe('trailer-1927', 'Trailer 1927–35', { w: 180, h: 104, bg: '#d26a36', ink: '#3a2a22' }, SRC.trailer, {
      holeAt: { x: [0.25, 0.8], y: [0.07, 0.93] },
      legends: [T({ w: 180, h: 104, bg: '', ink: '' }, 'BC', 0.15, 0.52, 0.36, 'bc-legend-1924', 'bc', 0.23),
        T({ w: 180, h: 104, bg: '', ink: '' }, '{yyyy}', 0.17, 0.9, 0.15, 'bc-legend-1924', 'year', 0.26)],
      serial: SER({ w: 180, h: 104, bg: '', ink: '' }, 0.66, 0.82, 0.62, 0.58, 'bc-tacey-1924') }),
    palettes: [pal(1927, '#d26a36', '#3a2a22', 'dark on orange (read from a rusted plate)')],
    grammar: g('T999, T9999', ['T[1-9]', 'T[1-9]9', 'T[1-9]99', 'T[1-9]999']),
    description: 'From 1927 a T prefix was added; BC in large letters above the year at left, 180 × 104 mm (approximate, documented). On the plate the T is smaller than the figures; here it is stamped at serial size. Only the 1927 plate is photographed and it is badly rusted, so its colours are rough.' },
  { id: 'trailer-1936', label: 'Trailer 1936–48 · T', family: 'trailer', era: 'trailer-early', period: [1936, 1948],
    recipe: recipe('trailer-1936', 'Trailer 1936–48', { w: 205, h: 104, bg: '#2a2020', ink: '#d0b060' }, SRC.trailer, {
      holeAt: { x: [0.25, 0.75], y: [0.07, 0.93] },
      legends: [T({ w: 205, h: 104, bg: '', ink: '' }, 'BC', 0.14, 0.55, 0.38, 'bc-legend-1940', 'bc', 0.21),
        T({ w: 205, h: 104, bg: '', ink: '' }, '{yyyy}', 0.15, 0.9, 0.16, 'bc-legend-1940', 'year', 0.24)],
      serial: SER({ w: 205, h: 104, bg: '', ink: '' }, 0.64, 0.82, 0.62, 0.62, 'bc-early-1940') }),
    palettes: [pal(1940, '#2a2020', '#d0b060', 'yellow on black')],
    grammar: g('T999, T9999; TR999 in 1948', ['T[1-9]', 'T[1-9]9', 'T[1-9]99', 'T[1-9]999', 'TR[1-9]99']),
    description: 'The longer 205 × 104 mm (approximate, documented) trailer plate: BC above the year at left, then the T serial (T772, 1940). A small run of TR plates was issued in 1948. The T is drawn at serial size although it is smaller on the plate.' },
  { id: 'trailer-1949', label: 'Trailer 1949–71 · TRAILER', family: 'trailer', era: 'trailer-annual', period: [1949, 1971],
    recipe: trailer1949(trailerSmall(205, 130, T1949[0])), palettes: T1949, grammar: numericGrammar([[1, 99999]], false),
    description: 'The full word TRAILER across the top with the year, and B over C at left; numbers without prefix. 205 × 130 mm (approximate, documented). Aluminium in 1952. Commercial trailers kept this plate to 1971; palettes are the photographed years (1949, 1952, 1960, 1971).' },
  { id: 'trailer-comm-1972', label: 'Commercial trailer 1972 · COMM-TLR-', family: 'trailer', era: 'trailer-decal', period: [1972, 1972],
    recipe: layoutBeautiful('trailer-comm-1972', 'Commercial trailer 1972', { ...cStd, bg: '#f4f8f4', ink: '#d83030' }, SRC.trailer, 'top', 'bc-oakalla-1970', 'bc-legend-1964', 'COMM-TLR-'),
    palettes: [pal(1972, '#f4f8f4', '#d83030', 'red on white')], grammar: g('999-999', ['[1-9]99-999']),
    description: 'Commercial trailers moved to the standard 12 × 6 in plate in 1972, red on white like the other types that year, with COMM-TLR- and 72 across the top (the page text says COMM-TRL-, but the plates read COMM-TLR-).' },
  { id: 'trailer-comm-1973', label: 'Commercial trailer 1973 base', family: 'trailer', era: 'trailer-decal', period: [1973, 1975],
    recipe: layoutBeautiful('trailer-comm-1973', 'Commercial trailer 1973 base', { ...cStd, bg: '#ecece8', ink: '#202020' }, SRC.trailer, 'top', 'bc-oakalla-1973', 'bc-legend-1964', 'COMM-TLR-'),
    palettes: [pal(1973, '#ecece8', '#202020', 'black on white')], grammar: numericGrammar([[1000, 999999]], false),
    description: 'Black on white 1973 base with COMM-TLR- 73 (183486, no separator), renewed by decal: lower left in 1974 and lower centre in 1975. No embossed decal box, so none is drawn.' },
  { id: 'trailer-comm-1976', label: 'Commercial trailer 1976 · 999·99A', family: 'trailer', era: 'trailer-decal', period: [1976, 1978],
    recipe: layout1976('trailer-comm-1976', 'Commercial trailer 1976 base', { ...cStd, bg: '#f0f0f0', ink: '#e06a30' }, SRC.trailer, 'COMM-TLR-'), decals: [1976, 1978],
    grammar: g('999-99A (single-letter suffix, first used in 1976)', ['999-99{s}'], { s: S_NOZ }),
    description: 'Orange on white 1976 layout with COMM-TLR- on top and renewal boxes in both top corners (013-99V; the upper right box was used from 1978). Size assumed 12 × 6 in.' },
  { id: 'trailer-comm-1979', label: 'Commercial trailer 1979 · COMM. TLR.', family: 'trailer', era: 'trailer-decal', period: [1979, 1986],
    recipe: layout1979('trailer-comm-1979', 'Commercial trailer 1979 base', { ...cStd, ...TR_GREEN }, SRC.trailer, 'COMM. TLR.'), dies: ACME, decals: [1980, 1985],
    grammar: g('999-99A from the W suffix', ['999-99[WXY]']),
    description: 'Green on white 1979 base reading COMM. TLR. on top, with the standard bottom-centre decal box; the series restarted at the W suffix (290-76W).' },
  { id: 'trailer-comm-flag', label: 'Commercial trailer flag · 9999-9A', family: 'trailer', era: 'trailer-flag', period: [1985, 2012],
    recipe: flagClass('trailer-comm-flag', 'Commercial trailer flag base · one well', SRC.trailer, false), dies: FLAG_DIES, decals: [1985, 2012],
    grammar: g('9999-9A (Z excluded; U went to the Olympic base)', ['9999-9{s}'], { s: S_NOZ }),
    description: 'The ordinary flag plate: “the first time since 1949 that the plate did not display the word Trailer”. Serial 9999[flag]9A (6400-7Y). From about 2004 commercial trailers carried a non-expiring decal (not drawn as a format).' },
  { id: 'trailer-comm-flag-dual', label: 'Commercial trailer flag · two wells', family: 'trailer', era: 'trailer-flag', period: [2013, 2025],
    recipe: flagClass('trailer-comm-flag-dual', 'Commercial trailer flag base · two wells', SRC.trailer, true), dies: WALDALE, decals: [2013, 2023],
    grammar: g('9999-9A', ['9999-9{s}'], { s: S_NOZ }),
    description: 'Later commercial trailer plates with separate day and month/year wells (0071-5J, 2018, carrying the NON-EXP decal).' },
  { id: 'trailer-utility-1955', label: 'Utility trailer 1955–69', family: 'trailer', era: 'trailer-annual', period: [1955, 1969],
    recipe: utility1955('trailer-utility-1955', trailerSmall(UTIL.w, UTIL.h, U1955[0]), true), palettes: U1955, grammar: numericGrammar([[1, 99999]], false),
    description: 'B.C. UTILITY above the number, TRAILER below and the year stacked at right; 5 × 8 in, the documented standard trailer size. Numbers without prefix (1967: 20,001–99,000). Palettes are the photographed years.' },
  { id: 'trailer-utility-1970', label: 'Utility trailer 1970–73', family: 'trailer', era: 'trailer-annual', period: [1970, 1973],
    recipe: utility1955('trailer-utility-1970', trailerSmall(UTIL.w, UTIL.h, pal(1970, '#eeeeee', '#2a60b0', '')), false),
    palettes: [pal(1970, '#eeeeee', '#2a60b0', 'blue on white')], grammar: numericGrammar([[1, 99999]], false),
    description: 'From 1970 the date moved to the top right corner (B.C. UTILITY 70 / 99896 / TRAILER). 5 × 8 in.' },
  { id: 'trailer-utility-1974', label: 'Utility trailer 1974 base', family: 'trailer', era: 'trailer-decal', period: [1974, 1978],
    recipe: small1974('trailer-utility-1974', 'Utility trailer 1974 base', { ...UTIL, bg: '#f2f2f2', ink: '#e8742a' }, SRC.utility, 'TRAILER', '74'),
    grammar: { ...numericGrammar([[100000, 999999]], false), blocks: [{ pattern: '[BC]99-999' }], hint: '999999, later B99-999 and C99-999' },
    description: 'UTILITY was dropped and the plate took the orange-on-white scheme: B.C. and 74 at top, TRAILER below (230354; later C01-800 with a dot). Decals went top centre, with no box. 5 × 8 in.' },
  { id: 'trailer-utility-1979', label: 'Utility trailer 1979 base', family: 'trailer', era: 'trailer-decal', period: [1979, 1986],
    recipe: small1979('trailer-utility-1979', 'Utility trailer 1979 base', { ...UTIL, bg: '#f4f4f4', ink: '#2a9a60' }, SRC.utility, 'TRAILER'), dies: ACME, decals: [1980, 1985],
    grammar: g('999-999', ['[1-9]99-999']),
    description: 'Green on white: B.C. at top left, a decal box at top right and TRAILER below (566-474). 5 × 8 in.' },
  { id: 'trailer-utility-flag', label: 'Utility trailer flag · 999-999', family: 'trailer', era: 'trailer-flag', period: [1985, 2000],
    recipe: smallFlag('trailer-utility-flag', 'Utility trailer flag base', SRC.utility, UTIL, 'single', (b) => [slogan(b)]), dies: FLAG_DIES, decals: [1985, 2000],
    grammar: g('999-999', ['999-999']),
    description: 'Small (5 × 8 in) flag plate with the slogan and the flag between two groups of three figures (354-650), one bottom-centre decal well.' },
  { id: 'trailer-utility-flag-2000', label: 'Utility trailer flag · AAA-99A', family: 'trailer', era: 'trailer-flag', period: [2000, 2016],
    recipe: smallFlag('trailer-utility-flag-2000', 'Utility trailer flag base · AAA-99A', SRC.utility, UTIL, 'dual', (b) => [slogan(b)]), dies: WALDALE, decals: [2000, 2016],
    grammar: g('UAA-00A onward', ['U{s}{s}-99{s}'], { s: S_NOZ }, (s) => s.startsWith('UYM')),
    description: 'About 2000 ICBC introduced letters in an AAA-00A format starting at UAA-00A (UES-03W, with day and month wells). UYM went to the Olympic base (not drawn).' },
  { id: 'trailer-utility-2016', label: 'Utility trailer · TRAILER, WAA-00A', family: 'trailer', era: 'trailer-flag', period: [2016, 2025],
    recipe: smallFlag('trailer-utility-2016', 'Utility trailer flag base · TRAILER', SRC.utility, UTIL, 'dual', (b) => [
      F(b, 'TRAILER', 0.5, 0.215, 0.11, 'class-legend', { color: FLAG_INK, width: b.w * 0.36 }),
      F(b, 'British', 0.14, 0.8, 0.075, 'province-left', { color: FLAG_INK }), F(b, 'Columbia', 0.86, 0.8, 0.075, 'province-right', { color: FLAG_INK })]),
    dies: WALDALE, decals: [2016, 2023], grammar: g('WAA-00A onward', ['W{s}{s}-99{s}'], { s: S_NOZ }),
    description: 'The WAA-00A series (about 2016) dropped the slogan for TRAILER along the top, with small British and Columbia either side of the two decal wells (WDL-87A). 5 × 8 in.' },
  { id: 'trailer-floater-1974', label: 'Trailer floater 1974 base', family: 'trailer', era: 'trailer-decal', period: [1974, 1978],
    recipe: recipe('trailer-floater-1974', 'Trailer floater 1974 base', floaterLook, SRC.floater, {
      legends: [T(floaterLook, 'TRAILER', 0.5, 0.22, 0.12, 'bc-legend-1973', 'class-legend', 0.42, { spread: true }), ...column(floaterLook, 'BC', 0.075, [0.5, 0.76], 0.17, 'bc-legend-1973', 'bc'),
        T(floaterLook, 'FLOATER', 0.47, 0.935, 0.11, 'bc-legend-1973', 'floater', 0.4, { spread: true }), T(floaterLook, '74', 0.9, 0.935, 0.1, 'bc-legend-1973', 'base-year')],
      serial: SER(floaterLook, 0.55, 0.77, 0.52, 0.82, 'bc-oakalla-1973') }),
    grammar: numericGrammar([[50001, 55000]], false),
    description: 'TRAILER over the number, FLOATER and 74 below, B over C at left; black on white (50451). 1975 issue: 50-001 to 55-000. Size assumed 12 × 6 in from the photo proportions.' },
  { id: 'trailer-floater-1979', label: 'Trailer floater 1979 base', family: 'trailer', era: 'trailer-decal', period: [1979, 1982],
    recipe: layout1979('trailer-floater-1979', 'Trailer floater 1979 base', { ...cStd, bg: '#f0f0f0', ink: '#d03040' }, SRC.floater, 'TRLR.FLOATER', {
      serial: SER({ ...cStd, bg: '', ink: '' }, 0.5, 0.67, 0.44, 0.92, 'bc-acme-1979', { separator: { kind: 'dot' } }) }), dies: ACME, decals: [1980, 1982],
    grammar: numericGrammar([[55001, 99999]], true),
    description: 'Red on white 1979 layout with TRLR.FLOATER on top (66-358). The number range is not documented.' },
  { id: 'trailer-floater-1983', label: 'Trailer floater 1983 base', family: 'trailer', era: 'trailer-decal', period: [1983, 1986],
    recipe: layout1979('trailer-floater-1983', 'Trailer floater 1983 base', { ...cStd, bg: '#f4f4f4', ink: '#202020' }, SRC.floater, 'TRLR.FLOATER', {
      legends: [T({ ...cStd, bg: '', ink: '' }, '83', 0.1, 0.17, 0.1, 'bc-legend-hisigns', 'base-year'), T({ ...cStd, bg: '', ink: '' }, 'TRLR.FLOATER', 0.5, 0.17, 0.1, 'bc-legend-hisigns', 'top-legend', 0.46),
        T({ ...cStd, bg: '', ink: '' }, 'BRITISH', 0.16, 0.91, 0.11, 'bc-legend-hisigns', 'province-left', 0.26), T({ ...cStd, bg: '', ink: '' }, 'COLUMBIA', 0.84, 0.91, 0.11, 'bc-legend-hisigns', 'province-right', 0.26)],
      serial: SER({ ...cStd, bg: '', ink: '' }, 0.46, 0.67, 0.44, 0.84, 'bc-hisigns-1982') }), decals: [1983, 1985],
    grammar: numericGrammar([[55001, 99999]], true),
    description: 'Black on white with 83 at top left and TRLR.FLOATER (76-039). This base is inferred from a single photo; the number range is not documented.' },
  { id: 'trailer-floater-flag', label: 'Trailer floater flag · TF-9999', family: 'trailer', era: 'trailer-flag', period: [1985, 2025],
    recipe: flagWorded('trailer-floater-flag', 'Trailer floater flag base', SRC.floater, 'TRAILER FLOATER'), dies: FLAG_DIES, decals: [1985, 2012],
    grammar: g('TF-0000 to TF-9999 (1985), then TG, TH and LF', ['T[FGH]-9999', 'LF-9999']),
    description: 'One of the few flag plates with a class word: TRAILER FLOATER in serif capitals replaces the slogan, with British and Columbia flanking the decal well (TF-1011, LF-0964).' },
];

// ── motorcycles and motorcycle dealers ─────────────────────────────────────
const M1949: KitPalette[] = [pal(1949, '#dba20f', '#3a2c14', 'black on yellow'), pal(1958, '#c4a256', '#2f5a37', 'green on gold'),
  pal(1965, '#0f5a98', '#e0e8f0', 'white on blue'), pal(1971, '#1060b0', '#e8eef4', 'white on blue')];
const mcSmall = (p: KitPalette): Look => lookOf(SMALL.w, SMALL.h, p);
function motorcycle1949(id: string, label: string, b: Look, source: Source): KitRecipe {
  return recipe(id, label, b, source, {
    holeAt: { x: [0.2, 0.8], y: [0.075, 0.925] },
    legends: [T(b, 'MOTORCYCLE', 0.43, 0.31, 0.16, 'bc-legend-1955', 'class-legend', 0.76), T(b, '{yy}', 0.89, 0.31, 0.16, 'bc-legend-1955', 'year', 0.13),
      ...column(b, 'BC', 0.08, [0.59, 0.86], 0.17, 'bc-legend-1955', 'bc')],
    serial: SER(b, 0.57, 0.84, 0.42, 0.76, 'bc-oakalla-1955'),
  });
}
function motorcycle1973(id: string, label: string, b: Look, source: Source): KitRecipe {
  return recipe(id, label, b, source, {
    holeAt: { x: [0.2, 0.8], y: [0.075, 0.925] },
    legends: [T(b, 'B.C.-73', 0.5, 0.25, 0.13, 'bc-legend-1964', 'bc-year', 0.4, { spacing: 12 }), T(b, 'MOTORCYCLE', 0.5, 0.9, 0.13, 'bc-legend-1964', 'class-legend', 0.7)],
    serial: SER(b, 0.5, 0.67, 0.36, 0.9, 'bc-oakalla-1973'),
  });
}
const MC_ORANGE = { bg: '#e9eaf2', ink: '#be582c' }, MC_BLUE = { bg: '#034696', ink: '#e0e8f4' };
const mcFlagLegends = (b: Look) => [slogan(b), F(b, 'M.C.', 0.13, 0.84, 0.1, 'class-legend', { color: FLAG_INK })];

const motorcycles: Spec[] = [
  { id: 'motorcycle-1949', label: 'Motorcycle 1949–72', family: 'motorcycle', era: 'motorcycle-annual', period: [1949, 1972],
    recipe: motorcycle1949('motorcycle-1949', 'Motorcycle 1949–72', mcSmall(M1949[0]), SRC.mc), palettes: M1949, grammar: numericGrammar([[1, 9999]], false),
    description: 'MOTORCYCLE and the year across the top, B over C at left, and a number without prefix (1949–51: 1 to 5-000). Annual colours; palettes are the photographed years. The page gives no size (“XX mm × XX mm”): 203 mm wide at the ~1.55:1 photo aspect is assumed.' },
  { id: 'motorcycle-1973', label: 'Motorcycle 1973', family: 'motorcycle', era: 'motorcycle-annual', period: [1973, 1973],
    recipe: motorcycle1973('motorcycle-1973', 'Motorcycle 1973', { ...SMALL, bg: '#eef1f4', ink: '#303747' }, SRC.mc), grammar: numericGrammar([[100001, 140000]], false),
    description: 'B.C.-73 over a six-figure number (100-001 to 140-000, shown without a separator: 127000) and MOTORCYCLE below; black on white. Size estimated as for 1949–72.' },
  { id: 'motorcycle-1974', label: 'Motorcycle 1974 base', family: 'motorcycle', era: 'motorcycle-decal', period: [1974, 1978],
    recipe: small1974('motorcycle-1974', 'Motorcycle 1974 base', { ...SMALL, ...MC_ORANGE }, SRC.mc, 'MOTORCYCLE', '74'),
    grammar: { ...numericGrammar([[100001, 147300]], false), blocks: [{ pattern: 'N[0-5]9-999' }], hint: '100001–147300 (1974), then N00-001 to N60-000 (1976–78)' },
    description: 'Orange on white: B.C. and 74 at top, MOTORCYCLE below. Six-figure numbers without separator in 1974–75, then an N prefix with a raised dot from 1976 (N28-405). Decals went top centre, with no box. Size estimated.' },
  { id: 'motorcycle-1974-prototype', label: 'Motorcycle 1974 · blue prototype', family: 'motorcycle', era: 'motorcycle-decal', period: [1976, 1976], status: 'prototype',
    recipe: small1974('motorcycle-1974-prototype', 'Motorcycle 1974 base, blue prototype', { ...SMALL, bg: '#e4e6ea', ink: '#1f3f8f' }, SRC.mc, 'MOTORCYCLE', '74', {
      serial: SER({ ...SMALL, bg: '', ink: '' }, 0.5, 0.7, 0.36, 0.9, 'bc-oakalla-1973', { separator: { kind: 'gap' } }) }),
    grammar: g('N30 000 (the known prototype)', ['N30-000']),
    description: 'A known prototype, N30 000 in blue on white, thought to show a possible colour combination for the 1974 base; never issued.' },
  { id: 'motorcycle-1979', label: 'Motorcycle 1979 base', family: 'motorcycle', era: 'motorcycle-decal', period: [1978, 1986],
    recipe: small1979('motorcycle-1979', 'Motorcycle 1979 base', { ...SMALL, ...MC_BLUE }, SRC.mc, 'MOTORCYCLE', { rim: { inset: 3, width: 1.4 } }), dies: ACME, decals: [1980, 1985],
    palettes: [{ id: '1979', label: '1979 · white on blue', background: MC_BLUE.bg, ink: MC_BLUE.ink }, { id: '1978-overrun', label: '1978 over-run · orange on white (1974 colours)', background: MC_ORANGE.bg, ink: MC_ORANGE.ink }],
    grammar: g('M99-999, L, K, J prefixes; N6x-xxx 1978 over-run', ['[MLKJ]99-999', 'N6[0-9]-999']),
    description: 'White on blue: B.C. at top left, a decal box across the top and MOTORCYCLE below (M29-909, J13-985). The 1978 over-run was issued on this new layout but in the 1974 colours (second palette). Size estimated.' },
  { id: 'motorcycle-flag', label: 'Motorcycle flag · A9-9999, M.C.', family: 'motorcycle', era: 'motorcycle-flag', period: [1985, 2011],
    recipe: smallFlag('motorcycle-flag', 'Motorcycle flag base', SRC.mc, SMALL, 'single', mcFlagLegends), dies: FLAG_DIES, decals: [1985, 2011],
    grammar: g('A9-9999: J, H, N, C, M, E (Astrographic), then K, L, S (Waldale)', ['[JHNCMEKLS]9-9999']),
    description: 'Small flag plate with the slogan, M.C. at bottom left and a letter-figure-flag-four figures serial (H3-5176). Waldale took over in the E series. Veteran (V0–V1) and Olympic (V2 on) bases are not drawn. Size estimated (203 mm at the photo aspect).' },
  { id: 'motorcycle-2011', label: 'Motorcycle 2011 · BC Mark', family: 'motorcycle', era: 'motorcycle-flag', period: [2011, 2025],
    recipe: smallFlag('motorcycle-2011', 'Motorcycle 2011 base', SRC.mc, SMALL, 'dual', mcFlagLegends, {
      serial: SER({ ...SMALL, bg: '', ink: '' }, 0.5, 0.655, 0.44, 0.94, 'bc-waldale', { color: FLAG_INK }),
      art: [{ art: 'vehicles-bc-mark', x: SMALL.w * 0.76, y: SMALL.h * 0.69, width: SMALL.w * 0.18, height: SMALL.h * 0.2, role: 'bc-mark' }],
      decal: box({ ...SMALL, bg: '', ink: '' }, 0.42, 0.705, 0.72, 0.94), extraWells: [box({ ...SMALL, bg: '', ink: '' }, 0.26, 0.705, 0.39, 0.94)] }),
    dies: WALDALE, decals: [2011, 2023],
    grammar: g('S59000–S99999 (2011); 0000A1–9999A9 (2023)', ['S[5-9]9999', '9999\\A[1-9]']),
    description: 'In 2011 the characters grew by 3/8, the flag was dropped and the BC Mark moved to the bottom right corner, with two decal wells (S61545). From 2023 serials read 9999A9 (0050A5). The BC Mark is a simplified drawing.' },
  { id: 'motorcycle-dealer-1968', label: 'Motorcycle dealer 1964–72', family: 'motorcycle', era: 'motorcycle-annual', period: [1964, 1972],
    recipe: motorcycle1949('motorcycle-dealer-1968', 'Motorcycle dealer 1964–72', mcSmall(pal(1968, '#e8ecef', '#2a64b0', '')), SRC.mcDealer),
    palettes: [pal(1968, '#e8ecef', '#2a64b0', 'blue on white')], grammar: g('D1 to D999 (1964: D1–D200)', ['D[1-9]', 'D[1-9]9', 'D[1-9]99']),
    description: 'Dealer plates on the motorcycle base with a D prefix (D138, 1968). Only 1968 is photographed. Size estimated as for motorcycles.' },
  { id: 'motorcycle-dealer-1973', label: 'Motorcycle dealer 1973', family: 'motorcycle', era: 'motorcycle-annual', period: [1973, 1973],
    recipe: motorcycle1973('motorcycle-dealer-1973', 'Motorcycle dealer 1973', { ...SMALL, bg: '#eef0f0', ink: '#202020' }, SRC.mcDealer),
    grammar: g('D999', ['D[1-9]', 'D[1-9]9', 'D[1-9]99']),
    description: 'The 1973 motorcycle layout with a D serial (D278). Size estimated.' },
  { id: 'motorcycle-dealer-1976', label: 'Motorcycle dealer 1976', family: 'motorcycle', era: 'motorcycle-decal', period: [1976, 1978],
    recipe: small1974('motorcycle-dealer-1976', 'Motorcycle dealer 1976', { ...SMALL, bg: '#e6eaee', ink: '#b04c52' }, SRC.mcDealer, 'MOTORCYCLE', '76', {
      serial: SER({ ...SMALL, bg: '', ink: '' }, 0.5, 0.7, 0.36, 0.9, 'bc-oakalla-1973') }),
    grammar: g('D999, D9999', ['D[1-9]99', 'D[1-9]999']),
    description: 'Red on white, B.C. and 76 at top, MOTORCYCLE below (D1144). Size estimated.' },
  { id: 'motorcycle-dealer-1979', label: 'Motorcycle dealer 1979 · M.C./TRLR.', family: 'motorcycle', era: 'motorcycle-decal', period: [1979, 1986],
    recipe: small1979('motorcycle-dealer-1979', 'Motorcycle dealer 1979', { ...SMALL, bg: '#e6e6ea', ink: '#8f4642' }, SRC.mcDealer, '', {
      legends: [T({ ...SMALL, bg: '', ink: '' }, 'B.C.', 0.14, 0.26, 0.12, 'bc-legend-acme', 'bc'),
        T({ ...SMALL, bg: '', ink: '' }, 'M.C.', 0.46, 0.9, 0.12, 'bc-legend-acme', 'class-legend-left', undefined, { anchor: 'end' }),
        T({ ...SMALL, bg: '', ink: '' }, 'TRLR.', 0.54, 0.9, 0.12, 'bc-legend-acme', 'class-legend-right', undefined, { anchor: 'start' })],
      fontLegends: [F({ ...SMALL, bg: '', ink: '' }, '/', 0.5, 0.9, 0.17, 'class-legend-slash', { font: 'sans', weight: 600 })],
      serial: SER({ ...SMALL, bg: '', ink: '' }, 0.5, 0.72, 0.36, 0.9, 'bc-acme-1979', { separator: { kind: 'dot' } }) }), dies: ACME, decals: [1980, 1985],
    grammar: g('D9-999', ['D[1-9]-999']),
    description: 'Red on white 1979 base for motorcycle (and trailer) dealers: B.C. at top left, a top decal box, and M.C./TRLR. along the bottom (D5-305). The slash is not a die character, so it is set in a typeface. Size estimated.' },
  { id: 'motorcycle-dealer-flag', label: 'Motorcycle dealer flag · DM-9999', family: 'motorcycle', era: 'motorcycle-flag', period: [1985, 2025],
    recipe: smallFlag('motorcycle-dealer-flag', 'Motorcycle dealer flag base', SRC.mcDealer, SMALL, 'single', (b) => [slogan(b),
      F(b, 'MC', 0.13, 0.84, 0.1, 'class-legend-left', { color: FLAG_INK }), F(b, 'TRLR', 0.87, 0.84, 0.1, 'class-legend-right', { color: FLAG_INK })],
      { decal: box({ ...SMALL, bg: '', ink: '' }, 0.26, 0.705, 0.74, 0.945) }), dies: FLAG_DIES, decals: [1985, 2012],
    grammar: g('DM-0000 onward (1985: DM-0000 to DM-2119)', ['DM-[0-3]999']),
    description: 'Small flag plate with MC at bottom left and TRLR at bottom right (DM0325; later plates read M.C.). Size estimated.' },
];

// ── families, eras, formats ─────────────────────────────────────────────────
export const BC_VEHICLE_FAMILIES: PlateFamily[] = [
  { id: 'commercial', label: 'Commercial truck', summary: 'Commercial truck plates: T in 1924, C from 1936, numeric and suffix series in the 1970s, then the ordinary flag plate with truck serial formats from 1985.' },
  { id: 'farm', label: 'Farm tractor & farm truck', summary: 'F plates for farm tractors from 1948 and A (later G) plates for farm trucks from 1961; no FARM legend on any base.' },
  { id: 'trailer', label: 'Trailers', summary: 'Trailer, commercial trailer (COMM-TLR-), utility trailer and trailer floater plates, 1921 onward.' },
  { id: 'motorcycle', label: 'Motorcycle', summary: 'Small-format motorcycle plates and motorcycle dealer plates, 1949 onward.' },
];
export const BC_VEHICLE_ERAS: PlateEra[] = [
  { id: 'commercial-annual', family: 'commercial', label: 'Annual plates', period: [1924, 1972], summary: 'A new plate each year, following the annual colours.' },
  { id: 'commercial-decal', family: 'commercial', label: 'Decal bases', period: [1973, 1986], summary: '1973, 1976 and 1979 bases renewed with decals.' },
  { id: 'commercial-flag', family: 'commercial', label: 'Flag base', period: [1985, 2025], summary: 'The ordinary flag plate; 9999-AA, then AA-9999 from 2008.' },
  { id: 'farm-annual', family: 'farm', label: 'Annual plates', period: [1948, 1973], summary: 'F (tractor) and A (truck) prefixes on the annual layouts.' },
  { id: 'farm-decal', family: 'farm', label: 'Decal bases', period: [1974, 1986], summary: 'Orange 1974 and 1976 bases, green 1979 base.' },
  { id: 'farm-flag', family: 'farm', label: 'Flag base', period: [1985, 2025], summary: 'Flag plates with F9-9999, A9-9999, G9-9999 and 99-999A serials.' },
  { id: 'trailer-early', family: 'trailer', label: 'Early trailer plates', period: [1921, 1948], summary: 'Small plates with BC and the year at left; T prefix from 1927.' },
  { id: 'trailer-annual', family: 'trailer', label: 'TRAILER annuals', period: [1949, 1973], summary: 'TRAILER and B.C. UTILITY annual plates.' },
  { id: 'trailer-decal', family: 'trailer', label: 'Decal bases', period: [1972, 1986], summary: 'COMM-TLR-, utility and floater bases of the 1970s and 1979.' },
  { id: 'trailer-flag', family: 'trailer', label: 'Flag base', period: [1985, 2025], summary: 'Flag plates: commercial 9999-9A, small utility plates, TRAILER FLOATER.' },
  { id: 'motorcycle-annual', family: 'motorcycle', label: 'Annual plates', period: [1949, 1973], summary: 'MOTORCYCLE annuals with B over C at left, and the 1973 B.C.-73 plate.' },
  { id: 'motorcycle-decal', family: 'motorcycle', label: 'Decal bases', period: [1974, 1986], summary: 'Orange 1974 and blue 1979 bases.' },
  { id: 'motorcycle-flag', family: 'motorcycle', label: 'Flag base', period: [1985, 2025], summary: 'Small flag plates with M.C.; BC Mark redesign in 2011.' },
];

export const BC_VEHICLE_FORMATS: PlateFormat[] = [...commercial, ...farm, ...trailers, ...motorcycles].map((s) => kitFormat({
  id: s.id, label: s.label, family: s.family, era: s.era, period: s.period, recipe: s.recipe, grammar: s.grammar, description: s.description,
  ...(s.palettes ? { palettes: s.palettes } : {}), ...(s.dies ? { dies: s.dies } : {}), ...(s.decals ? { decals: s.decals } : {}), ...(s.status ? { status: s.status } : {}),
}));
