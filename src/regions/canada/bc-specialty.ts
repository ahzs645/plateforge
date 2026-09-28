/**
 * B.C. specialty and optional plates (BC Parks, 2010 Olympics, Veteran,
 * Memorial Cross, Collector, Antique, Personalized) and consular plates.
 * Facts come from the BCpl8s chapters for each program; colours are read from
 * photographs, artwork is drawn in src/templates/bc/art-specialty.ts.
 * No specialty page states plate sizes: full-size plates use the documented
 * 300 × 150 mm passenger size of the period, and small plates the documented
 * B.C. 5 × 8 in (203 × 127 mm) small-plate size, which matches the ~1.6:1
 * aspect of the motorcycle and utility-trailer photos.
 */
import '../../templates/bc/art-specialty';
import type { PlateEra, PlateFamily, PlateFormat } from '../../core/types';
import type { KitArt, KitDecal, KitFontText, KitRecipe, KitSerial, KitText } from '../../templates/bc/kit';
import { PERSONALIZED_BRITISH, PERSONALIZED_COLUMBIA, PERSONALIZED_DOGWOOD, PERSONALIZED_FRAME } from '../../templates/bc/personalized-art';
import { registerDieProfile } from '../../templates/dies/profiles';
import { BC_AK, BC_LX, kitFormat, numericGrammar, type SerialGrammar } from './bc-kit';

const page = (file: string, title: string) => ({ title: `BCpl8s · ${title}`, url: `https://www.bcpl8s.ca/${file}` });
const SRC = {
  parks: page('BCParks.html', 'BC Parks'), olympic: page('Olympics.htm', '2010 Olympic plates'), veteran: page('Veteran.html', 'Veteran'),
  memorial: page('MemorialCross.html', 'Memorial Cross'), collector: page('Collector.htm', 'Collector'), antique: page('Antique.htm', 'Antique'),
  personalized: page('Personalized.htm', 'Personalized'), consular: page('Consular.htm', 'Consular'), motorcycle: page('Motorcycle.htm', 'Motorcycle'),
  utility: page('Trailer-Utility.htm', 'Utility trailer (5 × 8 in plate size)'),
};

interface Size { w: number; h: number }
const FULL: Size = { w: 300, h: 150 };
const SMALL: Size = { w: 203, h: 127 };
const FULL_SIZE = 'Size is not stated on the page; the documented 300 × 150 mm passenger size is used.';
const SMALL_SIZE = 'Size is not stated on the page; the documented B.C. 5 × 8 in (203 × 127 mm) small-plate size is used, which matches the ~1.6:1 photo aspect.';
const ART_NOTE = 'Photo-printed artwork is redrawn as flat vector shapes; legend typefaces are serif/sans stand-ins; die shapes, paint and positions are approximate (read from BCpl8s photos). Validation checks the documented block pattern, not a real registration.';
const WHITE_EDGE = { inset: 1.6, width: 1.1, color: '#f6f6f2' };
const FLAG_HOLES = { x: [0.21, 0.79], y: [0.113, 0.88] };
const SMALL_HOLES = { x: [0.18, 0.82], y: [0.08, 0.92] };
const sets = { s: BC_AK + BC_LX, k: BC_AK };

/** Waldale's narrower "Mississippi" dies named on the Memorial Cross page. */
registerDieProfile({
  id: 'bc-mississippi', label: 'Waldale “Mississippi” dies', maker: 'Waldale',
  params: { width: 45, stroke: 10.5, curve: 'stadium', tracking: 7, one: 'flag-base', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.55, wide: 1.12 },
  evidence: { status: 'category', specimens: [SRC.memorial], notes: 'BCpl8s says the Memorial Cross base uses the Waldale "Mississippi" dies. Proportions are matched by eye from MC000R; MC000R, MC1000 and MC127R show straight-sided O, 0, C and R bowls, a flagged 1 with a base and a near-straight 7.' },
});

function plate(id: string, label: string, size: Size, source: KitRecipe['source'], note: string,
  rest: Partial<KitRecipe> & Pick<KitRecipe, 'serial' | 'background' | 'ink'>): KitRecipe {
  return { id, label, width: size.w, height: size.h, radius: size === FULL ? 7 : 6, legends: [], embossed: true, holes: 'slots',
    holeAt: size === FULL ? FLAG_HOLES : SMALL_HOLES, rim: WHITE_EDGE, source, note: `${note} ${size === FULL ? FULL_SIZE : SMALL_SIZE}`, ...rest };
}
const serif = (text: string, x: number, baseline: number, size: number, color: string, role: string, extra: Partial<KitFontText> = {}): KitFontText =>
  ({ text, x, baseline, size, font: 'serif', color, role, ...extra });
const die = (text: string, x: number, baseline: number, cap: number, dieId: string, role: string, extra: Partial<KitText> = {}): KitText =>
  ({ text, x, baseline, cap, die: dieId, role, ...extra });
const well = (x: number, y: number, width: number, height: number): KitDecal => ({ x, y, width, height, rx: 1.5 });
/** Day well at left, month/year well at right (the kit takes the month well as `decal`). */
const dual = (day: KitDecal, month: KitDecal) => ({ decal: month, extraWells: [day] });
const blocks = (...patterns: string[]) => patterns.map((pattern) => ({ pattern }));

/** Zero-padded three-figure numbers in documented ranges (consular 1979–86: 002–100, 601–999). */
function paddedGrammar(ranges: readonly (readonly [number, number])[]): SerialGrammar {
  const show = (v: number) => String(v).padStart(3, '0');
  return { blocks: [], hint: ranges.map(([a, b]) => `${show(a)}–${show(b)}`).join(', '),
    custom: { generate: (rng) => { const [a, b] = rng.pick(ranges); return show(rng.int(a, b)); },
      test: (s) => /^\d{3}$/.test(s) && ranges.some(([a, b]) => Number(s) >= a && Number(s) <= b) } };
}

// ── BC Parks (2017–): three photo designs with a continuous serial shifted right ──
const PARKS_NOTE = `BC Parks reconstruction: the backgrounds are supplied stand-in photographs of each scene, not the official plate image files. ${ART_NOTE}`;
const PARKS_WELLS = dual(well(114, 119, 24, 24), well(141, 119, 48, 24));
function parksRecipe(id: string, label: string, background: string, art: KitArt[], top = 'Beautiful British Columbia', left = 'Discover'): KitRecipe {
  return plate(id, label, FULL, SRC.parks, PARKS_NOTE, {
    background, ink: '#111111', art,
    fontLegends: [serif(top, 148, 37, 19.5, '#1a1a14', 'slogan', { width: top.length > 20 ? 226 : undefined }),
      serif(left, 54, 124, 15, '#1a1a14', 'legend-left'), serif('BC Parks', 244, 124, 15, '#1a1a14', 'legend-right')],
    serial: { x: 170, baseline: 110, cap: 66, maxWidth: 224, die: 'bc-waldale', color: '#111111' },
    ...PARKS_WELLS,
  });
}
/** The Kermode photo; `zoom` enlarges it about the bottom-left corner (the prototype's larger bear), clipped by the plate. */
const kermodeArt = (zoom = 1): KitArt[] => [{ art: 'bc-parks-kermode', x: 0, y: 150 * (1 - zoom), width: 300 * zoom, height: 150 * zoom, role: 'kermode-bear' }];
const PARKS_DESCRIPTION = 'Continuous six-character serials (no separator), standard passenger dies, “Beautiful British Columbia” above and “Discover … BC Parks” below, with the day and month/year decals between them.';

const parks: PlateFormat[] = [
  kitFormat({
    id: 'parks-kermode', label: 'BC Parks · Kermode bear', family: 'specialty', period: [2017, 2026], era: 'specialty-parks',
    recipe: parksRecipe('parks-kermode', 'BC Parks · Kermode bear', '#8fb040', kermodeArt()),
    grammar: { sets, hint: 'PA9-99X … PJ9-99X (2017–23), RK–RN blocks (2024–25), shown without a dash', blocks: blocks('P[A-HJ]999{s}', 'R[KLMN]999{s}') },
    decals: [2017, 2023],
    description: `The Kermode (spirit) bear “Molly” in a meadow. ${PARKS_DESCRIPTION} Blocks PA (January 2017) to PJ (2023), then RK, RL, RM and RN.`,
  }),
  kitFormat({
    id: 'parks-purcell', label: 'BC Parks · Purcell Mountains', family: 'specialty', period: [2017, 2026], era: 'specialty-parks',
    recipe: parksRecipe('parks-purcell', 'BC Parks · Purcell Mountains', '#dea486', [{ art: 'bc-parks-purcell', x: 0, y: 0, width: 300, height: 150 }]),
    grammar: { sets, hint: 'PK–PV and RP–RX blocks (AA999A), then R99-9AA from July 2026 (R000AA–R999AX), shown without a dash',
      blocks: blocks('P[KLMNPRSTV]999{s}', 'R[PRSTVWX]999{s}', 'R999\\A{s}') },
    decals: [2017, 2023],
    description: `Snow-capped Purcell Mountains under a pink sunset sky (sky colour varies between photos). ${PARKS_DESCRIPTION} Blocks PK (2017) to PV, RP to RX (2023–25), and the third allotment R00-0AA to R99-9AX (July 2026).`,
  }),
  kitFormat({
    id: 'parks-porteau', label: 'BC Parks · Porteau Cove', family: 'specialty', period: [2017, 2026], era: 'specialty-parks',
    recipe: parksRecipe('parks-porteau', 'BC Parks · Porteau Cove', '#c1a683', [{ art: 'bc-parks-porteau', x: 0, y: 0, width: 300, height: 150 }]),
    grammar: { sets, hint: 'PW, PX and RA–RJ blocks (AA999A), then S99-9AA from June 2025 (S000AA–S999AX), shown without a dash',
      blocks: blocks('P[WX]999{s}', 'R[A-HJ]999{s}', 'S999\\A{s}') },
    decals: [2017, 2023],
    description: `Porteau Cove at sunset (Gregory Simpson’s 2008 photograph). ${PARKS_DESCRIPTION} Blocks PW (2017; PW0-00M went to BC Parks’ own fleet), PX, RA to RJ, and the third allotment S00-0AA to S99-9AX (June 2025, e.g. S266AA).`,
  }),
  kitFormat({
    id: 'parks-prototype', label: 'BC Parks · 2016 prototype', family: 'specialty', period: [2016, 2016], era: 'specialty-parks', status: 'prototype',
    recipe: parksRecipe('parks-prototype', 'BC Parks · 2016 prototype', '#8fb040', kermodeArt(1.2), 'British Columbia', 'Explore'),
    grammar: { hint: '000000 (the prototype’s serial)', blocks: blocks('000000') },
    description: 'Prototype dated 25 August 2016: “British Columbia” alone at the top (no “Beautiful”), “Explore” instead of “Discover”, and a larger bear. Serial 000000. The bear enlargement is estimated from the photo.',
  }),
];

// ── 2010 Olympic Winter Games (2007–10): Mount Garibaldi, emblem separator ──
const OLY_NOTE = `2010 Olympic base: the Mount Garibaldi background is a supplied stand-in photograph (not the official plate image); the Vancouver 2010 emblem is redrawn as flat artwork; the gold slogan and legends use a serif stand-in. ${ART_NOTE}`;
const GOLD = '#c8841c';
/** The Olympic plates' dark drop shadow, scaled with the lettering. */
const shade = (size: number) => ({ dx: size * 0.045, dy: size * 0.05, color: '#2b2116' });
function olympicRecipe(id: string, label: string, size: Size): KitRecipe {
  const full = size === FULL;
  const s = full
    ? { logo: { x: 20, y: 8, width: 38, height: 23 }, slogan: [155, 31, 17, 150], legend: [57, 247, 133, 14], serial: [150, 105, 60, 282], emblem: [30, 44, 3],
      wells: dual(well(99, 117, 30, 25), well(134, 117, 64, 25)) }
    : { logo: { x: 9, y: 8, width: 27, height: 16 }, slogan: [110, 25, 13, 118], legend: [30, 172, 114, 9.5], serial: [101.5, 84, 46, 186], emblem: [24, 35, 2.5],
      wells: dual(well(61, 92, 24, 25), well(90, 92, 56, 25)) };
  const [sx, sb, scap, smax] = s.serial, [ew, eh, gap] = s.emblem;
  const serial: KitSerial = { x: sx, baseline: sb, cap: scap, maxWidth: smax, die: 'bc-waldale', color: '#1a1a1a',
    separator: { kind: 'art', gap, art: { art: 'bc-olympic-emblem', x: 0, y: sb - scap / 2 - eh / 2, width: ew, height: eh } } };
  return plate(id, label, size, SRC.olympic, OLY_NOTE, {
    background: '#53a7d5', ink: '#1a1a1a', holeAt: full ? { x: [0.22, 0.78], y: [0.06, 0.95] } : { x: [0.17, 0.83], y: [0.06, 0.94] },
    art: [{ art: full ? 'bc-olympic-garibaldi' : 'bc-olympic-garibaldi-small', x: 0, y: 0, width: size.w, height: size.h }, { art: 'bc-logo', ...s.logo, role: 'bc-logo' }],
    // Gold lettering with a hard dark drop shadow; BRITISH / COLUMBIA are small capitals (photos of 005 MAA, 480 MAE, 011 MJB).
    // Sizes from 480 MAE: slogan capitals ~9.7 mm over ~143 mm, BRITISH / COLUMBIA capitals ~9.6 mm.
    fontLegends: [serif('The Best Place on Earth', s.slogan[0], s.slogan[1], s.slogan[2] * 0.78, GOLD, 'slogan', { width: s.slogan[3], weight: 700, shadow: shade(s.slogan[2] * 0.78) }),
      serif('British', s.legend[0], s.legend[2], s.legend[3], GOLD, 'legend-left', { weight: 700, smallCaps: true, shadow: shade(s.legend[3]) }),
      serif('Columbia', s.legend[1], s.legend[2], s.legend[3], GOLD, 'legend-right', { weight: 700, smallCaps: true, shadow: shade(s.legend[3]) })],
    serial, ...s.wells,
  });
}
const OLY_DESC = 'Sold 16 April 2007 to 31 December 2010 (about 196,305 sets; renewals to 2012). Mount Garibaldi background, “The Best Place on Earth” in gold with the new B.C. logo at top left, and the Vancouver 2010 emblem between the serial halves; two debossed decal wells (day left, month/year right).';
interface OlympicSpec { id: string; label: string; size: Size; grammar: Omit<SerialGrammar, 'sets'>; text: string }
const OLYMPIC: OlympicSpec[] = [
  { id: 'olympic-passenger', label: 'Olympic · passenger', size: FULL, grammar: { hint: '999-MAA onward (alphabetical MAA…MAX, MBA…; last seen MJF)', blocks: blocks('999-M[A-HJ]{s}') },
    text: 'Passenger series from 000-MAA (kept by ICBC for promotion; first issued 001-MAA), about 154,515 sets.' },
  { id: 'olympic-truck', label: 'Olympic · commercial truck', size: FULL, grammar: { hint: 'AA-0000 to AK-9999', blocks: blocks('\\A{k}-9999') },
    text: 'Commercial truck (pick-ups, motor homes) series AA-0000 to AK-9999, about 35,931 sets; the emblem follows the two-letter prefix.' },
  { id: 'olympic-farm', label: 'Olympic · farm truck', size: FULL, grammar: { hint: 'G9-0000 onward (about 86 sets; generator stays below G9-0200)', blocks: blocks('G\\9-0[01]99') },
    text: 'Farm truck series from G9-0000; only about 86 sets were sold. No FARM legend is visible in the (small) photos.' },
  { id: 'olympic-trailer', label: 'Olympic · commercial trailer', size: FULL, grammar: { hint: '0000-0U onward (about 227 sets; generator stays below 0050-0U)', blocks: blocks('00[0-4]9-9U') },
    text: 'Commercial trailer series from 0000-0U (e.g. 0034 [emblem] 3U), about 227 sets.' },
  { id: 'olympic-motorcycle', label: 'Olympic · motorcycle', size: SMALL, grammar: { hint: 'V2-0000 to V2-9999', blocks: blocks('V2-9999') },
    text: 'Motorcycle series V2-0000 (a block of 10,000 thought reserved), about 4,989 sets; very large serial with the emblem after V2.' },
  { id: 'olympic-utility', label: 'Olympic · utility trailer', size: SMALL, grammar: { hint: 'UYM-00A onward', blocks: blocks('UYM-99{s}') },
    text: 'Utility trailer series from UYM-00A, thought the rarest Olympic type (the page gives both 227 and 557 as the count). Small 5 × 8 in trailer plate.' },
];
const olympic: PlateFormat[] = OLYMPIC.map((o) => kitFormat({
  id: o.id, label: o.label, family: 'specialty', period: [2007, 2010], era: 'specialty-olympic',
  recipe: olympicRecipe(o.id, o.label, o.size), grammar: { sets, ...o.grammar }, decals: [2007, 2012],
  description: `${o.text} ${OLY_DESC}`, ...(o.size === SMALL ? { references: [SRC.motorcycle, SRC.utility] } : {}),
}));

// ── Veteran (2004–): powder blue, war memorial and poppy, continuous serial ──
const VET_NOTE = `Veteran reconstruction: the National War Memorial background is a supplied stand-in photograph (not the official plate image), with a supplied poppy over it. ${ART_NOTE}`;
function veteranRecipe(id: string, label: string, wells: 'single' | 'dual'): KitRecipe {
  return plate(id, label, FULL, SRC.veteran, VET_NOTE, {
    background: '#8ec8d8', ink: '#0a0f0f',
    art: [{ art: 'bc-veteran-memorial', x: 0, y: 0, width: 300, height: 150 }, { art: 'bc-poppy', x: 29, y: 68, width: 38, height: 36, role: 'poppy' },
      { art: 'canada-flag', x: 252, y: 18, width: 30, height: 15, role: 'canada-flag' }],
    fontLegends: [serif('VETERAN', 157, 33, 20, '#0a0f0f', 'legend-top', { width: 93 }), serif('British', 70, 127, 17, '#0a0f0f', 'legend-left'), serif('Columbia', 248, 127, 17, '#0a0f0f', 'legend-right')],
    serial: { x: 174, baseline: 109, cap: 60, maxWidth: 226, die: 'bc-waldale', color: '#0a0f0f' },
    ...(wells === 'dual' ? dual(well(99, 112, 42, 29), well(144, 112, 60, 29)) : { decal: well(99, 112, 105, 29) }),
  });
}
const VET_DESC = 'Powder blue base restricted to veterans: a partial image of the National War Memorial in Ottawa at left with a red poppy, VETERAN at the top, the Canadian flag at top right, and a black continuous serial shifted right.';
const veteran: PlateFormat[] = [
  kitFormat({
    id: 'veteran-passenger', label: 'Veteran · passenger (single well)', family: 'specialty', period: [2004, 2014], era: 'specialty-veteran',
    recipe: veteranRecipe('veteran-passenger', 'Veteran · passenger · single well', 'single'),
    grammar: { sets, hint: '999VAA onward (000-VAA … 999-VAX, then VBA), shown without a dash', blocks: blocks('999V\\A{s}', '999VB{s}') }, decals: [2004, 2014],
    description: `${VET_DESC} Serials from 001-VAA (June 2004; 000-VAA kept as a de facto sample). The original plates have a single decal box; the year of the change to the divided box (c. 2014) is not stated.`,
  }),
  kitFormat({
    id: 'veteran-passenger-dual', label: 'Veteran · passenger (divided well)', family: 'specialty', period: [2014, 2026], era: 'specialty-veteran',
    recipe: veteranRecipe('veteran-passenger-dual', 'Veteran · passenger · divided well', 'dual'),
    grammar: { sets, hint: '999VBA onward (132-VCA by May 2018), shown without a dash', blocks: blocks('999VB{s}', '[01]99VC\\A') }, decals: [2014, 2023],
    description: `${VET_DESC} Later plates (and the Waldale 000AAA specimen) have a divided day / month-year decal box. Serials had reached 132-VCA by May 2018.`,
  }),
  kitFormat({
    id: 'veteran-truck', label: 'Veteran · commercial truck', family: 'specialty', period: [2004, 2026], era: 'specialty-veteran',
    recipe: veteranRecipe('veteran-truck', 'Veteran · commercial truck', 'single'),
    grammar: { hint: '9999LV (from June 2004) and 9999LT (from June 2017), shown without a dash', blocks: blocks('9999L[VT]') }, decals: [2004, 2023],
    description: `${VET_DESC} Pick-up trucks and motor homes: 0000-LV from June 2004 and 0000-LT from June 2017 (LX and LW were announced but not confirmed). Drawn with the single decal box of the 2004 photo.`,
  }),
  kitFormat({
    id: 'veteran-motorcycle', label: 'Veteran · motorcycle', family: 'specialty', period: [2004, 2026], era: 'specialty-veteran',
    recipe: plate('veteran-motorcycle', 'Veteran · motorcycle', SMALL, SRC.veteran, VET_NOTE, {
      background: '#8ec8d8', ink: '#0a0f0f',
      art: [{ art: 'bc-veteran-memorial-small', x: 0, y: 0, width: 203, height: 127 }, { art: 'bc-poppy', x: 11, y: 64, width: 29, height: 27, role: 'poppy' },
        { art: 'canada-flag', x: 158, y: 18, width: 24, height: 12, role: 'canada-flag' }],
      fontLegends: [serif('VETERAN', 95, 26, 16, '#0a0f0f', 'legend-top', { width: 72 }), serif('British', 176, 101, 9.5, '#0a0f0f', 'legend-1'), serif('Columbia', 176, 112, 9.5, '#0a0f0f', 'legend-2')],
      serial: { x: 118, baseline: 81, cap: 42, maxWidth: 150, die: 'bc-waldale', color: '#0a0f0f' },
      decal: well(45, 91, 107, 29),
    }),
    grammar: { hint: 'V00000 to V19999 (V0-0000 to V1-9999 thought reserved), shown without a dash', blocks: blocks('V[01]9999') }, decals: [2004, 2023],
    references: [SRC.motorcycle],
    description: 'Motorcycle version: the same memorial, poppy and flag compressed onto the small plate, with British / Columbia stacked at bottom right and one wide decal box. V00000 is held by ICBC; the highest seen by June 2010 was V0-2263.',
  }),
];

// ── Memorial Cross (2016–): purple on reflective white ──
const MC_NOTE = `Memorial Cross reconstruction: the silver cross is a supplied generated image (not the official artwork); layout and colours follow the bc-memorial-cross-plate study of the MC000R sample; the “Mississippi” die is matched by eye. ${ART_NOTE}`;
const MC_TEXT = '#402b59', MC_SERIAL = '#654d80';
/** Positions are the study's 822 × 398 screenshot coordinates scaled to 300 × 150 mm (estimates, not measured dies). */
function memorialRecipe(id: string, label: string): KitRecipe {
  return plate(id, label, FULL, SRC.memorial, MC_NOTE, {
    background: '#ececee', ink: MC_SERIAL, rim: { inset: 1.6, width: 1, color: '#c9c9cc' }, holeAt: { x: [0.2, 0.8], y: [0.085, 0.92] },
    art: [{ art: 'bc-memorial-cross', x: 6, y: 39.8, width: 67.2, height: 70.1, role: 'memorial-cross' }, { art: 'canada-flag', x: 259.5, y: 14.9, width: 29.6, height: 15.3, role: 'canada-flag' }],
    fontLegends: [serif('Memorial Cross Recipient', 149.3, 30.2, 15, MC_TEXT, 'legend-top', { width: 186, weight: 700, italic: true }),
      serif('British', 46.7, 131.5, 20, MC_TEXT, 'legend-left', { width: 48 }), serif('Columbia', 252, 131.5, 20, MC_TEXT, 'legend-right', { width: 72 })],
    serial: { x: 182.3, baseline: 107.2, cap: 66.5, maxWidth: 206, die: 'bc-mississippi', color: MC_SERIAL },
    ...dual(well(94, 117, 37, 30), well(137.2, 117, 68.3, 30)),
  });
}
const MC_DESC = 'Free plates for Memorial Cross recipients: purple letters on reflective white, the Memorial Cross at left and the Canadian flag at top right, Waldale “Mississippi” dies, two decal wells.';
const memorial: PlateFormat[] = [
  kitFormat({
    id: 'memorial-passenger', label: 'Memorial Cross · passenger', family: 'specialty', period: [2016, 2026], era: 'specialty-veteran',
    recipe: memorialRecipe('memorial-passenger', 'Memorial Cross · passenger'),
    grammar: { hint: 'MC0-01R onward (MC001R–MC019R issued by April 2017), shown without a dash', blocks: blocks('MC999R') }, decals: [2016, 2023],
    description: `${MC_DESC} Passenger series from MC0-01R; MC000R is the sample.`,
  }),
  kitFormat({
    id: 'memorial-truck', label: 'Memorial Cross · commercial truck', family: 'specialty', period: [2016, 2026], era: 'specialty-veteran',
    recipe: memorialRecipe('memorial-truck', 'Memorial Cross · commercial truck'),
    grammar: { hint: 'MC-1000 onward (MC1001–MC1009 issued by April 2017), shown without a dash', blocks: blocks('MC1999') }, decals: [2016, 2023],
    description: `${MC_DESC} Commercial truck series from MC-1000.`,
  }),
  kitFormat({
    id: 'memorial-keepsake', label: 'Memorial Cross · keepsake', family: 'specialty', period: [2016, 2026], era: 'specialty-veteran', status: 'uncertain',
    recipe: memorialRecipe('memorial-keepsake', 'Memorial Cross · keepsake (assumed sample)'),
    grammar: { hint: 'MC000R (assumed)', blocks: blocks('MC000R') },
    description: `${MC_DESC} Eligible people without a vehicle can ask for a “Keepsake” plate; BCpl8s only assumes it looks like the MC000R sample, so this is shown as uncertain.`,
  }),
];

// ── Collector (1990–): black on white, ornamental serif legends, wavy separator ──
const COL_NOTE = `Collector reconstruction: the ornamental legends use a serif stand-in and the wavy separator is drawn as artwork. ${ART_NOTE}`;
const COL_INK = '#111111';
function collectorFull(id: string, label: string, multi: boolean, wells: 'single' | 'dual', dieId: string): KitRecipe {
  return plate(id, label, FULL, SRC.collector, COL_NOTE, {
    background: '#e3deda', ink: COL_INK, rim: { inset: 1.6, width: 1, color: '#c4c0bc' },
    fontLegends: [serif('Collector', 150, 27, 18, COL_INK, 'legend-top'), serif('British', 48, 128, 16, COL_INK, 'legend-left'), serif('Columbia', 249, 128, 16, COL_INK, 'legend-right'),
      ...(multi ? [serif('MULTI-VEHICLE', 150, 38, 6.5, COL_INK, 'legend-multi', { weight: 700, width: 62 })] : [])],
    serial: { x: 150, baseline: 111, cap: 66, maxWidth: 266, die: dieId, color: COL_INK,
      separator: { kind: 'art', gap: 4, art: { art: 'bc-collector-tilde', x: 0, y: 74, width: 16, height: 7 } } },
    ...(wells === 'dual' ? dual(well(99, 113, 36, 30), well(137, 113, 70, 30)) : { decal: well(100, 113, 104, 30) }),
  });
}
function collectorSmall(id: string, label: string, multi: boolean): KitRecipe {
  return plate(id, label, SMALL, SRC.collector, COL_NOTE, {
    background: '#e8e8e4', ink: COL_INK, rim: { inset: 1.4, width: 0.9, color: '#c4c4c0' },
    fontLegends: [serif('Collector', 101.5, 26, 16, COL_INK, 'legend-top'), serif('British', 30, 110, 9, COL_INK, 'legend-left'), serif('Columbia', 172, 110, 9, COL_INK, 'legend-right'),
      ...(multi ? [serif('MULTI-VEHICLE', 101.5, 34, 4.5, COL_INK, 'legend-multi', { weight: 700, width: 42 })] : [])],
    serial: { x: 101.5, baseline: 86, cap: 48, maxWidth: 185, die: 'bc-astro-4', color: COL_INK },
    decal: well(71, 91, 75, 27),
  });
}
const COL_DIES = [{ id: 'bc-astro-4', label: 'Astrographic (1990 to the mid-B54 bloc)' }, { id: 'bc-waldale', label: 'Waldale (from the mid-B54 bloc)' }];
const COL_DESC = 'Permanent plates for vehicles at least 25 years old: “Collector” above the serial and British … Columbia below, in an ornamental serif.';
const collector: PlateFormat[] = [
  kitFormat({
    id: 'collector-passenger', label: 'Collector · passenger (single well)', family: 'specialty', period: [1990, 2013], era: 'specialty-collector',
    recipe: collectorFull('collector-passenger', 'Collector · passenger · single well', false, 'single', 'bc-astro-4'),
    grammar: { hint: 'B00-001 to B09-999 (1990–94), B40–B59 (1994–2007), B10–B27 (2007–c.2013)', blocks: blocks('B0[0-9]-999', 'B[1245]9-999') },
    dies: COL_DIES, decals: [1990, 2013],
    description: `${COL_DESC} Full-size serials carry a wavy tilde-like separator (B00~195). Astrographic dies until the mid-B54 bloc, Waldale after; one decal box until the dual wells appeared between B27-469 and B27-489.`,
  }),
  kitFormat({
    id: 'collector-passenger-dual', label: 'Collector · passenger (two wells)', family: 'specialty', period: [2013, 2026], era: 'specialty-collector',
    recipe: collectorFull('collector-passenger-dual', 'Collector · passenger · two wells', false, 'dual', 'bc-waldale'),
    grammar: { sets, hint: 'B27-489 to B29-999, B30–B39 (2014), then 0A0-000 … 9A9-999 (c.2018, e.g. 0M1~138)', blocks: blocks('B2[7-9]-999', 'B39-999', '9{s}9-999') },
    decals: [2013, 2023],
    description: `${COL_DESC} Waldale dies and two decal wells (from between B27-469 and B27-489), with the wavy separator; from about 2018 the 9A9~999 format (e.g. 0M0~002, 0M1~138).`,
  }),
  kitFormat({
    id: 'collector-multi', label: 'Collector · multi-vehicle', family: 'specialty', period: [1990, 2026], era: 'specialty-collector',
    recipe: collectorFull('collector-multi', 'Collector · multi-vehicle', true, 'dual', 'bc-astro-4'),
    grammar: { hint: 'B6-0000 to B6-1000', blocks: blocks('B6-0999', 'B6-1000') }, dies: COL_DIES, decals: [1990, 2023],
    description: `${COL_DESC} One “floater” plate shared by several collector vehicles, with MULTI-VEHICLE under the title and the wavy separator (B6~0565). Drawn with the two wells of the Waldale-era photos; the Waldale specimen reads A0~0000.`,
  }),
  kitFormat({
    id: 'collector-motorcycle', label: 'Collector · motorcycle', family: 'specialty', period: [1990, 2026], era: 'specialty-collector',
    recipe: collectorSmall('collector-motorcycle', 'Collector · motorcycle', false),
    grammar: { hint: 'B8-0001 to B9-9999 (1990–2018), then 0P-0000 onward', blocks: blocks('B[89]-9999', '0P-9999') },
    dies: [{ id: 'bc-astro-4', label: 'Astrographic (first batch B8-0001 to B8-5000)' }, { id: 'bc-waldale', label: 'Waldale (from 2007)' }], decals: [1990, 2023],
    description: `${COL_DESC} Motorcycle plates use a plain dash (B8-0764). The 2018 format reads 0P-1186 in file names and OP-1186 on the plate; zero is assumed.`,
  }),
  kitFormat({
    id: 'collector-motorcycle-multi', label: 'Collector · motorcycle multi-vehicle', family: 'specialty', period: [1990, 2013], era: 'specialty-collector',
    recipe: collectorSmall('collector-motorcycle-multi', 'Collector · motorcycle multi-vehicle', true),
    grammar: { hint: 'B7-5001 to B7-5100', blocks: blocks('B7-50[0-9]9', 'B7-5100') }, dies: COL_DIES, decals: [1990, 2013],
    description: `${COL_DESC} Multi-vehicle motorcycle floater B7-5001 to B7-5100 (e.g. B7-5024), “even more exceedingly rare” than the car version; MULTI-VEHICLE in tiny letters under the title.`,
  }),
];

// ── Antique (1966–): VINTAGE, embossed touring car, permanent plate ──
const ANT_NOTE = `Antique reconstruction: the embossed touring car is a flat silhouette; legend and serial dies are stand-ins from the passenger dies of the period. ${ART_NOTE}`;
/** Hub style of the car: solid hubs on the 1966 plates and four-digit plates to at least 1961 (photographed),
 * open hubs from at least 3112; BCpl8s places the change between 1500 and 2500. */
function antiqueRecipe(id: string, label: string, serial: KitSerial, hubs: 'solid' | 'open'): KitRecipe {
  return plate(id, label, FULL, SRC.antique, ANT_NOTE, {
    background: '#f2f2ee', ink: '#111111', radius: 5, rim: { inset: 3, width: 1.6 }, holeAt: { x: [0.24, 0.76], y: [0.06] },
    art: [{ art: `bc-vintage-car-${hubs}-hubs`, x: 12, y: 36, width: 132, height: 80, color: '#111111', role: 'touring-car' }],
    legends: [die('VINTAGE', 141, 27, 12, 'bc-legend-1964', 'legend-top', { maxWidth: 100, spread: true }),
      die('BRITISH COLUMBIA', 150, 134, 12, 'bc-legend-1964', 'legend-bottom', { maxWidth: 222, spread: true })],
    serial,
  });
}
const ANT_DESC = 'Permanent (non-revalidated) plates for antique vehicles: VINTAGE at top centre, BRITISH COLUMBIA along the bottom, an embossed early touring car at left and the number at right, black on white.';
const antique: PlateFormat[] = [
  kitFormat({
    id: 'antique-1966', label: 'Antique · VINTAGE (1–999)', family: 'specialty', period: [1966, 1974], era: 'specialty-antique',
    recipe: antiqueRecipe('antique-1966', 'Antique · VINTAGE · one to three digits', { x: 217, baseline: 109, cap: 70, maxWidth: 118, die: 'bc-oakalla-1955' }, 'solid'),
    grammar: numericGrammar([[1, 99], [101, 999]], false),
    description: `${ANT_DESC} Numbers 101 upward from 1966, then single- and double-digit numbers in 1972–74; the three-digit plates use noticeably larger dies than the later four-digit ones.`,
  }),
  kitFormat({
    id: 'antique-1975', label: 'Antique · VINTAGE (four digits · solid hubs)', family: 'specialty', period: [1975, 1980], era: 'specialty-antique',
    recipe: antiqueRecipe('antique-1975', 'Antique · VINTAGE · four digits · solid hubs', { x: 213, baseline: 105, cap: 56, maxWidth: 116, die: 'bc-oakalla-1973' }, 'solid'),
    grammar: numericGrammar([[1000, 2500]], false),
    description: `${ANT_DESC} Four-digit plates from 1975 (1036, 1111, 1236, 1633 and 1961 photographed) with the original car: thin spokes meeting a solid hub. BCpl8s places the rim change between 1500 and 2500; 1961 still has the solid hubs, so this format accepts up to 2500. The end year is approximate.`,
  }),
  kitFormat({
    id: 'antique-1975-open-hubs', label: 'Antique · VINTAGE (four digits · open hubs)', family: 'specialty', period: [1980, 2026], era: 'specialty-antique',
    recipe: antiqueRecipe('antique-1975-open-hubs', 'Antique · VINTAGE · four digits · open hubs', { x: 213, baseline: 105, cap: 56, maxWidth: 116, die: 'bc-oakalla-1973' }, 'open'),
    grammar: numericGrammar([[1962, 9999]], false),
    description: `${ANT_DESC} Later four-digit plates (3112, 3902, 6072 and 9535 photographed) with the car’s different rims: wider openings round an open hub. The change fell between 1961 and 2500, so this format accepts 1962 upward. The start year is approximate.`,
  }),
  kitFormat({
    id: 'antique-prototype-91', label: 'Antique · VINTAGE prototype 91', family: 'specialty', period: [1966, 1966], era: 'specialty-antique', status: 'prototype',
    recipe: plate('antique-prototype-91', 'Antique · VINTAGE prototype 91', FULL, SRC.antique, `Prototype reconstruction from the BCpl8s photograph: the detailed touring car is a vector redraw and the serif lettering uses a system serif. ${ART_NOTE}`, {
      background: '#f4f4f2', ink: '#111111', radius: 7, rim: { inset: 4.5, width: 2 }, holeAt: { x: [0.23, 0.775], y: [0.12, 0.88] },
      art: [{ art: 'bc-vintage-car-prototype', x: 14.6, y: 35.9, width: 102.6, height: 68.4, color: '#111111', role: 'touring-car' }],
      fontLegends: [serif('VINTAGE', 151, 38.5, 20, '#111111', 'legend-top'),
        serif('British Columbia', 151, 124.5, 23, '#111111', 'legend-bottom')],
      serial: { x: 190, baseline: 93, cap: 41, maxWidth: 70, die: 'bc-oakalla-1955', font: { family: 'serif', weight: 400 } },
    }),
    grammar: { hint: '91 (the prototype’s number)', blocks: blocks('91') },
    description: 'A prototype of the VINTAGE plate with a detailed three-quarter drawing of an early touring car (canopy, buttoned seats, spoked wheels) in place of the flat silhouette, serif VINTAGE above and “British Columbia” in serif capitals and lower case below, and a serif number 91 at right. Undated on BCpl8s; the design year is set to the program’s start.',
  }),
  kitFormat({
    id: 'antique-motorcycle', label: 'Antique · VINTAGE MOTORCYCLE', family: 'specialty', period: [1966, 2026], era: 'specialty-antique',
    recipe: plate('antique-motorcycle', 'Antique · VINTAGE MOTORCYCLE', SMALL, SRC.antique, ANT_NOTE, {
      background: '#f0f0ec', ink: '#111111', radius: 5, rim: { inset: 2.5, width: 1.4 }, holeAt: { x: [0.2, 0.8], y: [0.08] },
      legends: [die('VINTAGE', 101.5, 31, 12, 'bc-legend-1964', 'legend-top', { maxWidth: 80, spread: true }),
        die('MOTORCYCLE', 101.5, 116, 11, 'bc-legend-1964', 'legend-bottom', { maxWidth: 104, spread: true })],
      serial: { x: 101.5, baseline: 92, cap: 48, maxWidth: 170, die: 'bc-oakalla-1973' },
    }),
    grammar: { hint: 'BC 1 to BC 999 (BC prefix, a space, one to three digits)', blocks: blocks('BC [1-9]', 'BC [1-9]9', 'BC [1-9]99') },
    dies: [{ id: 'bc-oakalla-1973', label: 'Original wide dies (BC 5, BC 136) · stand-in' }, { id: 'bc-waldale', label: 'Waldale dies (BC 630)' }],
    description: 'Antique motorcycle plate: VINTAGE above and MOTORCYCLE below a “BC 999” number, no car graphic. BCpl8s shows the original (wide dies, raised border), a redesign (BC 400) and a Waldale-die version (BC 630) but gives no dates or ranges, so the period is the program’s.',
  }),
];

// ── Personalized (1979–): the mountain-ocean graphic base ──
const PER_NOTE = `Personalized reconstruction: one shared vector of the mountain band, ocean banner, dogwood and outlined BRITISH / COLUMBIA (a Roboto stand-in for the unestablished face), recoloured for each maker's plates; BEAUTIFUL is a die stand-in. ${ART_NOTE}`;
const EXAMPLES = ['HEALEY', 'DAZZLE', 'IMAGE', 'OL-PAPA', '2GOOD', 'MURALS', 'BCPL8S', 'NUTBAR', 'CHRISG', 'ALL4ME'];
const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const vanity: SerialGrammar = {
  blocks: [], hint: '2–6 letters or digits, optionally split by one space or dash (e.g. BCPL8S, OL-PAPA)',
  custom: {
    generate: (rng) => rng.chance(0.4) ? rng.pick(EXAMPLES) : Array.from({ length: rng.int(2, 6) }, () => rng.pick(ALNUM)).join(''),
    test: (s) => /^[A-Z0-9]+(?:[ -][A-Z0-9]+)?$/.test(s) && /^[A-Z0-9]{2,6}$/.test(s.replace(/[ -]/, '')),
  },
};
type Graphic = 'acme' | 'astro' | 'reversed' | 'waldale' | 'sample';
const OCEAN: Record<Graphic, string> = { acme: '#141c28', astro: '#141d33', reversed: '#141d33', waldale: '#0a45a0', sample: '#1a1a1a' };
/** Dogwood and BRITISH / COLUMBIA from the artwork frame (1774 × 887), scaled uniformly by the plate width so the
 * lettering is never squashed on the narrower motorcycle plate, and centred where the frame puts them. */
function personalizedPieces(size: Size): KitArt[] {
  const [fw, fh] = PERSONALIZED_FRAME, k = size.w / fw, ky = size.h / fh;
  return ([['dogwood', PERSONALIZED_DOGWOOD.box], ['british', PERSONALIZED_BRITISH.box], ['columbia', PERSONALIZED_COLUMBIA.box]] as const).map(([part, [x0, y0, x1, y1]]) => {
    const width = (x1 - x0) * k, height = (y1 - y0) * k;
    return { art: `bc-personalized-${part}`, x: ((x0 + x1) / 2) * k - width / 2, y: ((y0 + y1) / 2) * ky - height / 2, width, height, color: '#ffffff', role: part };
  });
}
function personalizedRecipe(id: string, label: string, size: Size, graphic: Graphic, o: { ink: string; baseline: number; die: string; dualWells: boolean }): KitRecipe {
  const full = size === FULL, ocean = OCEAN[graphic];
  const wells = full
    ? (o.dualWells ? dual(well(94, 119, 32, 25), well(139, 119, 62, 25)) : { decal: well(110, 119, 80, 25) })
    : dual(well(62, 98, 22, 20), well(87, 98, 50, 20));
  return plate(id, label, size, SRC.personalized, PER_NOTE, {
    background: '#f0f0ee', ink: o.ink, rim: { inset: 1.4, width: 1, color: '#d0d4da' }, holeAt: full ? { x: [0.2, 0.8], y: [0.1, 0.92] } : { x: [0.18, 0.82], y: [0.09, 0.93] },
    art: [{ art: `bc-personalized-${graphic}`, x: 0, y: 0, width: size.w, height: size.h }, ...personalizedPieces(size)],
    // BEAUTIFUL starts just past the outlined snow peak, as on the photographed plates.
    legends: [full ? die('BEAUTIFUL', 154, 25, 12.5, 'bc-legend-1973', 'legend-top', { color: ocean, maxWidth: 86, spread: true })
      : die('BEAUTIFUL', 104.5, 19, 8, 'bc-legend-1973', 'legend-top', { color: ocean, maxWidth: 58, spread: true })],
    serial: full ? { x: 150, baseline: o.baseline, cap: 62, maxWidth: 240, die: o.die } : { x: 101.5, baseline: o.baseline, cap: 44, maxWidth: 176, die: o.die },
    ...wells,
  });
}
const PER_DESC = 'Vanity plates of two to six characters on the mountain-ocean graphic base, the first graphic base plate issued in B.C.: a green toothed mountain band with BEAUTIFUL at the top, a blue wavy ocean band with a dogwood and BRITISH / COLUMBIA at the bottom, on 3M reflective sheeting.';
const personalized: PlateFormat[] = [
  kitFormat({
    id: 'personalized-1979', label: 'Personalized · 1979 Acme', family: 'specialty', period: [1979, 1984], era: 'specialty-personalized',
    recipe: personalizedRecipe('personalized-1979', 'Personalized · 1979 Acme', FULL, 'acme', { ink: '#151a22', baseline: 108, die: 'bc-acme-1979', dualWells: false }),
    grammar: vanity, decals: [1979, 1984],
    description: `${PER_DESC} The originals were made by Acme Signal Signs of Montreal; the photo (DAZZLE) shows a near-black slogan and darker green and navy graphics. The changeover to Astrographic (mid-1980s) is not dated exactly.`,
  }),
  kitFormat({
    id: 'personalized-astro', label: 'Personalized · Astrographic', family: 'specialty', period: [1984, 2002], era: 'specialty-personalized',
    recipe: personalizedRecipe('personalized-astro', 'Personalized · Astrographic', FULL, 'astro', { ink: '#141c30', baseline: 111, die: 'bc-astro-4', dualWells: false }),
    grammar: vanity, decals: [1984, 2002],
    palettes: [{ id: 'dark', label: 'Near-black blue digits (usual)', background: '#f0f0ee', ink: '#141c30' }, { id: 'light', label: 'Mid-1990s light blue digits', background: '#f0f0ee', ink: '#2f55b5' }],
    description: `${PER_DESC} Astrographic plates (mid-1980s to 2002) use a dark blue slogan and navy ocean, with the slogan sitting low into the ocean band; a brief mid-1990s run has very noticeable light blue digits (MURALS).`,
  }),
  kitFormat({
    id: 'personalized-reversed', label: 'Personalized · reversed mountains', family: 'specialty', period: [1984, 1986], era: 'specialty-personalized',
    recipe: personalizedRecipe('personalized-reversed', 'Personalized · reversed mountain graphic', FULL, 'reversed', { ink: '#141c30', baseline: 111, die: 'bc-astro-4', dualWells: false }),
    grammar: vanity, decals: [1984, 1986],
    description: `${PER_DESC} A brief mid-1980s run on which the mountain graphic was erroneously reversed left to right (OL-PAPA); exact years are not given.`,
  }),
  kitFormat({
    id: 'personalized-waldale', label: 'Personalized · Waldale', family: 'specialty', period: [2002, 2026], era: 'specialty-personalized',
    recipe: personalizedRecipe('personalized-waldale', 'Personalized · Waldale', FULL, 'waldale', { ink: '#0a45a0', baseline: 106, die: 'bc-waldale', dualWells: true }),
    grammar: vanity, decals: [2002, 2023],
    description: `${PER_DESC} Waldale plates (late 2002 on): slogan shifted slightly higher for legibility and printed in the same light blue as the ocean band; later plates have separate day and month/year wells (BCPL8S, 2012).`,
  }),
  kitFormat({
    id: 'personalized-sample', label: 'Personalized · SAMPLE', family: 'specialty', period: [1985, 2002], era: 'specialty-personalized', status: 'official-sample',
    recipe: personalizedRecipe('personalized-sample', 'Personalized · SAMPLE', FULL, 'sample', { ink: '#1a1a1a', baseline: 110, die: 'bc-astro-4', dualWells: false }),
    grammar: { hint: 'SAMPLE', blocks: blocks('S\\AMPLE') },
    description: `${PER_DESC} Sample plate with the slogan and graphic printed in black. Undated; drawn on the Astrographic layout.`,
  }),
  kitFormat({
    id: 'personalized-motorcycle', label: 'Personalized · motorcycle', family: 'specialty', period: [2000, 2026], era: 'specialty-personalized',
    recipe: personalizedRecipe('personalized-motorcycle', 'Personalized · motorcycle', SMALL, 'waldale', { ink: '#0a45a0', baseline: 84, die: 'bc-waldale', dualWells: true }),
    grammar: vanity, dies: [{ id: 'bc-waldale', label: 'Waldale (late 2002 on)' }, { id: 'bc-astro-4', label: 'Astrographic (2000–02)' }], decals: [2000, 2023],
    description: `${PER_DESC} Personalized plates first appeared on motorcycles in 2000; the same graphic is compressed onto the small plate (NUTBAR, 2016). The maximum length on motorcycles is not stated, so the car rule is used. Colours follow the Waldale plates.`,
  }),
  kitFormat({
    id: 'personalized-motorcycle-prototype', label: 'Personalized · motorcycle prototype', family: 'specialty', period: [2001, 2001], era: 'specialty-personalized', status: 'prototype',
    recipe: personalizedRecipe('personalized-motorcycle-prototype', 'Personalized · motorcycle prototype', SMALL, 'waldale', { ink: '#0a45a0', baseline: 84, die: 'bc-astro-4', dualWells: true }),
    grammar: { hint: '123678 (the prototype’s number)', blocks: blocks('123678') },
    description: `${PER_DESC} Astrographic prototype of the personalized motorcycle plate, assumed by BCpl8s to date from about 2001, numbered 123678.`,
  }),
];

// ── Consular ──
const CON_NOTE = `Consular reconstruction from BCpl8s photographs. ${ART_NOTE}`;
const consulLegend = (x: number, baseline: number, cap: number, dieId: string, maxWidth: number): KitText => die('CONSUL', x, baseline, cap, dieId, 'legend-consul', { maxWidth });
const consular: PlateFormat[] = [
  kitFormat({
    id: 'consular-1967', label: 'CONSUL · 1967–72 dated', family: 'consular', period: [1967, 1972], era: 'consular-1967',
    recipe: plate('consular-1967', 'CONSUL · 1967–72 year-dated', { w: 302, h: 150 }, SRC.consular, `${CON_NOTE} Size is not stated; the documented 302 × 150 mm passenger size of 1967–69 is used.`, {
      background: '#f0f4fa', ink: '#00419f', radius: 5, rim: { inset: 3, width: 1.6 }, holeAt: { x: [0.2, 0.8], y: [0.07, 0.93] },
      legends: [die('19', 30, 30, 13, 'bc-legend-1964', 'year-left'), die('BEAUTIFUL', 151, 30, 13, 'bc-legend-1964', 'legend-top', { maxWidth: 108, spread: true }),
        die('{yy}', 272, 30, 13, 'bc-legend-1964', 'year-right'), die('BRITISH COLUMBIA', 151, 134, 13, 'bc-legend-1964', 'legend-bottom', { maxWidth: 210, spread: true }),
        consulLegend(72, 97, 40, 'bc-oakalla-1955', 124)],
      serial: { x: 217, baseline: 108, cap: 70, maxWidth: 124, die: 'bc-oakalla-1955' },
    }),
    grammar: numericGrammar([[501, 700]], false),
    palettes: [
      { id: '1967', label: '1967 · red on white', background: '#f2f1e9', ink: '#a73d2f', year: 1967 },
      { id: '1968', label: '1968 · blue on white', background: '#f0f4fa', ink: '#00419f', year: 1968 },
      { id: '1969', label: '1969 · white on blue (passenger colours; not photographed)', background: '#245993', ink: '#f1f0e7', year: 1969 },
      { id: '1970', label: '1970 · blue on white', background: '#f0f4fa', ink: '#00419f', year: 1970 },
    ],
    description: 'Consular officers’ plates in the passenger style of the year, with CONSUL stamped as a de facto prefix before three larger figures and the year split 19 … 68 across the top. Numbers from 501 (1967; 501–700 in 1969, 501–675 in 1970). Colours follow the passenger plates; 1967, 1968 and 1970 are photographed, 1969 is assumed from the passenger colours and 1971–72 are not shown. The 1970 plate has a dash after CONSUL, not drawn here; the red 1967 “CONSUL 000” is probably a sample.',
  }),
  kitFormat({
    id: 'consular-1973', label: 'CONSUL · 1973–78', family: 'consular', period: [1973, 1978], era: 'consular-1973',
    recipe: plate('consular-1973', 'CONSUL · 1973–78', FULL, SRC.consular, CON_NOTE, {
      background: '#f0f4fa', ink: '#0a3c90', radius: 5, rim: { inset: 3, width: 1.6 }, holeAt: { x: [0.2, 0.8], y: [0.07, 0.93] },
      legends: [die('BEAUTIFUL', 150, 30, 12, 'bc-legend-1973', 'legend-top', { maxWidth: 104, spread: true }),
        die('BRITISH COLUMBIA', 150, 135, 13, 'bc-legend-1973', 'legend-bottom', { maxWidth: 228, spread: true }), consulLegend(78, 96, 38, 'bc-oakalla-1973', 124)],
      serial: { x: 222, baseline: 108, cap: 63, maxWidth: 124, die: 'bc-oakalla-1973' },
      decal: well(246, 8, 44, 24),
    }),
    grammar: numericGrammar([[101, 600]], false), decals: [1973, 1978],
    description: 'Blue on white: BEAUTIFUL at the top, CONSUL and three figures, BRITISH COLUMBIA below and a decal box at top right. Numbers 101–500 (1973) and 501–600 (1977).',
  }),
  kitFormat({
    id: 'consular-1979', label: 'CONSUL · 1979–86 blue', family: 'consular', period: [1979, 1986], era: 'consular-1979',
    recipe: plate('consular-1979', 'CONSUL · 1979–86 white on blue', FULL, SRC.consular, CON_NOTE, {
      background: '#013f88', ink: '#f0f0f0', radius: 5, rim: { inset: 3, width: 1.4 }, holeAt: { x: [0.2, 0.8], y: [0.07, 0.93] },
      legends: [die('BEAUTIFUL', 150, 29, 12, 'bc-legend-acme', 'legend-top', { maxWidth: 104, spread: true }),
        die('BRITISH', 48, 133, 12, 'bc-legend-acme', 'legend-left'), die('COLUMBIA', 250, 133, 12, 'bc-legend-acme', 'legend-right'), consulLegend(77, 93, 36, 'bc-acme-1979', 118)],
      serial: { x: 222, baseline: 102, cap: 62, maxWidth: 124, die: 'bc-acme-1979' },
      decal: well(92, 110, 108, 32),
    }),
    grammar: paddedGrammar([[2, 100], [601, 999]]), decals: [1979, 1986],
    description: 'White on blue in the style of the 1979 passenger base: BEAUTIFUL above, CONSUL and three figures, and BRITISH [decal box] COLUMBIA below. Numbers 002–100 and 601–999.',
  }),
  kitFormat({
    id: 'consular-flag', label: 'CONSUL · flag graphic base', family: 'consular', period: [1985, 2007], era: 'consular-flag',
    recipe: plate('consular-flag', 'CONSUL · flag graphic base', FULL, SRC.consular, CON_NOTE, {
      background: '#f4f4f4', ink: '#051560', rim: { inset: 4.5, width: 1.2, color: '#c5cfda' },
      art: [{ art: 'bc-spirit-flag', x: 14, y: 110, width: 32, height: 25, role: 'flag' }],
      fontLegends: [serif('Beautiful British Columbia', 150, 31, 17, '#051560', 'slogan', { width: 220 }), serif('CONSUL', 76, 94, 31, '#051560', 'legend-consul')],
      serial: { x: 222, baseline: 108, cap: 67, maxWidth: 124, die: 'bc-astro-4', color: '#051560' },
      decal: well(100, 114, 100, 28),
    }),
    grammar: { ...numericGrammar([[101, 999]], false), blocks: blocks('[A-D]0[1-9]', '[A-D][1-9]9'), hint: '101–999 (1985–2001), then A01–D99 (2001; D99 unconfirmed)' },
    dies: [{ id: 'bc-astro-4', label: 'Astrographic' }, { id: 'bc-waldale', label: 'Waldale (late plates)' }], decals: [1986, 2007],
    description: 'Flag-base era: “Beautiful British Columbia” in serif above, CONSUL in serif capitals before the three-character number, and a small flag at bottom left. Numbers 101–500 (1985), 501–999 (1991), then A01 onward from 2001 (A02, D17 seen). BCpl8s headings give both 1985 and 1986 for the start.',
  }),
  kitFormat({
    id: 'consular-red', label: 'Consular · 2007 red', family: 'consular', period: [2007, 2026], era: 'consular-red',
    recipe: plate('consular-red', 'Consular · 2007 red', FULL, SRC.consular, CON_NOTE, {
      background: '#a21b22', ink: '#f4f4f4', rim: { inset: 2.5, width: 1.2, color: '#f4f4f4' },
      fontLegends: [serif('BRITISH COLUMBIA', 150, 29, 13, '#f4f4f4', 'legend-top', { width: 132 })],
      serial: { x: 150, baseline: 108, cap: 63, maxWidth: 264, die: 'bc-waldale', color: '#f4f4f4',
        separator: { kind: 'art', gap: 3, art: { art: 'bc-logo-wordmark-mono', x: 0, y: 108 - 31.5 - 16, width: 36, height: 32, color: '#f4f4f4' } } },
      ...dual(well(96, 114, 28, 26), well(128, 114, 76, 26)),
    }),
    grammar: { hint: 'DL, CC, HC, CS or SR, then 000A onward (all examples end in A)', blocks: blocks(...['DL', 'CC', 'HC', 'CS', 'SR'].map((p) => `${p}-999\\A`)) }, decals: [2007, 2023],
    description: 'Red and white plates for foreign representatives (passenger, commercial and motor homes): BRITISH COLUMBIA above, a two-letter class prefix — DL diplomat-level, CC career consular officer, HC honorary consul, CS consular staff, SR special representative — then the new B.C. “Mountain” logo in place of the flag, and a divided decal box. This AA0-00A format was trialled here before the 2014 passenger use.',
  }),
];

export const BC_SPECIALTY_FAMILIES: PlateFamily[] = [
  { id: 'specialty', label: 'Specialty & optional', summary: 'Optional and specialty bases: BC Parks, 2010 Olympics, Veteran, Memorial Cross, Collector, Antique and Personalized.' },
  { id: 'consular', label: 'Consular', summary: 'Plates for consular officers and foreign representatives, from the 1967 CONSUL plates to the 2007 red base.' },
];
export const BC_SPECIALTY_ERAS: PlateEra[] = [
  { id: 'specialty-antique', label: 'Antique (VINTAGE)', period: [1966, 2026], family: 'specialty', summary: 'Permanent VINTAGE plates with an embossed touring car.' },
  { id: 'specialty-personalized', label: 'Personalized', period: [1979, 2026], family: 'specialty', summary: 'Vanity plates on the mountain-ocean graphic base.' },
  { id: 'specialty-collector', label: 'Collector', period: [1990, 2026], family: 'specialty', summary: 'Plates for vehicles at least 25 years old, including multi-vehicle floaters.' },
  { id: 'specialty-veteran', label: 'Veteran & Memorial Cross', period: [2004, 2026], family: 'specialty', summary: 'Veteran plates (2004) and Memorial Cross Recipient plates (2016).' },
  { id: 'specialty-olympic', label: '2010 Olympics', period: [2007, 2010], family: 'specialty', summary: 'Mount Garibaldi base with the Vancouver 2010 emblem between the serial halves.' },
  { id: 'specialty-parks', label: 'BC Parks', period: [2016, 2026], family: 'specialty', summary: 'Three photo designs — Kermode bear, Purcell Mountains, Porteau Cove.' },
  { id: 'consular-1967', label: 'CONSUL year-dated', period: [1967, 1972], family: 'consular', summary: 'CONSUL prefix on passenger-style dated plates.' },
  { id: 'consular-1973', label: 'CONSUL 1973 base', period: [1973, 1978], family: 'consular', summary: 'Blue on white with a top-right decal box.' },
  { id: 'consular-1979', label: 'CONSUL 1979 base', period: [1979, 1986], family: 'consular', summary: 'White on blue, 1979 passenger style.' },
  { id: 'consular-flag', label: 'CONSUL flag base', period: [1985, 2007], family: 'consular', summary: 'Serif slogan and CONSUL with a small flag.' },
  { id: 'consular-red', label: '2007 red base', period: [2007, 2026], family: 'consular', summary: 'DL / CC / HC / CS / SR prefixes with the B.C. logo.' },
];
export const BC_SPECIALTY_FORMATS: PlateFormat[] = [...parks, ...olympic, ...veteran, ...memorial, ...collector, ...antique, ...personalized, ...consular];
