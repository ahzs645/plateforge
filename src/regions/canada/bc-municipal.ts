/**
 * B.C. municipal and bicycle plates.
 *  - municipal: the province-issued MUNICIPAL plate (1963–86) and its EXEMPT
 *    companion (1963–75); plates issued by individual municipalities for
 *    commercial vehicles (mostly half-yearly), the City of Vancouver's licence
 *    categories, Victoria's 1913 hired-vehicle porcelain and the Tahsis Company plate.
 *  - bicycle: bicycle licence plates issued by municipalities, 1901–2000.
 * Sources: BCpl8s Municipal, Municipal-Provincial, Municipal-Exempt,
 * Municipal-City-Issues, Municipal-Vancouver, Guinness and the Bicycle-<town> pages.
 * Most of these pages give no dimensions: drawing sizes are then estimated from
 * photo proportions and each description says so. Layout fractions and colours
 * are read from the photographs.
 */
import '../../templates/bc/art-municipal';
import '../../templates/bc/art-vancouver-municipal';
import { textOverlay, type OverlayItem } from '../../templates/bc/art-municipal';
import type { PlateEra, PlateFamily, PlateFormat, PlateStatus } from '../../core/types';
import type { KitArt, KitFontText, KitPanel, KitRecipe, KitShape, KitText } from '../../templates/bc/kit';
import { kitFormat, numericGrammar, NO_SERIAL, type KitPalette, type SerialGrammar } from './bc-kit';

export const BC_MUNICIPAL_FAMILIES: PlateFamily[] = [
  { id: 'municipal', label: 'Municipal & exempt', summary: 'Commercial-vehicle licence plates: issued by individual municipalities (often by half-year) until 1962, by the City of Vancouver into the 2000s, and by the province as a single MUNICIPAL plate (with EXEMPT) from 1963 to 1986.' },
  { id: 'bicycle', label: 'Bicycle', summary: 'Bicycle licence plates issued by municipalities, from Vancouver’s 1901 brass tags to the 1970s tin and plastic plates.' },
];
export const BC_MUNICIPAL_ERAS: PlateEra[] = [
  { id: 'municipal-city', family: 'municipal', label: 'Municipality-issued plates', period: [1913, 1972], summary: 'Each municipality licensed commercial vehicles with its own plate, usually for one half of the year.' },
  { id: 'municipal-vancouver', family: 'municipal', label: 'City of Vancouver', period: [1912, 2004], summary: 'Vancouver kept its own vehicle, conveyance, express & dray, taxi, for-hire, commercial-permit and junk-peddler plates.' },
  { id: 'municipal-provincial', family: 'municipal', label: 'Provincial MUNICIPAL plates', period: [1963, 1986], summary: 'One MUNICIPAL plate valid throughout B.C., issued by the province with a related EXEMPT plate; renewable with decals from 1983.' },
  { id: 'bicycle-early', family: 'bicycle', label: 'Early bicycle plates', period: [1901, 1952], summary: 'Brass tags, shields, discs and small tin plates issued by municipalities.' },
  { id: 'bicycle-later', family: 'bicycle', label: 'Later bicycle plates', period: [1953, 2000], summary: 'Hexagons, ovals and small rectangles through the 1970s, then Vancouver’s bicycle-courier plates.' },
];

// ── Building blocks ─────────────────────────────────────────────────────────
const page = (path: string, title: string) => ({ title: `BCpl8s · ${title}`, url: `https://www.bcpl8s.ca/${path}` });
const PROV = page('Municipal-Provincial.html', 'Municipal (provincial issue)');
const EXEMPT = page('Municipal-Exempt.html', 'Municipal Exempt');
const CITY = page('Municipal-City-Issues.htm', 'Municipal city issues');
const VAN = page('Municipal-Vancouver.html', 'City of Vancouver');
const bike = (town: string, name: string) => page(`Bicycle-${town}.html`, `Bicycle · ${name}`);

const LEG = 'municipal-legend', SER = 'municipal-serial', OLD = 'bc-legend-1940', OLDSER = 'bc-early-1940';
type Opt = { mw?: number; die?: string; spread?: boolean; anchor?: 'start' | 'middle' | 'end'; color?: string; screened?: boolean };
/** Die legend: text, x (fraction of width), baseline and cap height (fractions of height). */
type T = readonly [string, number, number, number, Opt?];
/** Typeface legend (for '&', ',', '$' and lower case): text, x, baseline, size (fraction of height). */
type FOpt = Partial<Pick<KitFontText, 'font' | 'weight' | 'italic' | 'color'>> & { width?: number };
type F = readonly [string, number, number, number, FOpt?];
/** Characters stacked upright: text, x, first baseline, step, cap. */
type Stack = readonly [string, number, number, number, number];
/** Text on its side: text, x, y (centre), cap, 1 = reads downward / -1 = reads upward. */
type Rot = readonly [string, number, number, number, 1 | -1];
/** Arched text: text, cx, cy (fractions), baseline radius and cap (fractions of height), side. */
type Arc = readonly [string, number, number, number, number, 'top' | 'bottom'];

interface Spec {
  id: string;
  family: 'municipal' | 'bicycle';
  label: string;
  period: readonly [number, number];
  era: string;
  status?: PlateStatus;
  source: { title: string; url: string };
  w: number; h: number; bg: string; ink: string;
  /** Die-cut outline instead of a rounded rectangle; `oval` is an ellipse (rect with rx = width/2). */
  shell?: 'shield' | 'hex' | 'notch' | 'step' | 'taxi' | 'oval';
  radius?: number;
  rim?: number | null;
  holes?: 'slots' | 'round' | 'none';
  hx?: readonly number[]; hy?: readonly number[];
  die?: string; sdie?: string; serialColor?: string; rimColor?: string;
  t?: readonly T[]; f?: readonly F[]; stack?: readonly Stack[]; rot?: readonly Rot[]; arc?: readonly Arc[];
  /** Vertical rules: x, top, bottom (fractions). */
  rules?: readonly (readonly [number, number, number])[];
  shapes?: readonly KitShape[];
  panels?: readonly KitPanel[];
  extraArt?: readonly KitArt[];
  /** Serial: x, baseline, cap, max width; optional typeface stand-in. */
  serial: readonly [number, number, number, number, ('serif' | 'sans')?];
  grammar: SerialGrammar;
  palettes?: readonly KitPalette[];
  flat?: boolean;
  decal?: KitRecipe['decal']; extraWells?: KitRecipe['extraWells'];
  description: string;
  note?: string;
}

const NOTE = 'Reconstruction from BCpl8s photographs: layout proportions, colours (read from aged paint) and dies are approximate.';

function build(s: Spec): PlateFormat {
  const { w, h } = s;
  const text = ([value, x, y, cap, o = {}]: T, i: number): KitText => ({ text: value, x: x * w, baseline: y * h, cap: cap * h, die: o.die ?? s.die ?? LEG,
    role: `legend-${i}`, ...(o.mw ? { maxWidth: o.mw * w } : {}), ...(o.spread ? { spread: true } : {}), ...(o.anchor ? { anchor: o.anchor } : {}), ...(o.color ? { color: o.color } : {}), ...(o.screened ? {screened: true} : {}) });
  const stacked = (s.stack ?? []).flatMap(([value, x, from, step, cap], j) => [...value].map((c, i): KitText =>
    ({ text: c, x: x * w, baseline: (from + i * step) * h, cap: cap * h, die: s.die ?? LEG, role: `stack-${j}-${i}` })));
  const items: OverlayItem[] = [
    ...(s.rot ?? []).map(([value, x, y, cap, dir]): OverlayItem => ({ kind: 'rot', text: value, x: x * w, y: y * h, cap: cap * h, die: s.die ?? LEG, dir })),
    ...(s.arc ?? []).map(([value, cx, cy, r, cap, side]): OverlayItem => ({ kind: 'arc', text: value, cx: cx * w, cy: cy * h, r: r * h, cap: cap * h, die: s.die ?? LEG, side })),
  ];
  const cut = s.shell && s.shell !== 'oval';
  const art: KitArt[] = [
    ...(cut ? [{ art: `municipal-shell-${s.shell}`, x: 0, y: 0, width: w, height: h, color: s.bg, role: 'die-cut-shell' }] : []),
    ...(s.extraArt ?? []).map(a => a.art === 'municipal-vancouver-centennial-base' ? {...a,height:h} : a),
    ...(items.length ? [{ art: textOverlay(`municipal-text-${s.id}`, w, h, items), x: 0, y: 0, width: w, height: h, color: s.ink, role: 'turned-legends' }] : []),
  ];
  const [sx, sy, scap, smw, font] = s.serial;
  const recipe: KitRecipe = {
    id: `${s.family}-${s.id}`, label: s.label, width: w, height: h,
    radius: s.shell === 'oval' ? w / 2 : cut ? 0 : s.radius ?? 5,
    background: cut ? 'none' : s.bg, ink: s.ink,
    rim: s.rim === null || cut ? null : { inset: s.rim ?? 2.5, width: 1.3, ...(s.rimColor ? {color: s.rimColor} : {}) },
    holes: s.holes ?? 'round', holeAt: { x: s.hx ?? [0.06, 0.94], y: s.hy ?? [0.13, 0.87] },
    art, legends: [...(s.t ?? []).map(text), ...stacked],
    fontLegends: (s.f ?? []).map(([value, x, y, size, o = {}], i) => ({ text: value, x: x * w, baseline: y * h, size: size * h, font: o.font ?? 'sans', weight: o.weight ?? 700,
      ...(o.italic ? { italic: true } : {}), ...(o.color ? { color: o.color } : {}), ...(o.width ? { width: o.width * w } : {}), role: `font-legend-${i}` })),
    shapes: [...(s.rules ?? []).map(([x, y1, y2]): KitShape => ({ kind: 'line', x1: x * w, y1: y1 * h, x2: x * w, y2: y2 * h, strokeWidth: 1.2 })), ...(s.shapes ?? [])],
    ...(s.panels ? { panels: s.panels } : {}),
    serial: { x: sx * w, baseline: sy * h, cap: scap * h, maxWidth: smw * w, die: s.sdie ?? SER, ...(s.serialColor ? {color: s.serialColor} : {}), ...(font ? { font: { family: font } } : {}) },
    decal: s.decal ?? null, ...(s.extraWells ? { extraWells: s.extraWells } : {}),
    embossed: !s.flat, ...(s.status ? { status: s.status } : {}), source: s.source, note: s.note ?? NOTE,
  };
  return kitFormat({ id: `${s.family}-${s.id}`, label: s.label, family: s.family, period: s.period, era: s.era, ...(s.status ? { status: s.status } : {}),
    recipe, grammar: s.grammar, description: s.description,
    ...(s.palettes ? { palettes: cut ? s.palettes.map((p) => ({ ...p, background: 'none' })) : s.palettes } : {}) });
}

/** Plain numbers lo–hi; `zeros` are documented all-zero specimens (valid, never generated). */
function nums(hi: number, lo = 1, zeros: readonly string[] = []): SerialGrammar {
  const g = numericGrammar([[lo, hi]], false);
  return zeros.length ? { ...g, blocks: zeros.map((z) => ({ pattern: z })), avoid: (v) => zeros.includes(v), hint: `${g.hint} (and the ${zeros.join(', ')} specimen)` } : g;
}
const pal = (year: number, words: string, background: string, ink: string): KitPalette => ({ id: String(year), label: `${year} · ${words}`, background, ink, year });
const EST = (w: number, h: number) => `Size not documented; drawn ${w} × ${h} mm, estimated from photo proportions.`;

// ── Province-issued MUNICIPAL and EXEMPT (small plates, size unknown) ───────
const PW = 180, PH = 115;
const PROV_SIZE = `The page gives no size: drawn ${PW} × ${PH} mm, estimated from a 1968 photo against a passenger plate (roughly half its width) and the plates’ proportions.`;
const provSlots = { family: 'municipal' as const, die: 'bc-legend-1955', sdie: 'bc-oakalla-1955', holes: 'slots' as const, hx: [0.15, 0.85], hy: [0.08, 0.92] };

const provincial: Spec[] = [
  { id: 'prov-1963', label: 'MUNICIPAL · 1963–81 (B.C.-year top)', period: [1963, 1981], era: 'municipal-provincial', source: PROV, w: PW, h: PH, radius: 7, ...provSlots,
    bg: '#eeeeee', ink: '#151515',
    t: [['B.C.-{yy}', 0.5, 0.3, 0.15, { mw: 0.5 }], ['MUNICIPAL', 0.5, 0.88, 0.15, { mw: 0.58 }]], serial: [0.5, 0.7, 0.34, 0.82],
    grammar: nums(99999),
    palettes: [
      pal(1963, 'maroon on pink', '#dab1b1', '#6f484a'), pal(1964, 'black on light blue', '#5a8fb9', '#1a2030'), pal(1965, 'black on white', '#eeeeee', '#151515'),
      pal(1966, 'red on white', '#e2eaec', '#d02828'), pal(1967, 'dark green on white', '#e4e9eb', '#1f6b4f'), pal(1968, 'orange on cream', '#eee7cb', '#e8742a'),
      pal(1969, 'green on white', '#eeeeee', '#1f8a5a'), pal(1970, 'red-orange on white', '#eeeeee', '#e2463a'), pal(1971, 'dark green on pale green', '#dfe6dc', '#1f4a3c'),
      pal(1972, 'orange on white', '#f2f2f2', '#ee7a2a'), pal(1973, 'green on white', '#f2f2f2', '#1f7a50'), pal(1974, 'red on white', '#f2f2f2', '#e03a30'),
      pal(1975, 'black on white', '#f2f2f2', '#151515'), pal(1976, 'orange on white', '#f2f2f2', '#ee6a1a'), pal(1977, 'green on white', '#f2f2f2', '#1f7a50'),
      pal(1978, 'black on white', '#f2f2f2', '#151515'), pal(1981, 'white on dark brown', '#483c3b', '#f0f0f0'),
    ],
    description: `Issued by the province (not a municipality): from 1963 one MUNICIPAL plate was valid throughout B.C. for commercial vehicles, replacing the municipal issues. Annual plates with “B.C.-63” … “B.C.-78” over the number and MUNICIPAL below; colours changed every year (1963’s pink may be faded red). 1981 returned to this layout in white on dark brown. Numbers 1–99999; issue ranges are unknown. ${PROV_SIZE}` },
  { id: 'prov-1979', label: 'MUNICIPAL · 1979–82 (B.C. left, year right)', period: [1979, 1982], era: 'municipal-provincial', source: PROV, w: PW, h: PH, radius: 7, ...provSlots,
    bg: '#593d38', ink: '#f0f0f0', sdie: 'bc-acme-1979',
    t: [['B.C.', 0.16, 0.25, 0.13], ['{yy}', 0.86, 0.25, 0.13], ['MUNICIPAL', 0.5, 0.89, 0.14, { mw: 0.58 }]], serial: [0.5, 0.7, 0.38, 0.9],
    grammar: { ...nums(99999), blocks: [{ pattern: '099999' }], hint: '1–99999 (1979–81) or six figures with a leading 0 (1982, e.g. 019426)' },
    palettes: [pal(1979, 'white on brown', '#593d38', '#f0f0f0'), pal(1980, 'black on white', '#f0f0f0', '#151515'), pal(1982, 'black on white', '#f0f0f0', '#151515')],
    description: `Province-issued MUNICIPAL plates of 1979, 1980 and 1982 put B.C. at top left and the two-figure year at top right (1981 kept the centred “B.C.-81”). 1982 used six-figure numbers with a leading 0 (019426). Serial die approximated with the 1979-base ACME die. ${PROV_SIZE}` },
  { id: 'prov-1983', label: 'MUNICIPAL · 1983–86 decal base', period: [1983, 1986], era: 'municipal-provincial', source: PROV, w: PW, h: PH, radius: 7, ...provSlots,
    bg: '#352f33', ink: '#e8e8e8', sdie: 'bc-hisigns-1982',
    t: [['B.C.', 0.12, 0.25, 0.13], ['MUNICIPAL', 0.5, 0.92, 0.13, { mw: 0.55 }]], serial: [0.5, 0.74, 0.38, 0.84],
    decal: { x: PW * 0.36, y: PH * 0.05, width: PW * 0.27, height: PH * 0.2 }, extraWells: [{ x: PW * 0.69, y: PH * 0.07, width: PW * 0.25, height: PH * 0.18 }],
    grammar: { blocks: [{ pattern: '099-999' }], hint: '0XX-XXX (known 022-205 … 075-475)' },
    description: `Issued by the province: “for 1983, a renewable base through the use of registration decals was introduced, and would be used through 1986.” White on black-brown with B.C. at top left and a dashed six-figure number. Decals (M-84 and M-85 red/white at top centre, a yellow CV-86 at top right) are shown as empty placement boxes. ${PROV_SIZE}` },
];

// EXEMPT: the two-figure year is stacked at the right, so each year is its own format (palettes cannot restack digits).
const exemptYears: Array<[number, string, string, string]> = [
  [1963, 'dark on pink (as regular 1963)', '#e7aea5', '#3b2a2a'], [1964, 'red on blue', '#3f97cf', '#b8323a'], [1965, 'red on white', '#ece9e6', '#d4202a'],
  [1966, 'black on white', '#e5e7e8', '#151515'], [1967, 'red on white', '#ebe9e9', '#d62030'], [1968, 'black on white', '#ececec', '#151515'],
  [1969, 'yellow on dark blue', '#1e3a9a', '#f2d52a'], [1970, 'black on white', '#e7ebea', '#151515'], [1971, 'green on white', '#ececec', '#1f7a3a'],
  [1972, 'red on white', '#e8e6e4', '#d42a2a'], [1973, 'yellow on blue', '#2447a0', '#e8d23a'],
];
const exempt: Spec[] = [
  ...exemptYears.map(([year, words, bg, ink]): Spec => ({
    id: `exempt-${year}`, label: `EXEMPT · ${year} · ${words}`, period: [year, year], era: 'municipal-provincial', source: EXEMPT, w: PW, h: PH, radius: 7, ...provSlots, bg, ink,
    t: [['B.C.-EXEMPT', 0.46, 0.28, 0.15, { mw: 0.62 }], ['MUNICIPAL', 0.47, 0.9, 0.14, { mw: 0.58 }]],
    stack: [[String(year).slice(2), 0.91, 0.47, 0.2, 0.17]], serial: [0.45, 0.69, 0.35, 0.74],
    grammar: nums(99999, 1000),
    description: `Issued by the province for vehicles exempt from the municipal licence (e.g. province-owned vehicles): “B.C.- EXEMPT” over the number, MUNICIPAL below and the year stacked at the right. Apart from 1963 the colours differ from the regular MUNICIPAL plate; ${year} is ${words}. Four- and five-figure numbers. ${PROV_SIZE}`,
  })),
  { id: 'exempt-1974', label: 'MUN EXEMPT · 1974–75', period: [1974, 1975], era: 'municipal-provincial', source: EXEMPT, w: PW, h: PH, radius: 7, ...provSlots, bg: '#f0f0ee', ink: '#151515',
    t: [['B.C.', 0.17, 0.27, 0.14], ['MUN', 0.5, 0.27, 0.14], ['{yy}', 0.83, 0.27, 0.14], ['EXEMPT', 0.5, 0.91, 0.14, { mw: 0.42 }]], serial: [0.5, 0.71, 0.36, 0.8],
    grammar: nums(99999, 1000),
    palettes: [pal(1974, 'black on white', '#f0f0ee', '#151515'), pal(1975, 'red on white', '#d3cdc1', '#b13538')],
    description: `Province-issued exempt plate: “the 1974 and 1975 issues displaying the date in the top right-hand corner and truncating the word MUNICIPAL to read simply MUN”, with EXEMPT along the bottom. ${PROV_SIZE}` },
];

// ── Plates issued by individual municipalities (one photographed design each) ─
const CW = 180;
const cityDesc = (town: string, issuer: string, what: string, h: number) =>
  `Issued by the ${issuer} (not the province) for commercial vehicles${town ? ` operating in ${town}` : ''}. ${what} The gallery page has no text: this reproduces one photographed plate. ${EST(CW, h)}`;
function city(id: string, town: string, issuer: string, year: number, aspect: number, words: string, what: string, rest: Omit<Spec, 'id' | 'family' | 'label' | 'period' | 'era' | 'source' | 'w' | 'h' | 'description'>): Spec {
  const h = Math.round(CW / aspect);
  return { id: `city-${id}`, family: 'municipal', label: `${town} · ${year} · ${words}`, period: [year, year], era: 'municipal-city', source: CITY, w: CW, h,
    description: cityDesc(town, issuer, what, h), ...rest };
}
const half = (lo = 1, hi = 999, zeros: string[] = []) => nums(hi, lo, zeros);
const cornerHoles = { holes: 'round' as const, hx: [0.05, 0.95], hy: [0.16, 0.84] };

const cities: Spec[] = [
  city('agassiz', 'Agassiz', 'Village of Agassiz', 1953, 1.66, 'black on white', 'FIRST HALF and 1953 across the top, the number, AGASSIZ spaced along the bottom.',
    { ...cornerHoles, hx: [0.03, 0.97], hy: [0.1, 0.9], bg: '#efefec', ink: '#1a1a1a', t: [['FIRST HALF', 0.27, 0.27, 0.16, { mw: 0.42 }], ['1953', 0.83, 0.27, 0.16], ['AGASSIZ', 0.5, 0.92, 0.16, { mw: 0.72, spread: true }]],
      serial: [0.5, 0.65, 0.33, 0.5], grammar: half() }),
  city('alberni', 'Alberni', 'City of Alberni', 1958, 1.75, 'cream on orange-red', '1958 over ALBERNI with the number small along the bottom.',
    { ...cornerHoles, bg: '#e0472a', ink: '#f1e2c0', t: [['1958', 0.5, 0.29, 0.2, { mw: 0.52, spread: true }], ['ALBERNI', 0.5, 0.62, 0.21, { mw: 0.78, spread: true }]], serial: [0.5, 0.92, 0.18, 0.4], grammar: half() }),
  city('burnaby', 'Burnaby', 'District of Burnaby', 1952, 1.6, 'black on red', '1952 over BURNABY over the number.',
    { ...cornerHoles, hx: [0.04, 0.96], hy: [0.09, 0.91], bg: '#c8212b', ink: '#1c1512', t: [['1952', 0.5, 0.31, 0.19, { mw: 0.45 }], ['BURNABY', 0.5, 0.6, 0.21, { mw: 0.86 }]], serial: [0.5, 0.9, 0.21, 0.45], grammar: half(1, 2999) }),
  city('chilliwack', 'Chilliwhack', 'Township of Chilliwhack', 1955, 1.73, 'black on yellow', 'TOWNSHIP OF CHILLIWHACK (so spelled), the year beside a large number, MOTOR TRUCK below and 1 HALF stacked at the right. The photographed plate is the 00 specimen.',
    { holes: 'none', bg: '#eeb526', ink: '#1d1a14', t: [['TOWNSHIP OF', 0.4, 0.22, 0.12, { mw: 0.58 }], ['CHILLIWHACK', 0.4, 0.42, 0.15, { mw: 0.72 }], ['1955', 0.2, 0.73, 0.2, { mw: 0.26 }], ['MOTOR TRUCK', 0.4, 0.92, 0.14, { mw: 0.68 }], ['1', 0.88, 0.33, 0.2]],
      stack: [['HALF', 0.88, 0.5, 0.14, 0.11]], serial: [0.54, 0.75, 0.38, 0.3], sdie: OLDSER, grammar: half(1, 999, ['00']) }),
  city('coquitlam', 'Coquitlam', 'District of Coquitlam', 1956, 1.75, 'black on orange', '1956, DIST.COQUITLAM, a white patch reading 1ST beside HALF, and the number small at the bottom (the file is labelled 1959, the plate reads 1956).',
    { ...cornerHoles, bg: '#e2522a', ink: '#1d1512', shapes: [{ kind: 'rect', x: CW * 0.12, y: 103 * 0.53, width: CW * 0.24, height: 103 * 0.18, fill: '#f2f2ee' }],
      t: [['1956', 0.5, 0.25, 0.18, { mw: 0.5, spread: true }], ['DIST.COQUITLAM', 0.5, 0.46, 0.16, { mw: 0.92 }], ['1ST', 0.24, 0.68, 0.12], ['HALF', 0.7, 0.68, 0.13, { mw: 0.3 }]], serial: [0.5, 0.93, 0.16, 0.3], grammar: half() }),
  city('delta', 'Delta', 'Corporation of Delta', 1962, 1.66, 'cream on blue', '1962, DELTA, the number and 2ND.HALF.',
    { ...cornerHoles, hy: [0.13, 0.87], bg: '#2a78c4', ink: '#efe4bf', t: [['1962', 0.5, 0.27, 0.19, { mw: 0.52, spread: true }], ['DELTA', 0.5, 0.51, 0.19, { mw: 0.56, spread: true }], ['2ND.HALF', 0.5, 0.94, 0.17, { mw: 0.84 }]],
      serial: [0.5, 0.72, 0.17, 0.35], grammar: half() }),
  city('langley', 'Langley', 'Township of Langley', 1941, 1.5, 'light blue on black', 'LANGLEY LICENSE over 19 · number · 41 and SECOND HALF.',
    { holes: 'none', bg: '#161616', ink: '#7fb4d8', die: OLD, sdie: OLDSER, t: [['LANGLEY', 0.5, 0.21, 0.14, { mw: 0.76, spread: true }], ['LICENSE', 0.5, 0.39, 0.13, { mw: 0.64 }], ['19', 0.12, 0.69, 0.2], ['41', 0.88, 0.69, 0.2], ['SECOND HALF', 0.5, 0.92, 0.14, { mw: 0.86 }]],
      serial: [0.5, 0.7, 0.3, 0.44], grammar: half(1, 999) }),
  city('maple-ridge', 'Maple Ridge', 'District of Maple Ridge', 1961, 1.66, 'red on mint green', 'VEHICLE, MAPLE RIDGE, 19 · number · 61 and 1ST.HALF.',
    { ...cornerHoles, hx: [0.05, 0.95], hy: [0.12, 0.88], bg: '#7fd0a8', ink: '#c7332a', t: [['VEHICLE', 0.5, 0.24, 0.17, { mw: 0.58, spread: true }], ['MAPLE RIDGE', 0.5, 0.46, 0.17, { mw: 0.88 }], ['19', 0.1, 0.7, 0.17], ['61', 0.9, 0.7, 0.17], ['1ST.HALF', 0.5, 0.93, 0.17, { mw: 0.8 }]],
      serial: [0.5, 0.7, 0.17, 0.35], grammar: half() }),
  city('matsqui', 'Matsqui', 'District of Matsqui', 1957, 1.6, 'cream on dark green', '1957, MATSQUI, the number and 1ST.HALF.',
    { ...cornerHoles, bg: '#1e5a36', ink: '#eee4c4', t: [['1957', 0.5, 0.26, 0.18, { mw: 0.52, spread: true }], ['MATSQUI', 0.5, 0.5, 0.19, { mw: 0.72, spread: true }], ['1ST.HALF', 0.5, 0.93, 0.17, { mw: 0.84 }]],
      serial: [0.5, 0.72, 0.17, 0.33], grammar: half() }),
  city('mission', 'Mission', 'District of Mission', 1952, 1.73, 'black on light blue', '1952, MISSION, the number and 1ST.HALF.',
    { ...cornerHoles, hx: [0.04, 0.96], hy: [0.12, 0.88], bg: '#5cc3e8', ink: '#1a2a33', t: [['1952', 0.5, 0.26, 0.19, { mw: 0.52, spread: true }], ['MISSION', 0.5, 0.5, 0.2, { mw: 0.84, spread: true }], ['1ST.HALF', 0.5, 0.93, 0.17, { mw: 0.86 }]],
      serial: [0.5, 0.72, 0.17, 0.35], grammar: half() }),
  { ...city('nanaimo', 'Nanaimo', 'City of Nanaimo', 1946, 1.3, 'black on bare aluminium', 'A stepped die-cut aluminium plate: NANAIMO, LICENSED VEHICLE, FEE $1.00, the number and 1946.',
    { shell: 'step', holes: 'none', bg: '#cfcdc6', ink: '#1a1a1a', die: OLD, t: [['NANAIMO', 0.5, 0.25, 0.14, { mw: 0.56 }], ['LICENSED VEHICLE', 0.5, 0.38, 0.08, { mw: 0.62 }], ['1946', 0.5, 0.93, 0.09, { mw: 0.22 }]],
      f: [['FEE $1.00', 0.5, 0.47, 0.07, { font: 'serif', weight: 800 }]], serial: [0.5, 0.78, 0.22, 0.34, 'serif'], grammar: half() }), w: 150, h: 115,
    description: `Issued by the City of Nanaimo (not the province) for licensed vehicles: a stepped die-cut aluminium plate reading NANAIMO / LICENSED VEHICLE / FEE $1.00 / number / 1946. The fee line and the serif numerals use typeface stand-ins. Size not documented; drawn 150 × 115 mm, estimated from photo proportions.` },
  city('new-westminster', 'New Westminster', 'City of New Westminster', 1946, 1.6, 'black on orange-red', 'CITY OF, the number, NEW WESTMINSTER and – 1946 –, with 1ST and HALF turned on their sides at left and right.',
    { holes: 'none', bg: '#d9502a', ink: '#2a1a14', die: OLD, sdie: OLDSER, t: [['CITY OF', 0.52, 0.29, 0.15, { mw: 0.5 }], ['NEW WESTMINSTER', 0.5, 0.75, 0.15, { mw: 0.9 }], ['- 1946 -', 0.5, 0.93, 0.14, { mw: 0.56, spread: true }]],
      rot: [['1ST', 0.09, 0.35, 0.13, -1], ['HALF', 0.92, 0.33, 0.13, 1]], serial: [0.52, 0.55, 0.22, 0.4], grammar: half() }),
  city('north-vancouver', 'North Vancouver', 'City of North Vancouver', 1935, 1.66, 'yellow on dark teal', 'CITY OF, the number, NORTH VANCOUVER and – 1935 –, with SECOND and HALF turned on their sides.',
    { ...cornerHoles, hx: [0.03, 0.97], hy: [0.08, 0.92], bg: '#1f4a4e', ink: '#d8b93a', die: OLD, sdie: OLDSER, t: [['CITY OF', 0.53, 0.26, 0.15, { mw: 0.5 }], ['NORTH VANCOUVER', 0.5, 0.74, 0.15, { mw: 0.9 }], ['- 1935 -', 0.5, 0.93, 0.14, { mw: 0.56, spread: true }]],
      rot: [['SECOND', 0.07, 0.36, 0.1, -1], ['HALF', 0.93, 0.28, 0.12, 1]], serial: [0.5, 0.53, 0.22, 0.3], grammar: half() }),
  city('port-alberni', 'Port Alberni', 'City of Port Alberni', 1955, 1.6, 'cream on red', 'PT.ALBERNI (with a small raised T), the number and VEHICLE, with 1955 turned up the left side.',
    { holes: 'none', bg: '#c8242c', ink: '#efe0b8', rot: [['1955', 0.09, 0.5, 0.14, -1]],
      t: [['P', 0.19, 0.3, 0.19, { anchor: 'start' }], ['T', 0.28, 0.23, 0.12, { anchor: 'start' }], ['.ALBERNI', 0.34, 0.3, 0.19, { anchor: 'start', mw: 0.6 }], ['VEHICLE', 0.57, 0.92, 0.24, { mw: 0.7, spread: true }]],
      serial: [0.57, 0.62, 0.18, 0.3], grammar: half() }),
  city('port-coquitlam', 'Port Coquitlam', 'City of Port Coquitlam', 1956, 1.5, 'red on cream', 'CITY OF PORT COQUITLAM, 19 · number · 56 and SECOND HALF. The photographed plate is the 00 specimen.',
    { holes: 'none', bg: '#f3ecd2', ink: '#cc2229', t: [['CITY OF', 0.5, 0.22, 0.12, { mw: 0.45, spread: true }], ['PORT COQUITLAM', 0.5, 0.4, 0.13, { mw: 0.84 }], ['19', 0.13, 0.72, 0.2], ['56', 0.87, 0.72, 0.2], ['SECOND HALF', 0.5, 0.93, 0.14, { mw: 0.86 }]],
      serial: [0.5, 0.74, 0.32, 0.46], grammar: half(1, 999, ['00']) }),
  city('port-moody', 'Port Moody', 'City of Port Moody', 1958, 1.95, 'dark green on yellow', 'The year stacked at the left behind a rule, VEHICLE, SECOND · number · HALF and PORT MOODY (file labelled 1959, plate reads 1958).',
    { holes: 'slots', hx: [0.2, 0.86], hy: [0.07, 0.93], bg: '#f1c21e', ink: '#1e5e3a', stack: [['1958', 0.055, 0.25, 0.22, 0.16]], rules: [[0.11, 0.1, 0.9]],
      t: [['VEHICLE', 0.56, 0.32, 0.2, { mw: 0.52, spread: true }], ['SECOND', 0.27, 0.6, 0.15, { mw: 0.22 }], ['HALF', 0.84, 0.6, 0.15, { mw: 0.16 }], ['PORT MOODY', 0.56, 0.92, 0.19, { mw: 0.7 }]],
      serial: [0.56, 0.63, 0.28, 0.32], grammar: half() }),
  city('powell-river', 'Powell River', 'District of Powell River', 1961, 1.6, 'white on black', '1961 turned down the left side behind a rule, POWELL RIVER, the number and 1ST HALF. The photographed plate is the 000 specimen.',
    { holes: 'slots', hx: [0.5, 0.74], hy: [0.07], bg: '#151515', ink: '#efefe8', rules: [[0.16, 0.1, 0.9]], rot: [['1961', 0.09, 0.5, 0.15, 1]],
      t: [['POWELL RIVER', 0.58, 0.27, 0.15, { mw: 0.72 }], ['1ST HALF', 0.58, 0.9, 0.17, { mw: 0.56 }]], serial: [0.58, 0.67, 0.31, 0.5], grammar: half(1, 999, ['000']) }),
  city('prince-george', 'Prince George', 'City of Prince George', 1959, 1.6, 'pale blue on maroon', '1959 turned up the left side, broad rounded PRINCE / GEORGE above a small serif number, and taller VEHICLE below. Source-specific component constructions; manufacturer and other years remain unconfirmed.',
    { ...cornerHoles, hx: [0.065, 0.94], hy: [0.105, 0.895], bg: '#7a2529', ink: '#9acdcc', die: 'municipal-prince-george-digits', sdie: 'municipal-prince-george-digits', rot: [['1959', 0.14, 0.51, 0.2, -1]],
      t: [['PRINCE', 0.60, 0.20, 0.115, { die: 'municipal-prince-george-wide', mw: 0.56 }], ['GEORGE', 0.60, 0.37, 0.13, { die: 'municipal-prince-george-wide', mw: 0.67 }], ['VEHICLE', 0.60, 0.86, 0.19, { die: 'municipal-prince-george-tall', mw: 0.67 }]], serial: [0.60, 0.60, 0.16, 0.3], grammar: half(1,999,['000']) }),
  city('prince-george-1962', 'Prince George', 'City of Prince George', 1962, 1.7, 'pale lettering on green', '1962 across the top, a single narrower PRINCE GEORGE line, small serif number and spaced VEHICLE. The photographed plate is damaged; its broken lower-left edge is not reproduced. This is a distinct layout and component-size comparison, not proof of a maker or tooling transition.',
    { ...cornerHoles, hx:[0.085,0.915],hy:[0.15,0.84],bg:'#247e65',ink:'#d6dfd5',sdie:'municipal-prince-george-digits',
      t:[['1962',0.5,0.25,0.145,{die:'municipal-prince-george-digits',mw:0.48,spread:true}],['PRINCE GEORGE',0.5,0.52,0.145,{die:'municipal-prince-george-tall',mw:0.89}],['VEHICLE',0.5,0.92,0.16,{die:'municipal-prince-george-tall',mw:0.72,spread:true}]],serial:[0.5,0.71,0.15,0.3],grammar:half() }),
  city('richmond', 'Richmond', 'Township of Richmond', 1959, 1.7, 'white on dark blue', '1959, RICHMOND, the number and 2ND.HALF.',
    { ...cornerHoles, bg: '#1e3a5c', ink: '#e8e4d8', t: [['1959', 0.5, 0.25, 0.17, { mw: 0.52, spread: true }], ['RICHMOND', 0.5, 0.49, 0.17, { mw: 0.78 }], ['2ND.HALF', 0.5, 0.93, 0.17, { mw: 0.8 }]],
      serial: [0.5, 0.71, 0.16, 0.3], grammar: half() }),
  city('saanich', 'Saanich', 'District of Saanich', 1960, 2.1, 'yellow on red', 'The year stacked at the left, VEHICLE, 1ST · number · HALF and SAANICH.',
    { holes: 'slots', hx: [0.2, 0.86], hy: [0.07, 0.93], bg: '#c8232a', ink: '#efc23a', stack: [['1960', 0.045, 0.24, 0.22, 0.15]], rules: [[0.085, 0.1, 0.9]],
      t: [['VEHICLE', 0.57, 0.31, 0.19, { mw: 0.5, spread: true }], ['1ST', 0.2, 0.58, 0.13], ['HALF', 0.85, 0.58, 0.13, { mw: 0.14 }], ['SAANICH', 0.55, 0.9, 0.18, { mw: 0.54, spread: true }]],
      serial: [0.53, 0.64, 0.28, 0.32], grammar: half() }),
  city('sumas', 'Sumas', 'District of Sumas', 1962, 1.66, 'black on pale yellow', '1962, DIST.SUMAS, the number and 1ST.HALF.',
    { ...cornerHoles, bg: '#f1f5b8', ink: '#1c1c1c', t: [['1962', 0.5, 0.25, 0.18, { mw: 0.52, spread: true }], ['DIST.SUMAS', 0.5, 0.49, 0.18, { mw: 0.84 }], ['1ST.HALF', 0.5, 0.93, 0.17, { mw: 0.84 }]],
      serial: [0.5, 0.71, 0.16, 0.3], grammar: half() }),
  city('surrey', 'Surrey', 'District of Surrey', 1936, 1.5, 'black on orange', 'SURREY LICENSE over 19 · number · 36 and SECOND HALF.',
    { holes: 'none', bg: '#e8702a', ink: '#121212', die: OLD, sdie: OLDSER, t: [['SURREY', 0.5, 0.2, 0.14, { mw: 0.78, spread: true }], ['LICENSE', 0.5, 0.37, 0.12, { mw: 0.64 }], ['19', 0.13, 0.71, 0.2], ['36', 0.87, 0.71, 0.2], ['SECOND HALF', 0.5, 0.93, 0.14, { mw: 0.88 }]],
      serial: [0.5, 0.74, 0.33, 0.42], grammar: half() }),
  city('trail', 'Trail', 'City of Trail', 1938, 1.6, 'red on black', 'EXPRESS & DRAY LICENSE, the number and TRAIL-B.C., with the year stacked at the left behind a rule. The ampersand line uses a typeface stand-in; the photographed plate is the 00 specimen.',
    { holes: 'none', bg: '#151515', ink: '#c8272a', stack: [['1938', 0.085, 0.28, 0.19, 0.15]], rules: [[0.16, 0.08, 0.92]],
      f: [['EXPRESS & DRAY', 0.58, 0.23, 0.15, { width: 0.72 }]], t: [['LICENSE', 0.58, 0.39, 0.12, { mw: 0.44 }], ['TRAIL-B.C.', 0.58, 0.93, 0.15, { mw: 0.72 }]],
      serial: [0.58, 0.73, 0.32, 0.5], grammar: half(1, 999, ['00']) }),
  city('victoria', 'Victoria', 'City of Victoria', 1958, 1.9, 'black on bare metal', 'VICTORIA,B.C. over CAB and the number, a class letter A at left and 1958 stacked at right between rules; a flat-stamped control number sits below.',
    { holes: 'slots', hx: [0.2, 0.8], hy: [0.06, 0.94], bg: '#d3d3cf', ink: '#111a33', f: [['VICTORIA,B.C.', 0.5, 0.3, 0.15, { width: 0.6 }]],
      t: [['A', 0.07, 0.6, 0.15], ['66208', 0.46, 0.85, 0.11, { mw: 0.3, spread: true, color: '#8d8d88' }]], stack: [['1958', 0.93, 0.28, 0.18, 0.13]], rules: [[0.13, 0.15, 0.85], [0.86, 0.15, 0.85]],
      serial: [0.5, 0.66, 0.26, 0.64], grammar: { blocks: [{ pattern: 'C\\AB 9' }, { pattern: 'C\\AB 99' }, { pattern: 'C\\AB 999' }], hint: 'CAB 1–999' } }),
  city('west-vancouver', 'West Vancouver', 'District of West Vancouver', 1961, 2.3, 'green on white', 'The year stacked at the left, VEHICLE, 1ST · number · HALF and WEST VANCOUVER.',
    { holes: 'none', bg: '#f0f1ee', ink: '#1d6a3a', stack: [['1961', 0.045, 0.25, 0.22, 0.16]], rules: [[0.09, 0.1, 0.9]],
      t: [['VEHICLE', 0.57, 0.31, 0.2, { mw: 0.56, spread: true }], ['1ST', 0.2, 0.6, 0.14], ['HALF', 0.85, 0.6, 0.13, { mw: 0.14 }], ['WEST VANCOUVER', 0.56, 0.9, 0.18, { mw: 0.82 }]],
      serial: [0.52, 0.65, 0.29, 0.3], grammar: half() }),
];

// ── City of Vancouver categories ────────────────────────────────────────────
const VW = 180;
function van(id: string, label: string, year: number, aspect: number, what: string, rest: Omit<Spec, 'id' | 'family' | 'label' | 'period' | 'era' | 'source' | 'w' | 'h' | 'description'> & { w?: number; description?: string }): Spec {
  const w = rest.w ?? VW, h = Math.round(w / aspect);
  return { id: `vancouver-${id}`, family: 'municipal', label: `Vancouver · ${label}`, period: [year, year], era: 'municipal-vancouver', source: VAN, w, h,
    description: `Issued by the City of Vancouver (not the province). ${what} The Vancouver gallery has no text: one photographed plate is reproduced. ${EST(w, h)}`, ...rest };
}
/** Year stacked at the left behind a rule, category over number over VANCOUVER. */
function vanSide(id: string, label: string, year: number, aspect: number, bg: string, ink: string, category: string, what: string, extra: Partial<Spec> = {}): Spec {
  return van(id, `${label} · ${year}`, year, aspect, what, {
    holes: 'slots', hx: [0.14, 0.86], hy: [0.06, 0.94], bg, ink, stack: [[String(year), 0.055, 0.26, 0.21, 0.15]], rules: [[0.105, 0.12, 0.88]],
    t: [[category, 0.56, 0.28, 0.15, { mw: 0.78 }], ['VANCOUVER', 0.56, 0.89, 0.16, { mw: 0.68, spread: true }]], serial: [0.56, 0.64, 0.28, 0.5], grammar: nums(9999), ...extra });
}
const centennialMunicipalBase = {holes: 'slots' as const,hx:[0.11,0.89],hy:[0.10,0.88],bg:'#f2f3ec',sdie:'municipal-vancouver-embossed',serialColor:'#165fa8',rimColor:'#2483b0',rim:2,
  extraArt:[{art:'municipal-vancouver-centennial-base',x:0,y:0,width:180,height:105,role:'screened-centennial-base'}],
  shapes:[{kind:'line' as const,x1:5,y1:20,x2:175,y2:20,stroke:'#2483b0',strokeWidth:.5}],};
function centennialBandPalettes(first:'blue'|'green'):KitPalette[]{const p=[{id:'green',label:'Green band · photographed 1986/1995/1996',background:'#f2f3ec',ink:'#45b52b'},{id:'blue',label:'Blue band · photographed 1997 taxi',background:'#f2f3ec',ink:'#3a8ad8'}];return first==='green'?p:p.reverse();}
function cityRenewalPanel(category:string,year:string,color:string,h:number):KitPanel{return {x:180*.27,y:h*.75,width:180*.46,height:h*.21,background:color,ink:'#fff9e9',radius:.6,role:'city-decal',texts:[
 {text:'CITY OF VANCOUVER',x:180*.23,baseline:h*.058,cap:h*.037,die:LEG,role:'city-decal-title'},
 {text:category,x:180*.23,baseline:h*.107,cap:h*.037,die:LEG,role:'city-decal-category'},
 {text:year,x:180*.13,baseline:h*.183,cap:h*.058,die:LEG,role:'decal-year'}]};}
const vancouver: Spec[] = [
  van('disc-1919', 'Vehicle License disc · 1919', 1919, 1, 'A round aluminium disc: VEHICLE arched over LICENSE, the number, VANCOUVER and 1919.',
    { w: 110, shell: 'oval', rim: null, holes: 'round', hx: [0.07, 0.93], hy: [0.5], bg: '#bdbdb7', ink: '#2a2a2a', die: OLD, sdie: OLDSER, arc: [['VEHICLE', 0.5, 0.5, 0.33, 0.12, 'top']],
      t: [['LICENSE', 0.5, 0.38, 0.1, { mw: 0.44 }], ['VANCOUVER', 0.5, 0.78, 0.1, { mw: 0.5 }], ['1919', 0.5, 0.91, 0.09, { mw: 0.3 }]], serial: [0.5, 0.62, 0.2, 0.74, 'serif'], grammar: nums(9999) }),
  van('disc-1931', 'Vehicle License disc · 1931', 1931, 1, 'A round aluminium disc with a raised rim: VEHICLE arched over the top, LICENSE, the number in a raised box, 1931 and VANCOUVER arched along the bottom.',
    { w: 110, shell: 'oval', rim: 2, holes: 'round', hx: [0.08, 0.92], hy: [0.5], bg: '#c9c9c4', ink: '#151515', die: OLD, sdie: OLDSER,
      arc: [['VEHICLE', 0.5, 0.5, 0.33, 0.14, 'top'], ['VANCOUVER', 0.5, 0.5, 0.39, 0.11, 'bottom']],
      shapes: [{ kind: 'rect', x: 110 * 0.2, y: 110 * 0.43, width: 110 * 0.6, height: 110 * 0.18, rx: 2, strokeWidth: 1.4 }],
      t: [['LICENSE', 0.5, 0.385, 0.09, { mw: 0.44 }], ['1931', 0.5, 0.72, 0.08, { mw: 0.24 }]], serial: [0.5, 0.585, 0.13, 0.54], grammar: nums(9999) }),
  van('vehicle-1950', 'Vehicle License · 1950', 1950, 2.4, 'VEHICLE LICENSE over the number and VANCOUVER, with 1950 turned up the left side.',
    { holes: 'slots', hx: [0.14, 0.86], hy: [0.07, 0.93], bg: '#1e3f7a', ink: '#e2b02a', rot: [['1950', 0.05, 0.5, 0.12, -1]],
      t: [['VEHICLE LICENSE', 0.53, 0.3, 0.15, { mw: 0.8 }], ['VANCOUVER', 0.53, 0.9, 0.16, { mw: 0.66, spread: true }]], serial: [0.53, 0.68, 0.33, 0.5], grammar: nums(9999) }),
  vanSide('vehicle-1962', 'Vehicle', 1962, 2.3, '#a9d4c4', '#f2f2ee', 'VEHICLE', 'White on pale green: the year stacked behind a rule at the left, VEHICLE, the number and VANCOUVER.'),
  vanSide('conveyance-1947', 'Conveyance License', 1947, 2.3, '#5d8a48', '#3f6a30', 'CONVEYANCE LICENSE', 'Green on green: the year stacked at the left, CONVEYANCE LICENSE, the number and VANCOUVER.'),
  vanSide('conveyance-1958', 'Conveyance', 1958, 2.3, '#141821', '#f0f0ea', 'CONVEYANCE', 'White on black: the year stacked at the left, CONVEYANCE, the number and VANCOUVER.'),
  van('express-dray-1912', 'Express & Dray · 1912', 1912, 1.95, 'Brass: EXPRESS & DRAY over the number and VANCOUVER.B.C., with LICENSE turned up the left side and 1912 down the right. The ampersand line uses a typeface stand-in.',
    { holes: 'none', bg: '#8f7c4c', ink: '#3a3222', die: OLD, sdie: OLDSER, rot: [['LICENSE', 0.055, 0.5, 0.11, -1], ['1912', 0.945, 0.5, 0.11, 1]],
      f: [['EXPRESS & DRAY', 0.5, 0.28, 0.21, { width: 0.76, weight: 600 }]], t: [['VANCOUVER.B.C.', 0.5, 0.9, 0.13, { mw: 0.76 }]], serial: [0.5, 0.67, 0.3, 0.4], grammar: nums(999) }),
  van('express-dray-1934', 'Express & Dray · 1934', 1934, 1.45, 'Dark green on black: EXPRESS & DRAY LICENSE, the number and VANCOUVER, with 1934 stacked at the left behind a rule. The ampersand line uses a typeface stand-in.',
    { holes: 'none', bg: '#121614', ink: '#2e5a40', die: OLD, sdie: OLDSER, stack: [['1934', 0.07, 0.3, 0.2, 0.13]], rules: [[0.13, 0.08, 0.92]],
      f: [['EXPRESS & DRAY', 0.56, 0.2, 0.13, { width: 0.74 }]], t: [['LICENSE', 0.56, 0.35, 0.11, { mw: 0.6 }], ['VANCOUVER', 0.56, 0.92, 0.13, { mw: 0.74 }]], serial: [0.56, 0.74, 0.34, 0.6], grammar: nums(999) }),
  van('auto-taxi-1923', 'Auto & Taxi License · 1923', 1923, 1.3, 'Die-cut aluminium, a disc with square side wings: AUTO & TAXI arched over LICENSE, the number and VANCOUVER arched below, with 1923 stacked on each wing.',
    { w: 150, shell: 'taxi', holes: 'round', hx: [0.03, 0.97], hy: [0.4], bg: '#c7c7c2', ink: '#1a1a1a', die: OLD,
      arc: [['AUTO & TAXI', 0.5, 0.5, 0.36, 0.12, 'top'], ['VANCOUVER', 0.5, 0.5, 0.41, 0.1, 'bottom']],
      stack: [['1923', 0.1, 0.36, 0.1, 0.075], ['1923', 0.9, 0.36, 0.1, 0.075]], t: [['LICENSE', 0.5, 0.38, 0.09, { mw: 0.3 }]], serial: [0.5, 0.7, 0.24, 0.42, 'serif'], grammar: nums(999) }),
  van('taxi-1956', 'Taxi Cab · 1956', 1956, 1.75, 'TAXI CAB over a letter-prefixed number and VANCOUVER-B.C., with 1956 stacked between rules on both sides. Small flat-stamped control numbers beside the number are not drawn.',
    { holes: 'none', bg: '#e3e3dc', ink: '#1a1a1a', stack: [['1956', 0.055, 0.28, 0.19, 0.14], ['1956', 0.945, 0.28, 0.19, 0.14]], rules: [[0.11, 0.12, 0.88], [0.89, 0.12, 0.88]],
      t: [['TAXI CAB', 0.5, 0.27, 0.15, { mw: 0.46 }], ['VANCOUVER-B.C.', 0.5, 0.86, 0.14, { mw: 0.66 }]], serial: [0.5, 0.62, 0.27, 0.56],
      grammar: { blocks: [{ pattern: 'D 9' }, { pattern: 'D 99' }, { pattern: 'D 999' }], hint: 'D 1–999 (D prefix as photographed)' } }),
  van('taxi-1996', 'Taxi Cab · centennial base · 1996 decal', 1996, 1.75, 'The clear 1996 TAXI CAB specimen 1071 uses green centennial bands, a blue screened category heading and separate embossed blue serial tooling. A red 1996 renewal decal covers the underlying Vancouver 100 emblem. Blue and green bands are colour alternatives, not inferred manufacture years.',
    { ...centennialMunicipalBase, w:180,ink:'#45b52b',
      t:[['TAXI CAB',0.5,0.18,0.115,{die:'municipal-vancouver-frankfurter',mw:0.54,color:'#2483b0',screened:true}]],
      palettes:centennialBandPalettes('green'),panels:[cityRenewalPanel('TAXICAB','1996','#c82224',103)],
      serial:[0.5,0.49,0.25,0.55],grammar:nums(9999) }),
  van('taxi-1997', 'Taxi Cab · centennial base · 1997 decal', 1997, 1.75, 'Frankfurter-style TAXI CAB and VANCOUVER are screened words; the separate embossed numeral tooling is not the Expo alphabet. Blue-band 1997 photograph and green-band 1996 photograph support selectable band colours, not a year-to-colour rule. Vancouver 100 remains on the base underneath the renewal decal.',
    { ...centennialMunicipalBase, w: 180, ink: '#3a8ad8',
      t: [['TAXI CAB', 0.5, 0.18, 0.115, {die: 'municipal-vancouver-frankfurter', mw: 0.54, color: '#2c9b89', screened: true}]],
      palettes: centennialBandPalettes('blue'), panels: [cityRenewalPanel('TAXICAB','1997','#1f643b',103)],
      serial: [0.43, 0.49, 0.25, 0.55], grammar: nums(9999) }),
  van('for-hire-1949', 'Vehicle for Hire · 1949', 1949, 2.35, 'White on brown: VEHICLE FOR HIRE, the number and VANCOUVER, with the year stacked at the right behind a rule.',
    { holes: 'slots', hx: [0.14, 0.86], hy: [0.06, 0.94], bg: '#3a2218', ink: '#efeae0', stack: [['1949', 0.945, 0.26, 0.21, 0.15]], rules: [[0.895, 0.12, 0.88]],
      t: [['VEHICLE FOR HIRE', 0.44, 0.28, 0.15, { mw: 0.76 }], ['VANCOUVER', 0.44, 0.89, 0.16, { mw: 0.66, spread: true }]], serial: [0.44, 0.64, 0.3, 0.5], grammar: nums(999) }),
  vanSide('for-hire-1970', 'Vehicle for Hire', 1970, 2.35, '#3dbb4a', '#1d4a2a', 'VEHICLE FOR HIRE', 'Dark green on green: the year stacked at the left, VEHICLE FOR HIRE, the number and VANCOUVER.'),
  van('for-hire-1986', 'Vehicle for Hire · centennial blank base', 1986, 1.72, 'Blank centennial base photographed with rounded screened Vehicle for Hire and VANCOUVER words, enlarged V/R descenders, green striping and the Vancouver 100 emblem. Frankfurter Std Medium is a visual match; historical production typeface and full lifespan unconfirmed. The blank source has no embossed serial or renewal decal.',
    { ...centennialMunicipalBase, ink: '#45b52b', t: [['Vehicle for Hire',0.5,0.18,0.118,{die:'municipal-vancouver-frankfurter',mw:0.60,color:'#2483b0',screened:true}]],palettes:centennialBandPalettes('green'),serial:[0.52,0.48,0.26,0.52],grammar:NO_SERIAL }),
  van('for-hire-1995', 'Vehicle for Hire · centennial base · 1995 decal', 1995, 1.95, 'Rounded Vehicle for Hire and VANCOUVER inscriptions use outlined Frankfurter Std Medium; this is a visual font-family match, not documented original tooling. Separate blue embossed serials follow the municipal specimens. The orange 1995 renewal decal covers the Vancouver 100 emblem on the underlying base. Green and blue bands are selectable photographed alternatives, without inferred year rules. Pencilled owner notes are omitted.',
    { ...centennialMunicipalBase, ink: '#45b52b',
      shapes: [{kind:'line',x1:5,y1:17.5,x2:175,y2:17.5,stroke:'#2483b0',strokeWidth:.5}],
      t: [['Vehicle for Hire',0.5,0.18,0.118,{die:'municipal-vancouver-frankfurter',mw:0.60,color:'#2483b0',screened:true}]],
      palettes:centennialBandPalettes('green'), panels:[cityRenewalPanel('VEHICLE FOR HIRE','1995','#e98b18',92)],
      serial:[0.52,0.49,0.25,0.52],grammar:nums(9999) }),
  vanSide('commercial-1972', 'Commercial Permit', 1972, 1.95, '#f0c21e', '#2a2a1a', 'COMMERCIAL PERMIT', 'Black on yellow on a raised inner panel: the year stacked at the left, COMMERCIAL PERMIT, the number and VANCOUVER.',
    { shapes: [{ kind: 'rect', x: 180 * 0.04, y: 92 * 0.14, width: 180 * 0.92, height: 92 * 0.72, rx: 4, strokeWidth: 1.2 }] }),
  vanSide('commercial-1982', 'Commercial Permit', 1982, 1.9, '#2a4d9a', '#ee6a24', 'COMMERCIAL PERMIT', 'Orange on blue: the year stacked at the left behind a rule, COMMERCIAL PERMIT, the number and VANCOUVER. Vancouver’s commercial permits were kept after the 1987 provincial CVLD decal (By-Law No. 4021).',
    { shapes: [{ kind: 'rect', x: 180 * 0.03, y: 95 * 0.14, width: 180 * 0.94, height: 95 * 0.72, rx: 4, strokeWidth: 1.2 }] }),
  { ...van('commercial-1993', 'Commercial Permit · 1993–94', 1993, 1.75, 'COMMERCIAL PERMIT over the number and “VANCOUVER, B.C.”, the year stacked at the left behind a rule (1993 black on yellow, 1994 white on green). The comma line uses a typeface stand-in.',
    { holes: 'slots', hx: [0.14, 0.86], hy: [0.06, 0.94], bg: '#f0b21e', ink: '#1a1a22', stack: [['1993', 0.075, 0.24, 0.2, 0.15]], rules: [[0.14, 0.1, 0.9]],
      t: [['COMMERCIAL PERMIT', 0.57, 0.24, 0.13, { mw: 0.78 }]], f: [['VANCOUVER, B.C.', 0.57, 0.88, 0.15, { width: 0.72 }]], serial: [0.57, 0.63, 0.26, 0.5], grammar: nums(9999) }), period: [1993, 1994] },
  van('commercial-1994', 'Commercial Permit · 1994', 1994, 2, 'White on green version of the 1993 layout with “VANCOUVER, B.C.” (typeface stand-in).',
    { holes: 'slots', hx: [0.14, 0.86], hy: [0.06, 0.94], bg: '#1f5a3a', ink: '#f2f2ee', stack: [['1994', 0.075, 0.26, 0.2, 0.15]], rules: [[0.12, 0.1, 0.9]],
      t: [['COMMERCIAL PERMIT', 0.56, 0.25, 0.13, { mw: 0.72 }]], f: [['VANCOUVER, B.C.', 0.56, 0.86, 0.14, { width: 0.62 }]], serial: [0.56, 0.62, 0.27, 0.5], grammar: nums(9999) }),
  van('commercial-2004', 'Commercial Permit · 2004 flat', 2004, 1.55, 'Flat black on white: COMMERCIAL PERMIT in a serif over the number, VANCOUVER B.C. small at bottom left and the red “City of Vancouver 2004” decal at bottom right. Serif lettering and numerals use typeface stand-ins.',
    { holes: 'slots', hx: [0.14, 0.86], hy: [0.06, 0.94], flat: true, bg: '#f0f0ee', ink: '#111111', rim: 2,
      f: [['COMMERCIAL PERMIT', 0.5, 0.22, 0.12, { font: 'serif', width: 0.82 }], ['VANCOUVER', 0.14, 0.85, 0.06], ['B.C.', 0.1, 0.92, 0.06]],
      panels: [{ x: 180 * 0.3, y: 116 * 0.76, width: 180 * 0.44, height: 116 * 0.2, background: '#d8222a', ink: '#ffffff', radius: 1, role: 'city-decal',
        texts: [{ text: '2004', x: 180 * 0.12, baseline: 116 * 0.16, cap: 116 * 0.07, die: LEG, role: 'decal-year' }] }],
      serial: [0.5, 0.64, 0.34, 0.6, 'serif'], grammar: nums(9999) }),
  vanSide('junk-1965', 'Junk Peddler', 1965, 2.3, '#ece6c8', '#2a6a4a', 'JUNK PEDDLER', 'Green on cream: the year stacked at the left, JUNK PEDDLER, the number and VANCOUVER.', { grammar: nums(99) }),
  van('junk-1989', 'Junk Peddler · 1989', 1989, 1.75, 'Black on green: the year stacked at the left behind a rule and a second rule at right, JUNK PEDDLER, the number and “VANCOUVER, B.C.” (typeface stand-in for the comma line).',
    { holes: 'slots', hx: [0.14, 0.86], hy: [0.06, 0.94], bg: '#3a8a5a', ink: '#121a14', stack: [['1989', 0.075, 0.24, 0.2, 0.15]], rules: [[0.14, 0.1, 0.9], [0.93, 0.1, 0.9]],
      t: [['JUNK PEDDLER', 0.54, 0.24, 0.14, { mw: 0.66 }]], f: [['VANCOUVER, B.C.', 0.54, 0.9, 0.14, { width: 0.7 }]], serial: [0.54, 0.64, 0.3, 0.4], grammar: nums(99) }),
  vanSide('funeral-cab-1983', 'Funeral Cab', 1983, 1.8, '#d8343a', '#f4f0ea', 'FUNERAL CAB', 'White on red: 1983 stacked at the left, FUNERAL CAB, the number and VANCOUVER.', { grammar: nums(99) }),
];

// ── Victoria 1913 hired-vehicle porcelain and the Tahsis Company plate ──────
const victoria1913: Spec = {
  id: 'victoria-1913', family: 'municipal', label: 'Victoria · 1913 hired vehicle porcelain', period: [1913, 1914], era: 'municipal-city',
  source: page('Guinness.html', 'Victoria 1913 hired vehicle plate'), w: 203, h: 127, radius: 3, rim: null, flat: true, holes: 'slots', hx: [0.38, 0.62], hy: [0.09],
  bg: '#ebeff6', ink: '#1a1a1a', sdie: 'bc-porcelain-1914',
  shapes: [{ kind: 'line', x1: 203 * 0.17, y1: 2, x2: 203 * 0.17, y2: 125, strokeWidth: 1.6 }, { kind: 'line', x1: 203 * 0.83, y1: 2, x2: 203 * 0.83, y2: 125, strokeWidth: 1.6 },
    ...[[0.03, 0.05], [0.97, 0.05], [0.03, 0.95], [0.97, 0.95]].map(([x, y]): KitShape => ({ kind: 'circle', cx: 203 * x, cy: 127 * y, r: 2.4, fill: '#2a2a2a', stroke: '#9a9a90', strokeWidth: 0.8 }))],
  stack: [['LIC.', 0.085, 0.19, 0.12, 0.1], ['VEH.', 0.085, 0.69, 0.12, 0.1], ['VICTORIA', 0.915, 0.15, 0.113, 0.09]],
  extraArt: [{ art: 'municipal-victoria-seal', x: 203 * 0.5 - 14, y: 127 * 0.04, width: 28, height: 28, color: '#1a1a1a' }],
  serial: [0.5, 0.93, 0.6, 0.5], grammar: nums(500),
  description: 'Issued by the City of Victoria (not the province) for hired vehicles — taxis, hacks, express wagons and carriages: 500 plates received in February 1913 and possibly used again in 1914. White porcelain on heavy steel by McClary Manufacturing, 8 × 5 in (203 × 127 mm) with 3-inch black numerals, the city arms above the number, LIC. VEH. and VICTORIA stacked in the side panels. The city seal is a simplified drawing. Briefly listed by Guinness in 2010 as the world’s oldest licence plate.',
  note: 'Porcelain plate reconstructed from BCpl8s photographs; documented size 8 × 5 in, seal artwork simplified, numeral die approximated with the 1914 porcelain die.',
};
const tahsis: Spec = {
  id: 'tahsis-1966', family: 'municipal', label: 'Tahsis Company · 1966', period: [1966, 1967], era: 'municipal-city', source: CITY,
  w: 180, h: 106, ...cornerHoles, bg: '#f2efe8', ink: '#c82828',
  t: [['TAHSIS', 0.5, 0.31, 0.19, { mw: 0.6, spread: true }], ['19', 0.12, 0.62, 0.16], ['66', 0.88, 0.62, 0.16], ['B.C.', 0.5, 0.86, 0.2, { mw: 0.34 }]], serial: [0.5, 0.56, 0.17, 0.3],
  grammar: nums(999),
  description: `Issued by the Tahsis Company, a private logging company (neither a municipality nor the province): it “did keep track of vehicles operating on its road by issuing its own form of licence plate”, renewed the next year with a small brass tab. Red on white, TAHSIS over 19 · number · 66 and B.C. ${EST(180, 106)}`,
};

// ── Bicycle plates ──────────────────────────────────────────────────────────
function cycle(id: string, town: string, label: string, rest: Omit<Spec, 'id' | 'family' | 'label'>): Spec {
  return { id: `${id}`, family: 'bicycle', label: `${town} · ${label}`, ...rest };
}
const MFR = 'Maker possibly George Hewitt Co. (unconfirmed on the page).';
const bikeDesc = (issuer: string, what: string, size: string, extra = '') => `Bicycle licence issued by the ${issuer} (a municipal issue, not provincial). ${what} ${size} ${extra}`.trim();
const tbd = (w: number, h: number) => `The page leaves the size unresolved (TBD); drawn ${w} × ${h} mm, estimated from photo proportions.`;
const docSize = (w: number, h: number, material: string) => `${w} × ${h} mm, ${material}.`;

const bicycles: Spec[] = [
  cycle('cranbrook', 'Cranbrook', '1948–72', { period: [1948, 1972], era: 'bicycle-early', source: bike('Cranbrook', 'Cranbrook'), w: 130, h: 80, holes: 'round', hx: [0.2], hy: [0.53], bg: '#efe6c8', ink: '#2a5a3a', rim: 2,
    t: [['BICYCLE', 0.3, 0.27, 0.17, { mw: 0.4 }], ['{yyyy}', 0.8, 0.27, 0.17, { mw: 0.26 }], ['CRANBROOK', 0.5, 0.92, 0.17, { mw: 0.8, spread: true }]], serial: [0.6, 0.68, 0.32, 0.56],
    grammar: nums(1999), palettes: [pal(1948, 'green on cream', '#efe6c8', '#2a5a3a'), pal(1962, 'pink on maroon', '#7e2a2a', '#e8c0c0'), pal(1972, 'blue on white', '#f2f2f0', '#2a6ad0')],
    description: bikeDesc('City of Cranbrook', 'Tin annual plates: BICYCLE and the year across the top, a mounting hole left of the number, CRANBROOK below; colours changed yearly.', tbd(130, 80), MFR) }),
  cycle('esquimalt', 'Esquimalt', 'shield', { period: [1948, 1949], era: 'bicycle-early', source: bike('Esquimalt', 'Esquimalt'), w: 95, h: 100, shell: 'shield', holes: 'round', hx: [0.1, 0.9], hy: [0.47], bg: '#a9aaa6', ink: '#1f1f1f',
    f: [['ESQUIMALT, B.C.', 0.5, 0.33, 0.13, { font: 'serif', width: 0.92 }], ['BICYCLE', 0.5, 0.74, 0.1, { font: 'serif', width: 0.56 }], ['LICENSE', 0.5, 0.85, 0.06, { font: 'serif', width: 0.36 }]],
    serial: [0.5, 0.6, 0.2, 0.5, 'serif'], grammar: nums(2999, 100),
    description: bikeDesc('Township of Esquimalt', 'Unpainted tin shield stamped ESQUIMALT, B.C. over the number and BICYCLE LICENSE. The years are unknown (the page heading says Unknown; examples from about 1948–49, one showing 1948 in place of the number). Serif lettering uses typeface stand-ins.', tbd(95, 100), MFR) }),
  cycle('fernie-1949', 'Fernie', '1949', { period: [1949, 1949], era: 'bicycle-early', source: bike('Fernie', 'Fernie'), w: 130, h: 80, holes: 'round', hx: [0.18], hy: [0.55], bg: '#f0f0c0', ink: '#2a8a5a', rim: 2,
    t: [['BICYCLE', 0.3, 0.27, 0.17, { mw: 0.42 }], ['1949', 0.8, 0.27, 0.17], ['FERNIE  B.C.', 0.5, 0.92, 0.16, { mw: 0.7 }]], serial: [0.6, 0.7, 0.34, 0.56], grammar: nums(999),
    description: bikeDesc('City of Fernie', 'Green on pale yellow tin: BICYCLE 1949, a hole left of the number and FERNIE B.C. along the bottom.', docSize(130, 80, 'tin'), MFR) }),
  cycle('fernie', 'Fernie', '1966–77', { period: [1966, 1977], era: 'bicycle-later', source: bike('Fernie', 'Fernie'), w: 130, h: 80, holes: 'round', hx: [0.18], hy: [0.55], bg: '#a52833', ink: '#f2f2f2', rim: 2,
    t: [['BICYCLE', 0.3, 0.27, 0.17, { mw: 0.42 }], ['{yyyy}', 0.8, 0.27, 0.17], ['FERNIE', 0.5, 0.92, 0.16, { mw: 0.5, spread: true }]], serial: [0.6, 0.7, 0.34, 0.56], grammar: nums(999),
    palettes: [pal(1966, 'white on red', '#a52833', '#f2f2f2'), pal(1977, 'white on red', '#a52833', '#f2f2f2')],
    description: bikeDesc('City of Fernie', 'White on red tin: BICYCLE and the year, a hole left of the number and FERNIE.', docSize(130, 80, 'tin'), MFR) }),
  ...([[1964, 'blue on cream', '#f2efe0', '#1a4a8a'], [1970, 'black on yellow', '#f0ea7a', '#151515']] as const).map(([year, words, bg, ink]) =>
    cycle(`kelowna-${year}`, 'Kelowna', `${year} · ${words}`, { period: [year, year], era: 'bicycle-later', source: bike('Kelowna', 'Kelowna'), w: 135, h: 82, holes: 'round', hx: [0.2], hy: [0.55], bg, ink, rim: 2,
      rot: [[String(year), 0.08, 0.5, 0.14, -1]], t: [['BICYCLE', 0.6, 0.29, 0.18, { mw: 0.66, spread: true }], ['KELOWNA', 0.6, 0.92, 0.17, { mw: 0.66, spread: true }]], serial: [0.62, 0.68, 0.3, 0.5], grammar: nums(1999),
      description: bikeDesc('City of Kelowna', `Tin, ${words}: the year turned up the left side, a hole, BICYCLE, the number and KELOWNA. Colours changed yearly (1964–70).`, docSize(135, 82, 'tin'), MFR) })),
  cycle('nelson-1942', 'Nelson', '1942', { period: [1942, 1942], era: 'bicycle-early', source: bike('Nelson', 'Nelson'), w: 130, h: 72, holes: 'round', hx: [0.24, 0.73], hy: [0.52], bg: '#5a9ab5', ink: '#1a1a1a', rim: 2,
    t: [['BICYCLE LICENSE', 0.5, 0.3, 0.17, { mw: 0.9 }], ['19', 0.11, 0.62, 0.19], ['42', 0.88, 0.62, 0.19], ['NELSON-B.C.', 0.5, 0.9, 0.17, { mw: 0.84 }]], serial: [0.49, 0.62, 0.19, 0.4], grammar: nums(999),
    description: bikeDesc('City of Nelson', 'Black on light blue tin: BICYCLE LICENSE, 19 · number · 42 between two holes, NELSON-B.C.', tbd(130, 72), MFR) }),
  ...([[1943, 'black on red-brown', '#b0502a'], [1944, 'black on tan', '#c07a3a']] as const).map(([year, words, bg]) =>
    cycle(`nelson-${year}`, 'Nelson', `${year} shield · ${words}`, { period: [year, year], era: 'bicycle-early', source: bike('Nelson', 'Nelson'), w: 85, h: 85, shell: 'shield', holes: 'round', hx: [0.15, 0.85], hy: [0.43], bg, ink: '#1a1a1a',
      f: [['BICYCLE LICENSE', 0.5, 0.3, 0.12, { font: 'serif', width: 0.9, weight: 400 }], ['NELSON', 0.5, 0.76, 0.12, { font: 'serif', weight: 400 }], [String(year), 0.5, 0.88, 0.09, { font: 'serif' }]],
      serial: [0.5, 0.6, 0.22, 0.5, 'serif'], grammar: nums(999),
      description: bikeDesc('City of Nelson', `Painted fibreboard shield, ${words}: BICYCLE LICENSE, the number, NELSON and ${year}. Serif lettering uses typeface stand-ins.`, docSize(85, 85, 'fibreboard'), MFR) })),
  cycle('nelson-1945', 'Nelson', '1945 disc', { period: [1945, 1945], era: 'bicycle-early', source: bike('Nelson', 'Nelson'), w: 90, h: 90, shell: 'oval', rim: null, holes: 'round', hx: [0.15, 0.85], hy: [0.5], bg: '#bdbdb8', ink: '#1a1a1a', die: OLD, sdie: OLDSER,
    t: [['BICYCLE', 0.5, 0.29, 0.13, { mw: 0.6 }], ['LICENSE', 0.5, 0.38, 0.07, { mw: 0.4 }], ['NELSON', 0.5, 0.79, 0.12, { mw: 0.6 }], ['1945', 0.5, 0.9, 0.07, { mw: 0.24 }]], serial: [0.5, 0.63, 0.2, 0.5, 'serif'], grammar: nums(999),
    description: bikeDesc('City of Nelson', 'Unpainted round tin: BICYCLE LICENSE, the number, NELSON and 1945 (the shape changed every year 1945–50).', docSize(90, 90, 'tin')) }),
  cycle('nelson-1946', 'Nelson', '1946 shield', { period: [1946, 1946], era: 'bicycle-early', source: bike('Nelson', 'Nelson'), w: 85, h: 85, shell: 'shield', holes: 'round', hx: [0.1, 0.9], hy: [0.45], bg: '#b7b7b2', ink: '#1a1a1a',
    f: [['NELSON,B.C.', 0.5, 0.3, 0.14, { font: 'serif', width: 0.9 }], ['BICYCLE', 0.5, 0.74, 0.09, { font: 'serif' }], ['LICENSE', 0.5, 0.82, 0.06, { font: 'serif' }], ['1946', 0.5, 0.91, 0.08, { font: 'serif' }]],
    serial: [0.5, 0.6, 0.24, 0.5, 'serif'], grammar: nums(999),
    description: bikeDesc('City of Nelson', 'Unpainted tin shield: NELSON,B.C., the number, BICYCLE LICENSE and 1946. Serif lettering uses typeface stand-ins.', docSize(85, 85, 'tin')) }),
  cycle('nelson-1947', 'Nelson', '1947 notched', { period: [1947, 1947], era: 'bicycle-early', source: bike('Nelson', 'Nelson'), w: 102, h: 70, shell: 'notch', holes: 'round', hx: [0.19, 0.81], hy: [0.52], bg: '#bdbdb8', ink: '#1a1a1a', die: OLD,
    t: [['NELSON', 0.5, 0.27, 0.16, { mw: 0.6, spread: true }], ['BICYCLE LICENSE', 0.5, 0.88, 0.12, { mw: 0.78 }]], stack: [['19', 0.07, 0.5, 0.16, 0.12], ['47', 0.93, 0.5, 0.16, 0.12]],
    serial: [0.5, 0.66, 0.3, 0.46, 'serif'], grammar: nums(999),
    description: bikeDesc('City of Nelson', 'Unpainted tin with notched corners: NELSON, the number between two holes with 19 and 47 stacked at the edges, BICYCLE LICENSE (the file is labelled 1948; the plate reads 1947).', docSize(102, 70, 'tin (1947 size)')) }),
  ...([[1951, 'black on orange', '#e8762a', '#1a1a1a'], [1952, 'white on green', '#3aa84a', '#f2f2ee']] as const).map(([year, words, bg, ink]) =>
    cycle(`nelson-${year}`, 'Nelson', `${year} · ${words}`, { period: [year, year], era: 'bicycle-early', source: bike('Nelson', 'Nelson'), w: 138, h: 88, holes: 'slots', hx: [0.5], hy: [0.06], bg, ink, rim: 2,
      rot: [[String(year), 0.08, 0.52, 0.14, -1]], t: [['BICYCLE', 0.57, 0.3, 0.18, { mw: 0.62, spread: true }], ['NELSON', 0.57, 0.9, 0.16, { mw: 0.6, spread: true }]], serial: [0.57, 0.67, 0.3, 0.5], grammar: nums(999),
      description: bikeDesc('City of Nelson', `Metal, ${words}: the year turned up the left side, BICYCLE, the number and NELSON.`, docSize(138, 88, 'metal')) })),
  ...([[1956, 'red on white', '#f0efea', '#c8242a'], [1974, 'white on green', '#1e6a42', '#f0f0ea']] as const).map(([year, words, bg, ink]) =>
    cycle(`nelson-hex-${year}`, 'Nelson', `${year} hexagon · ${words}`, { period: year === 1956 ? [1953, 1973] : [1974, 1977], era: 'bicycle-later', source: bike('Nelson', 'Nelson'), w: 100, h: 55, shell: 'hex', holes: 'round', hx: [0.5], hy: [0.5], bg, ink,
      t: [['NELSON', 0.5, 0.33, 0.2, { mw: 0.6, spread: true }], ['19', 0.25, 0.63, 0.2], ['{yy}', 0.75, 0.63, 0.2]], serial: [0.5, 0.92, 0.23, 0.46], grammar: nums(999),
      palettes: year === 1956 ? [pal(1956, words, bg, ink)] : [pal(1974, words, bg, ink)],
      description: bikeDesc('City of Nelson', `Elongated hexagon, ${words}: NELSON, 19 · hole · ${String(year).slice(2)}, the number. The page dates the design 1953 (or 1954) to 1974 and the gallery runs to 1977; colours changed yearly. Manufacturer’s specimens (1956-00, a 1957 blank) exist.`, docSize(100, 55, 'tin'), MFR) })),
  cycle('oak-bay-1948', 'Oak Bay', '1948', { period: [1948, 1948], era: 'bicycle-early', source: bike('OakBay', 'Oak Bay'), w: 130, h: 70, holes: 'round', hx: [0.2, 0.8], hy: [0.52], bg: '#d8202a', ink: '#f4f4f4', rim: 2,
    t: [['BICYCLE LICENSE', 0.5, 0.3, 0.18, { mw: 0.9 }], ['19', 0.09, 0.64, 0.19], ['48', 0.91, 0.64, 0.19], ['OAK BAY', 0.5, 0.91, 0.2, { mw: 0.66, spread: true }]], serial: [0.5, 0.64, 0.19, 0.48], grammar: nums(1999),
    description: bikeDesc('District of Oak Bay', 'White on red tin: BICYCLE LICENSE, 19 · number · 48, OAK BAY.', tbd(130, 70), MFR) }),
  cycle('oak-bay-hex', 'Oak Bay', '1949–59 hexagon', { period: [1949, 1959], era: 'bicycle-early', source: bike('OakBay', 'Oak Bay'), w: 100, h: 57, shell: 'hex', holes: 'round', hx: [0.5], hy: [0.52], bg: '#2e6a2a', ink: '#efe6c0',
    t: [['OAK BAY', 0.5, 0.33, 0.2, { mw: 0.62, spread: true }], ['19', 0.26, 0.63, 0.2], ['{yy}', 0.74, 0.63, 0.2]], serial: [0.5, 0.92, 0.23, 0.44], grammar: nums(1999),
    palettes: [pal(1952, 'cream on green', '#2e6a2a', '#efe6c0'), pal(1955, 'cream on green', '#2e6a2a', '#efe6c0')],
    description: bikeDesc('District of Oak Bay', 'Elongated hexagon, cream on green (1952 and 1955 photographed): OAK BAY, 19 · hole · year, the number.', tbd(100, 57), MFR) }),
  cycle('oak-bay-shield', 'Oak Bay', 'shield', { period: [1940, 1947], era: 'bicycle-early', source: bike('OakBay', 'Oak Bay'), w: 95, h: 100, shell: 'shield', holes: 'round', hx: [0.1, 0.9], hy: [0.45], bg: '#b3b3ae', ink: '#1f1f1f',
    f: [['OAK BAY, B.C', 0.5, 0.3, 0.12, { width: 0.84, weight: 500 }], ['BICYCLE', 0.5, 0.72, 0.09, { weight: 400 }], ['LICENSE', 0.5, 0.82, 0.09, { weight: 400 }]],
    serial: [0.5, 0.55, 0.14, 0.4, 'serif'], grammar: nums(6999, 1000),
    description: bikeDesc('District of Oak Bay', 'Unpainted tin shield: OAK BAY, B.C, a four-figure number followed by a full stop, BICYCLE LICENSE (one shield reads LICENCE). The years are unknown; the period shown is a placeholder before the dated 1948 plate. Lettering uses typeface stand-ins; the stop after the number is not drawn.', tbd(95, 100), MFR) }),
  cycle('penticton-1947', 'Penticton', '1947–54', { period: [1947, 1954], era: 'bicycle-early', source: bike('Penticton', 'Penticton'), w: 128, h: 80, holes: 'round', hx: [0.18], hy: [0.52], bg: '#151515', ink: '#f0f0ea', rim: 2,
    t: [['BICYCLE', 0.3, 0.27, 0.16, { mw: 0.42 }], ['{yyyy}', 0.8, 0.27, 0.16], ['PENTICTON B.C.', 0.5, 0.92, 0.15, { mw: 0.86 }]], serial: [0.6, 0.68, 0.32, 0.56], grammar: nums(999),
    palettes: [pal(1947, 'white on black', '#151515', '#f0f0ea'), pal(1950, 'yellow on black', '#1c1c1a', '#d8c07a')],
    description: bikeDesc('City of Penticton', 'Tin: BICYCLE and the year, a hole left of the number, PENTICTON B.C. (1950 drops the B.C. in the photo; drawn with it).', docSize(128, 80, 'tin'), MFR) }),
  ...([[1955, 'black on yellow', '#f0c81e', '#151515'], [1958, 'green on gold', '#c49a3a', '#1e5a36']] as const).map(([year, words, bg, ink]) =>
    cycle(`penticton-${year}`, 'Penticton', `${year} · ${words}`, { period: year === 1955 ? [1955, 1957] : [1958, 1970], era: 'bicycle-later', source: bike('Penticton', 'Penticton'), w: 138, h: 88, holes: 'round', hx: [0.2], hy: [0.12], bg, ink, rim: 2,
      rot: [[String(year), 0.08, 0.52, 0.14, -1]], t: [['BICYCLE', 0.58, 0.3, 0.18, { mw: 0.62, spread: true }], ['PENTICTON', 0.58, 0.9, 0.15, { mw: 0.66 }]], serial: [0.58, 0.66, 0.3, 0.5], grammar: nums(999),
      description: bikeDesc('City of Penticton', `Tin, ${words}: the year turned up the left side, BICYCLE, the number and PENTICTON (1955–70). On a small run of 1955 plates both Ns in PENTICTON were set upside down (not drawn).`, docSize(138, 88, 'tin'), MFR) })),
  cycle('port-coquitlam', 'Port Coquitlam', '1960 shield', { period: [1960, 1960], era: 'bicycle-later', source: bike('PortCoquitlam', 'Port Coquitlam'), w: 85, h: 85, shell: 'shield', holes: 'round', hx: [0.12, 0.88], hy: [0.43], bg: '#bebeb9', ink: '#1f1f1f',
    t: [['BICYCLE LICENSE', 0.5, 0.2, 0.08, { mw: 0.8 }], ['PORT', 0.5, 0.66, 0.1, { mw: 0.3 }], ['COQUITLAM', 0.5, 0.78, 0.1, { mw: 0.66 }], ['1960', 0.5, 0.9, 0.09, { mw: 0.3 }]],
    serial: [0.5, 0.46, 0.16, 0.4], grammar: nums(999),
    description: bikeDesc('City of Port Coquitlam', 'Unpainted tin shield: BICYCLE LICENSE, the number, PORT COQUITLAM and 1960.', docSize(85, 85, 'tin'), MFR) }),
  ...([[1953, 'dark on yellow', '#c8a63a', '#2a2418'], [1958, 'green on white', '#e4e4de', '#2a6a4a'], [1959, 'blue on maroon', '#5a1e28', '#6a9ad8']] as const).map(([year, words, bg, ink]) =>
    cycle(`prince-george-${year}`, 'Prince George', `${year} oval · ${words}`, { period: [year, year], era: 'bicycle-later', source: bike('PrinceGeorge', 'Prince George'), w: 130, h: 84, shell: 'oval', rim: 3, holes: 'round', hx: [0.24, 0.76], hy: [0.52], bg, ink,
      arc: [['PR.GEORGE', 0.5, 0.95, 0.72, 0.17, 'top'], ['BICYCLE', 0.5, 0.02, 0.9, 0.17, 'bottom']], t: [['19', 0.12, 0.62, 0.19], [String(year).slice(2), 0.88, 0.62, 0.19]],
      serial: [0.5, 0.62, 0.19, 0.4], grammar: nums(999),
      description: bikeDesc('City of Prince George', `Oval tin, ${words}: PR.GEORGE arched over 19 · number · ${String(year).slice(2)} and BICYCLE arched below (1953–59; the page leaves years and bylaws unresolved).`, tbd(130, 84), MFR) })),
  cycle('trail-1935', 'Trail', '1935–48', { period: [1935, 1948], era: 'bicycle-early', source: bike('Trail', 'Trail'), w: 140, h: 75, holes: 'round', hx: [0.23, 0.72], hy: [0.52], bg: '#ecebe4', ink: '#2a6a4a', rim: 2,
    t: [['BICYCLE LICENSE', 0.5, 0.32, 0.18, { mw: 0.88 }], ['19', 0.1, 0.63, 0.2], ['{yy}', 0.9, 0.63, 0.2], ['TRAIL-B.C.', 0.5, 0.92, 0.18, { mw: 0.74 }]], serial: [0.48, 0.63, 0.2, 0.38], grammar: nums(999),
    palettes: [pal(1942, 'green on white', '#ecebe4', '#2a6a4a')],
    description: bikeDesc('City of Trail', 'Metal: BICYCLE LICENSE, 19 · number · year between two holes, TRAIL-B.C. (1942 green on white photographed).', docSize(140, 75, 'metal'), MFR) }),
  cycle('trail-oval', 'Trail', '1949–54 oval', { period: [1949, 1954], era: 'bicycle-early', source: bike('Trail', 'Trail'), w: 130, h: 78, shell: 'oval', rim: 3, holes: 'round', hx: [0.24, 0.76], hy: [0.52], bg: '#2a8a4a', ink: '#151515',
    arc: [['TRAIL.B.C.', 0.5, 0.95, 0.7, 0.17, 'top'], ['BICYCLE', 0.5, 0.02, 0.9, 0.17, 'bottom']], t: [['19', 0.12, 0.62, 0.19], ['{yy}', 0.88, 0.62, 0.19]],
    serial: [0.5, 0.62, 0.19, 0.4], grammar: nums(999), palettes: [pal(1950, 'black on green', '#2a8a4a', '#151515')],
    description: bikeDesc('City of Trail', 'Oval tin: TRAIL.B.C. arched over 19 · number · year and BICYCLE arched below (1950 black on green photographed).', docSize(130, 78, 'tin'), MFR) }),
  cycle('trail-1955', 'Trail', '1955–61', { period: [1955, 1961], era: 'bicycle-later', source: bike('Trail', 'Trail'), w: 130, h: 80, ...cornerHoles, bg: '#e8c82a', ink: '#3a3418', rim: 2,
    t: [['BICYCLE', 0.5, 0.25, 0.17, { mw: 0.66, spread: true }], ['TRAIL', 0.5, 0.71, 0.2, { mw: 0.58, spread: true }], ['{yyyy}', 0.5, 0.94, 0.19, { mw: 0.56, spread: true }]], serial: [0.5, 0.46, 0.17, 0.3], grammar: nums(999),
    palettes: [pal(1956, 'dark on yellow', '#e8c82a', '#3a3418')],
    description: bikeDesc('City of Trail', 'Tin: BICYCLE, the number, TRAIL and the year (1956 dark on yellow photographed).', tbd(130, 80), MFR) }),
  cycle('trail-1962', 'Trail', '1962–63', { period: [1962, 1963], era: 'bicycle-later', source: bike('Trail', 'Trail'), w: 130, h: 75, ...cornerHoles, bg: '#f0f0ec', ink: '#2a6ad0', rim: 2,
    t: [['{yyyy}', 0.5, 0.25, 0.18, { mw: 0.52, spread: true }], ['TRAIL', 0.5, 0.49, 0.18, { mw: 0.56, spread: true }], ['BICYCLE', 0.5, 0.94, 0.18, { mw: 0.7 }]], serial: [0.5, 0.7, 0.17, 0.3], grammar: nums(999),
    palettes: [pal(1962, 'blue on white', '#f0f0ec', '#2a6ad0')],
    description: bikeDesc('City of Trail', 'Tin: the year, TRAIL, the number and BICYCLE (1962 blue on white photographed).', tbd(130, 75), MFR) }),
  cycle('trail-1967', 'Trail', '1964–77 · 1967', { period: [1964, 1977], era: 'bicycle-later', source: bike('Trail', 'Trail'), w: 130, h: 80, holes: 'round', hx: [0.19], hy: [0.52], bg: '#1e5a36', ink: '#f0f0ea', rim: 2,
    rot: [['1967', 0.08, 0.5, 0.14, -1]], t: [['BICYCLE LICENSE', 0.6, 0.27, 0.15, { mw: 0.74 }], ['TRAIL', 0.6, 0.9, 0.18, { mw: 0.5, spread: true }]], serial: [0.6, 0.65, 0.3, 0.4], grammar: nums(999),
    description: bikeDesc('City of Trail', 'Tin, white on green (1967 photographed): the year turned up the left side, a hole, BICYCLE LICENSE, the number and TRAIL. Other years of this 1964–77 design changed colour.', tbd(130, 80), MFR) }),
  cycle('valemount', 'Valemount', '1969', { period: [1969, 1969], era: 'bicycle-later', source: bike('Valemount', 'Valemount'), w: 115, h: 85, radius: 3, rim: null, holes: 'round', hx: [0.2, 0.8], hy: [0.52], bg: '#c3c3be', ink: '#1a1a1a',
    shapes: [{ kind: 'circle', cx: 115 * 0.05, cy: 85 * 0.07, r: 2.2, fill: '#1a1a1a' }, { kind: 'circle', cx: 115 * 0.95, cy: 85 * 0.07, r: 2.2, fill: '#1a1a1a' }],
    t: [['VALEMOUNT', 0.5, 0.24, 0.16, { mw: 0.66 }], ['BICYCLE LICENSE', 0.5, 0.36, 0.07, { mw: 0.56 }], ['1969', 0.5, 0.84, 0.08, { mw: 0.24 }]], serial: [0.5, 0.62, 0.16, 0.3], grammar: nums(999),
    description: bikeDesc('Village of Valemount', 'Unpainted tin: VALEMOUNT, BICYCLE LICENSE, the number and 1969; the end year is unknown.', tbd(115, 85), MFR) }),
  cycle('vancouver-1904', 'Vancouver', '1901–04 brass tag', { period: [1901, 1904], era: 'bicycle-early', source: bike('Vancouver', 'Vancouver'), w: 40, h: 50, radius: 3, rim: null, holes: 'none', bg: '#b89a4a', ink: '#3a2e14', die: OLD, sdie: OLDSER,
    t: [['C.B.T.P.O.', 0.5, 0.2, 0.1, { mw: 0.82 }], ['VANCOUVER', 0.5, 0.74, 0.07, { mw: 0.7 }], ['{yyyy}', 0.5, 0.9, 0.09, { mw: 0.5 }]], serial: [0.5, 0.48, 0.2, 0.7], grammar: nums(1999),
    palettes: [pal(1904, 'brass', '#b89a4a', '#3a2e14')],
    description: bikeDesc('City of Vancouver', 'A small brass tag strapped to the frame: C.B.T.P.O. (City Bicycle Tax Paid – Owner) over the number, VANCOUVER and the year; liveries had C.B.T.P.L. and messengers C.B.T.P.M. The leather strap is not drawn.', tbd(40, 50)) }),
  cycle('vancouver-1940s', 'Vancouver', '1940s crossbar plate', { period: [1940, 1949], era: 'bicycle-early', source: bike('Vancouver', 'Vancouver'), w: 85, h: 43, radius: 4, rim: null, holes: 'round', hx: [0.06, 0.94], hy: [0.86], bg: '#c9c9c4', ink: '#141414',
    t: [['VANCOUVER', 0.5, 0.93, 0.18, { mw: 0.78 }]], serial: [0.5, 0.66, 0.5, 0.9],
    grammar: { blocks: [{ pattern: 'A999' }, { pattern: '999A' }], hint: 'A999 or 999A (K220, P251, S127, 096C)' },
    description: bikeDesc('City of Vancouver', 'Small aluminium crossbar plate (a rarer steel base also exists): a letter and three figures, or three figures and a letter, over VANCOUVER. Vancouver moved to registration decals in the 1950s.', tbd(85, 43)) }),
  cycle('vancouver-courier-1989', 'Vancouver', '1989 bicycle courier', { period: [1989, 1996], era: 'bicycle-later', source: bike('Vancouver', 'Vancouver'), w: 150, h: 88, holes: 'slots', hx: [0.2, 0.8], hy: [0.07, 0.93], bg: '#eeeeec', ink: '#111111', rim: 2, flat: true,
    rules: [[0.84, 0.12, 0.88]], stack: [['COURIER', 0.89, 0.18, 0.1, 0.075], ['BICYCLE', 0.95, 0.18, 0.1, 0.075]], t: [['VANCOUVER', 0.42, 0.27, 0.17, { mw: 0.72 }]],
    panels: [{ x: 150 * 0.24, y: 88 * 0.73, width: 150 * 0.4, height: 88 * 0.2, background: '#ef6a1e', ink: '#fff5ea', radius: 1, role: 'city-decal',
      texts: [{ text: '1989', x: 150 * 0.08, baseline: 88 * 0.16, cap: 88 * 0.07, die: LEG, role: 'decal-year' }] }],
    serial: [0.42, 0.68, 0.38, 0.6], grammar: nums(999),
    description: bikeDesc('City of Vancouver', 'Bicycle-courier plate: flat white with VANCOUVER over the number, BICYCLE / COURIER stacked at the right and the city’s orange Vehicle for Hire decal. The 1997 dark-blue portrait courier plate stacks its number vertically, which the kit cannot draw, so it is not reproduced.', tbd(150, 88)) }),
  ...([[1946, 'unpainted', '#b8b8b3', '#1f1f1f', '46', '47'], [1952, 'white on red', '#b8242e', '#f2f0ea', '19', '52']] as const).map(([year, words, bg, ink, a, b]) =>
    cycle(`victoria-${year}`, 'Victoria', `${year === 1946 ? '1946–47' : year} hexagon · ${words}`, { period: year === 1946 ? [1946, 1947] : [1952, 1952], era: 'bicycle-early', source: bike('Victoria', 'Victoria'), w: 100, h: 57, shell: 'hex', holes: 'round', hx: [0.5], hy: [0.52], bg, ink,
      t: [['VICTORIA', 0.5, 0.33, 0.2, { mw: 0.66, spread: true }], [a, 0.27, 0.63, 0.2], [b, 0.73, 0.63, 0.2]], serial: [0.5, 0.92, 0.23, 0.5], grammar: nums(5999),
      description: bikeDesc('City of Victoria', `Elongated hexagon, ${words}: VICTORIA, ${a} · hole · ${b}, the number. Used 1946–55; replaced by decals (“transfers”) in 1956.`, tbd(100, 57), MFR) })),
  cycle('west-vancouver-licence', 'West Vancouver', 'shield · LICENCE', { period: [1940, 1955], era: 'bicycle-early', source: bike('WestVancouver', 'West Vancouver'), w: 95, h: 100, shell: 'shield', holes: 'round', hx: [0.08, 0.92], hy: [0.4], bg: '#b0583a', ink: '#6a2a1a',
    f: [['BICYCLE', 0.5, 0.25, 0.13, { font: 'serif', weight: 400, width: 0.62 }], ['LICENCE', 0.5, 0.38, 0.1, { font: 'serif', weight: 400, width: 0.5 }], ['WEST VANCOUVER', 0.5, 0.74, 0.08, { font: 'serif', weight: 400, width: 0.62 }], ['B. C.', 0.5, 0.84, 0.08, { font: 'serif', weight: 400 }]],
    serial: [0.5, 0.6, 0.18, 0.4, 'serif'], grammar: nums(4999),
    description: bikeDesc('District of West Vancouver', 'Red-painted tin shield: BICYCLE LICENCE, the number, WEST VANCOUVER B.C. The years are unknown; the period shown is a placeholder. Serif lettering uses typeface stand-ins.', tbd(95, 100), MFR) }),
  cycle('west-vancouver-license', 'West Vancouver', 'shield · LICENSE', { period: [1940, 1955], era: 'bicycle-early', source: bike('WestVancouver', 'West Vancouver'), w: 95, h: 100, shell: 'shield', holes: 'round', hx: [0.5], hy: [0.52], bg: '#bdbdb8', ink: '#1a1a1a',
    f: [['BICYCLE LICENSE', 0.5, 0.26, 0.09, { width: 0.8, weight: 500 }], ['WEST', 0.5, 0.72, 0.09, { weight: 400 }], ['VANCOUVER', 0.5, 0.81, 0.09, { weight: 400 }], ['B.C.', 0.5, 0.9, 0.09, { weight: 400 }]],
    serial: [0.5, 0.4, 0.13, 0.5, 'sans'], grammar: nums(4999),
    description: bikeDesc('District of West Vancouver', 'Unpainted tin shield: BICYCLE LICENSE, the number, a centre hole, WEST VANCOUVER B.C. The years are unknown; the period shown is a placeholder. Lettering uses typeface stand-ins.', tbd(95, 100), MFR) }),
  cycle('williams-lake', 'Williams Lake', '1977–78 plastic', { period: [1977, 1978], era: 'bicycle-later', source: bike('WilliamsLake', 'Williams Lake'), w: 110, h: 71, holes: 'round', hx: [0.5], hy: [0.4], bg: '#da4624', ink: '#f4f2ee', rim: 1.5, flat: true,
    shapes: [{ kind: 'rect', x: 110 * 0.12, y: 71 * 0.05, width: 110 * 0.2, height: 71 * 0.07, rx: 2, fill: '#2a2a2a' }, { kind: 'rect', x: 110 * 0.68, y: 71 * 0.05, width: 110 * 0.2, height: 71 * 0.07, rx: 2, fill: '#2a2a2a' }],
    t: [['BICYCLE', 0.5, 0.2, 0.12, { mw: 0.46, spread: true }], ['19', 0.3, 0.47, 0.17], ['{yy}', 0.7, 0.47, 0.17], ['WILLIAMS LAKE', 0.5, 0.93, 0.1, { mw: 0.76, spread: true }]], serial: [0.5, 0.79, 0.3, 0.4], grammar: nums(99),
    palettes: [pal(1977, 'white on orange-red', '#da4624', '#f4f2ee'), pal(1978, 'white on green', '#2b583d', '#f4f2ee')],
    description: bikeDesc('City of Williams Lake', 'Moulded plastic: BICYCLE, 19 · hole · year, a one- or two-figure number and WILLIAMS LAKE; the end year is unknown.', tbd(110, 71)) }),
];

export const BC_MUNICIPAL_FORMATS: PlateFormat[] = [...provincial, ...exempt, ...cities, victoria1913, tahsis, ...vancouver, ...bicycles].map(build);
