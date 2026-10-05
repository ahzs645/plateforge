/** Pure SVG scene builder. React and standalone previews use the SAME primitives.
 * No fonts or source photographs are embedded here. Default inscriptions remain
 * <text>; optional procedural serial lettering is emitted as paths. */
import { isLetteringType, letteringMetadata } from '../../core/lettering';
import { buildLettering, supportsLettering } from '../lettering';
import { node as n, serializeSvgNode as serializeBcNode, type SvgNode } from '../svg-scene';
export { escapeXml, serializeSvgNode as serializeBcNode } from '../svg-scene';
export type { SvgNode } from '../svg-scene';
import type { Parts } from '../../core/types';
import { bcYear, BC_SOURCES, BC_RECONSTRUCTION_NOTE } from '../../regions/canada/bc-data';
import { compactBcSerial, displayBcSerial } from '../../regions/canada/bc';
import { totemEmblemSymbol } from './totem-emblem';
import { bcDieSet, dieLabel, type BcDieSet } from './dies';
import { dieProfile } from '../dies/profiles';
import { buildDieText, dieRunWidth } from '../dies/engine';

export interface BcDesign {
  [key: string]: unknown;
  year: number;
  dashless?: boolean;
  background?: string;
  ink?: string;
  serialFontFamily?: string;
}
const FAMILY = '"Barlow Condensed", "Arial Narrow", sans-serif';

/** How a separately issued renewal piece relates to its base: bolted on,
 * not yet fitted (base only), shown loose on its own, fitted to nothing on a
 * late blank base (no 52 or emblem), or misapplied across the
 * top of the plate as many 1951 motorists did. */
export type BcRenewalMount = 'on-plate' | 'base-only' | 'blank-base' | 'loose' | 'top';
export const BC_RENEWAL_YEARS = [1951, 1953, 1954] as const;
const TAB = { width: 90, height: 140 };
const STRIP_HEIGHT = 36;
/** Tab holes, digits and emblem centre about 41.5 mm across, left of the tab's middle: only the right side has a rim
 *  (measured from BCpl8s 1953/54 tab photos). */
const TAB_CX = 41.6;
const TAB_HOLE_YS = [14.5, 126];
/** Strip bolt holes sit this far down the strip, matching the base's lower slots (1951 217·639: strip top 94.4 mm). */
const STRIP_HOLE_Y = 30;
/** 1940–51 bases: slot centres sit ±80 mm either side of the middle on both widths, 12.5 mm in from the edges. */
const slotXs = (w: number) => [w / 2 - 80, w / 2 + 80];

export function bcRenewalMount(year: number, parts: Parts = {}): BcRenewalMount | null {
  if (!(BC_RENEWAL_YEARS as readonly number[]).includes(year)) return null;
  const mount = parts.renewal;
  if (mount === 'base-only' || mount === 'loose') return mount;
  if (mount === 'top' && year === 1951) return mount;
  if (mount === 'blank-base' && year !== 1951) return mount;
  return 'on-plate';
}

export function bcGeometry(design: BcDesign, parts: Parts = {}) {
  const r = bcYear(design.year);
  const raw = compactBcSerial(parts.serial ?? r.sample);
  const long = !!r.longWidthMm && raw !== null && /^\d{6}$/.test(raw);
  const mount = bcRenewalMount(r.year, parts);
  if (mount === 'loose') return r.year === 1951
    ? { width: long ? 318 : 270, height: STRIP_HEIGHT, long }
    : { width: TAB.width, height: TAB.height, long };
  const height = r.heightMm + (mount === 'top' ? stripOverhang(r.heightMm) : 0);
  return { width: long ? r.longWidthMm! : r.widthMm, height, long };
}

/** A strip bolted through the base's upper slots stands proud of the top edge. */
const stripOverhang = (plateHeight: number) => STRIP_HOLE_Y - slotInset(plateHeight);
const slotInset = (_plateHeight: number) => 12.5;

/** Fits a live text node into a slot; short serials retain a natural width. */
function label(value: string, x: number, y: number, size: number, maxWidth: number,
  ink: string, role: string, extra: SvgNode['attrs'] = {}, stretch = false): SvgNode {
  const units = [...value].reduce((sum, ch) => sum + (ch === ' ' ? 0.24 : /[-·.]/.test(ch) ? 0.20 : ch === '1' ? 0.28 : 0.44), 0);
  const width = Math.min(maxWidth, Math.max(size * 0.36, units * size));
  return n('text', {
    x, y, fill: ink, fontFamily: FAMILY, fontSize: size, fontWeight: 700,
    textAnchor: 'middle', textLength: stretch ? maxWidth : width,
    lengthAdjust: 'spacingAndGlyphs', 'data-role': role, ...extra,
  }, value);
}

type Labeler = typeof label;
/** Label maker that uses the period's legend die when source-die lettering is on, else live text. */
function labeler(dies: BcDieSet | null): Labeler {
  return (value, x, y, size, maxWidth, ink, role, extra = {}, stretch = false) =>
    (dies && dieLabel(dies.legend, value, x, y, size, maxWidth, ink, role, stretch)) || label(value, x, y, size, maxWidth, ink, role, extra, stretch);
}

/** Serial-numbering-machine digits (small, seriffed) for the numbers stamped into renewal strips and tabs. */
const STAMP: SvgNode['attrs'] = { fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 };

/** The strip legend with die lettering, laid out from 1951 217·639: 21 mm caps about 9.5 mm in from each end, and a
 *  slightly smaller 51 (19.3 mm) set about 4 mm higher than the words. Letter gaps are even along the whole run. */
function stripLegendDies(width: number, ink: string): SvgNode {
  const profile = dieProfile('bc-strip-1951');
  const runs = [{ text: 'BRITISH·', cap: 21, lift: 0 }, { text: '51', cap: 19.3, lift: 4 }, { text: '·COLUMBIA', cap: 21, lift: 0 }];
  const natural = runs.map((r) => (dieRunWidth(profile, r.text) * r.cap) / 100);
  const join = (profile.params.tracking * 21) / 100;
  const total = natural.reduce((a, b) => a + b, 0) + (runs.length - 1) * join;
  const gaps = runs.reduce((count, r) => count + [...r.text].length - 1, 0) + runs.length - 1;
  const span = width - 19;
  // Too long for a short strip: shrink uniformly rather than squeeze the letters.
  const k = Math.min(1, span / total);
  const extra = k < 1 ? 0 : (span - total) / gaps;
  let x = (width - total * k - extra * gaps) / 2;
  const nodes = runs.map((r, i) => {
    const cap = r.cap * k;
    const node = buildDieText({ text: r.text, profile, x, baseline: 25.7 - r.lift * k, capHeight: cap, anchor: 'start', ink,
      role: 'renewal-legend-run', letterSpacing: (extra * 100) / cap }).node;
    x += natural[i] * k + ([...r.text].length - 1) * extra + join * k + extra;
    return node;
  });
  return n('g', { 'data-role': 'renewal-legend', 'data-die': profile.id, role: 'img', 'aria-label': 'BRITISH·51·COLUMBIA' }, ...nodes);
}

/** 1951 blue-on-white strip in its own coordinates (0,0 top-left). Photographed strips show a white enamel face with a
 *  plain raised edge (no painted border), a heavy blue legend filling about 60% of the height, round raised dots, and a
 *  small unpainted number stamped under the 51 between the bolts. */
const STRIP = { face: '#e9ebe3', edge: '#b7bbb4', ink: '#3a6ea6', number: '#a2a79f' };
function renewalStrip(width: number, holeXs: number[], parts: Parts, withHoles: boolean): SvgNode[] {
  return [
    n('rect', { width, height: STRIP_HEIGHT, rx: 2.5, fill: STRIP.face, stroke: STRIP.edge, strokeWidth: 0.8, 'data-role': 'strip-face' }),
    // Pressed edge: a light highlight with a soft shadow just inside it.
    n('rect', { x: 1.8, y: 1.8, width: width - 3.6, height: STRIP_HEIGHT - 3.6, rx: 1.8, fill: 'none', stroke: '#ffffff', strokeWidth: 1.1, opacity: 0.85 }),
    n('rect', { x: 2.7, y: 2.7, width: width - 5.4, height: STRIP_HEIGHT - 5.4, rx: 1.4, fill: 'none', stroke: STRIP.edge, strokeWidth: 0.45, opacity: 0.7 }),
    // A separately manufactured strip keeps its lettering when the base serial font changes.
    stripLegendDies(width, STRIP.ink),
    ...(parts.tabSerial ? [label(parts.tabSerial, width / 2, 34, 6.2, 22, STRIP.number, 'tab-serial', STAMP)] : []),
    ...(withHoles ? holeXs.map((cx) => n('circle', { cx, cy: STRIP_HOLE_Y, r: 3.2, fill: 'black', 'data-role': 'strip-hole' })) : []),
  ];
}

/** Rectangle with square left corners and rounded right corners. */
const rightRounded = (x: number, y: number, w: number, h: number, r: number): string =>
  `M${x} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x}Z`;

/** Open rim: from the left edge along the top, down the rounded right side, back along the bottom. */
const rightRim = (inset: number, w: number, h: number, r: number): string =>
  `M0 ${inset}H${inset + w - r}A${r} ${r} 0 0 1 ${inset + w} ${inset + r}V${inset + h - r}A${r} ${r} 0 0 1 ${inset + w - r} ${inset + h}H0`;

/** 1953/54 side tab in its own coordinates: year at top, emblem, stamped number. */
function renewalTab(year: number, emblem: string, parts: Parts, withHoles: boolean, lab: Labeler = label, die = false): SvgNode[] {
  // Colours sampled from photographed tabs: navy with cream (1953), near-black with deep gold (1954).
  const tabInk = year === 1953 ? '#eee8da' : '#d6a150';
  const tabBackground = year === 1953 ? '#244f72' : '#1d1e1e';
  const { width: w, height: h } = TAB;
  return [
    // Sheared straight on the left where it meets the base; rounded on the outer edge.
    n('path', { d: rightRounded(0, 0, w, h, 9), fill: tabBackground, 'data-role': 'tab-shell' }),
    // Raised rim runs top, right and bottom only; the sheared left edge has none.
    n('path', { d: rightRim(3.2, w - 6.4, h - 6.4, 7), fill: 'none', stroke: tabInk, strokeWidth: 2.4, strokeLinecap: 'butt' }),
    // 32.5 mm digits as a close pair either side of the top hole (14–70 mm across).
    (die && dieLabel('bc-tab-1953', `5${year % 10}`, TAB_CX + 0.5, 52, 46.4, 55.4, tabInk, 'renewal-year', true))
      // Live text can't add letter spacing without stretching the glyphs, so a space opens the pair instead.
      || lab(`5 ${year % 10}`, TAB_CX + 0.5, 52, 46.4, 55.4, tabInk, 'renewal-year', {}, true),
    n('use', { href: `#${emblem}`, x: 4.8, y: 46.5, width: 71.4, height: 69.6, color: tabInk, 'data-role': 'tab-emblem', 'data-accuracy': 'approximate' }),
    ...(parts.tabSerial ? [label(parts.tabSerial, 69, 129.5, 8, 28, tabInk, 'tab-serial', { ...STAMP, opacity: 0.75 })] : []),
    ...(withHoles ? TAB_HOLE_YS.map((cy) => n('circle', { cx: TAB_CX, cy, r: 3, fill: 'black', 'data-role': 'tab-hole' })) : []),
  ];
}

const bolt = (cx: number, cy: number): SvgNode => n('g', { 'data-role': 'fastener' },
  n('circle', { cx, cy, r: 4.4, fill: '#6b4a33' }),
  n('circle', { cx: cx - 1, cy: cy - 1, r: 2.2, fill: '#8d6a4c' }),
  n('path', { d: `M${cx - 3} ${cy} H${cx + 3}`, stroke: '#3d2a1d', strokeWidth: 1 }));

function renewalMetadata(year: number, long: boolean, mount: BcRenewalMount | null) {
  if (!mount) return null;
  return year === 1951 ? { kind: 'bottom-strip', widthMm: long ? 318 : 270, heightMm: STRIP_HEIGHT, mount,
    lettering: { die: 'bc-strip-1951', evidence: 'photo-averaged', independentOfSerial: true } }
    : { kind: 'side-tab', widthMm: TAB.width, heightMm: TAB.height, mount };
}

/** A renewal piece drawn alone, as it was sold before fitting. */
function buildLooseRenewal(design: BcDesign, parts: Parts, id: string): SvgNode {
  const r = bcYear(design.year);
  const { width: w, height: h, long } = bcGeometry(design, parts);
  const plate = long ? r.longWidthMm! : r.widthMm;
  const strip = r.year === 1951;
  const holeXs = slotXs(plate).map((x) => x - (plate - w) / 2);
  const lab = labeler(parts.lettering === 'die' ? bcDieSet(design) : null);
  const piece = strip ? renewalStrip(w, holeXs, parts, true) : renewalTab(r.year, `${id}-totem`, parts, true, lab, parts.lettering === 'die');
  const holes = [...piece].filter((item) => ['strip-hole', 'tab-hole'].includes(String(item.attrs['data-role'])));
  const metadata = {
    jurisdiction: 'CA-BC', vehicleClass: 'passenger', year: r.year, baseYear: r.baseYear, serial: null, parts,
    physicalMm: { width: w, height: h }, renewal: renewalMetadata(r.year, long, 'loose'),
    material: 'metal', source: BC_SOURCES[r.source],
    reconstruction: { colours: 'approximate', typography: strip ? 'photo-averaged renewal-strip outlines; small stamped number uses a proxy' : 'proxy; not original dies', geometry: 'source dimensions; estimated detail positions', emblem: strip ? 'not applicable' : 'approximate' },
  };
  const label1 = strip ? `British Columbia ${r.year} renewal strip` : `British Columbia ${r.year} renewal tab`;
  return n('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${w} ${h}`, width: w, height: h, role: 'img', 'aria-label': label1 },
    n('title', {}, `${label1}${parts.tabSerial ? ` · ${parts.tabSerial}` : ''}`),
    n('desc', {}, `${BC_RECONSTRUCTION_NOTE} Shown unattached; the plate serial is not part of this piece.`),
    n('metadata', {}, JSON.stringify(metadata)),
    n('defs', {},
      n('mask', { id: `${id}-holes`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: w, height: h },
        n('rect', { width: w, height: h, fill: 'white' }), ...holes),
      ...(strip ? [] : [totemEmblemSymbol(`${id}-totem`)])),
    n('g', { mask: `url(#${id}-holes)`, 'data-role': strip ? 'renewal-strip' : 'renewal-tab', 'data-year': r.year },
      ...piece.filter((item) => !holes.includes(item))),
  );
}

export function buildBcScene(design: BcDesign, parts: Parts, scope = 'bc-plate'): SvgNode {
  const r = bcYear(design.year);
  const id = scope.replace(/[^a-zA-Z0-9_-]/g, '') || 'bc-plate';
  const mount = bcRenewalMount(r.year, parts);
  if (mount === 'loose') return buildLooseRenewal(design, parts, id);
  const { width: w, height: fullHeight, long } = bcGeometry(design, parts);
  const h = r.heightMm;
  /** Vertical offset of the base when a misapplied strip overhangs its top edge. */
  const oy = fullHeight - h;
  const ink = typeof design.ink === 'string' ? design.ink : r.ink;
  const background = typeof design.background === 'string' ? design.background : r.background;
  const serial = displayBcSerial(parts.serial ?? '', design.dashless === true);
  const vectorType = isLetteringType(parts.lettering) && supportsLettering(serial) ? parts.lettering : null;
  const dies = parts.lettering === 'die' ? bcDieSet(design) : null;
  const L = labeler(dies);
  /** 1940–51 bases: serial with a raised dot, year stacked at the right (1951 keeps its 1950 base). */
  const stacked = r.layout === 'stacked-year' || r.layout === 'renewal-strip';
  const serialLabel = (value: string, x: number, y: number, size: number, width: number, color: string, role: string, extra: SvgNode['attrs']): SvgNode => vectorType
    ? buildLettering({ text: value, type: vectorType, centerX: x, baseline: y, height: size * 0.76, maxWidth: width, ink: color, role })
    : (dies && dieLabel(dies.serial, value.replace('-', dies.separator), x, y, size, width, color, role))
      || label(stacked ? value.replace('-', '·') : value, x, y, size, width, color, role, extra);
  const embossed = parts.finish === 'embossed';
  const totem = r.layout === 'totem-base';
  const standard = r.layout === 'annual-standard';
  const centenary = r.layout === 'centenary';
  const renewed = r.year === 1953 || r.year === 1954;
  const fitted = mount === 'on-plate' || mount === 'top';
  const blank = mount === 'blank-base';
  const slots: SvgNode[] = [];
  // 1952 base: a hole on the left and a pair on the right, for different bumper spacings (1952 42-289).
  const holeXs = totem ? [w * 0.27, w * 0.693, w * 0.731] : stacked ? slotXs(w) : [w * 0.21, w * 0.79];
  const holeYs = totem ? [13, h - 15] : stacked ? [slotInset(h), h - slotInset(h)] : [10, h - 10];
  for (const x of holeXs) {
    for (const y of holeYs) {
      slots.push(totem ? n('circle', { cx: x, cy: y, r: 3.2, fill: 'black' })
        : n('rect', { x: x - 12, y: y - 3.5, width: 24, height: 7, rx: 3.5, fill: 'black' }));
    }
  }
  // Reserved renewal-tab attachments on 1955–1957; positions estimated from references.
  if (r.year >= 1955 && r.year <= 1957) slots.push(
    n('circle', { cx: w - 51, cy: 127, r: 1.9, fill: 'black' }),
    n('rect', { x: w - 8, y: 120, width: 2.5, height: 13, rx: 1, fill: 'black' }),
  );
  if (renewed && (fitted || blank)) for (const y of TAB_HOLE_YS) slots.push(n('circle', { cx: w - TAB.width + TAB_CX, cy: y, r: 3, fill: 'black' }));
  const defs = n('defs', {},
    n('mask', { id: `${id}-holes`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: w, height: h },
      n('rect', { width: w, height: h, fill: 'white' }), ...slots),
    ...(totem && !blank ? [totemEmblemSymbol(`${id}-totem`)] : []),
    n('filter', { id: `${id}-lift`, x: '-10%', y: '-20%', width: '120%', height: '150%' },
      n('feDropShadow', { dx: 0.8, dy: 1.2, stdDeviation: 0.9, floodColor: '#000000', floodOpacity: 0.4 })),
    n('filter', { id: `${id}-relief`, x: '-5%', y: '-10%', width: '110%', height: '125%' },
      n('feDropShadow', { dx: 0.6, dy: 0.7, stdDeviation: 0.25, floodColor: '#000000', floodOpacity: 0.3 })),
  );
  // 1940–54 plates have a heavy raised rim right at the edge; later ones a finer one set in.
  const heavyRim = stacked || totem;
  const rim = heavyRim
    ? n('rect', { x: 2.8, y: 2.8, width: w - 5.6, height: h - 5.6, rx: 7, fill: 'none', stroke: ink, strokeWidth: 3.2, 'data-role': 'rim' })
    : n('rect', { x: 4, y: 4, width: w - 8, height: h - 8, rx: 6, fill: 'none', stroke: ink, strokeWidth: 1.6, 'data-role': 'rim' });
  const base: SvgNode[] = [n('rect', { width: w, height: h, rx: 9, fill: background, 'data-role': 'base' }), rim];
  const inscriptions: SvgNode[] = [];
  const serialFont: SvgNode['attrs'] = {
    fontFamily: typeof design.serialFontFamily === 'string' ? design.serialFontFamily : FAMILY,
    fontStyle: standard || centenary ? 'normal' : 'italic',
    fontWeight: standard || centenary ? 700 : 600,
    'data-die-profile': standard || centenary ? 'oakalla-block-proxy' : 'oakalla-rounded-proxy',
  };
  if (totem) {
    // Measured from 1952 42-289: 70 mm serial over 15–258 mm, 21 mm legend beneath it, 34 mm 52 paired at 275–330 mm
    // with the leaf's tip rising between the digits.
    inscriptions.push(serialLabel(serial, 137, 92.5, 100, 244, ink, 'serial', serialFont));
    inscriptions.push(L('BRITISH COLUMBIA', 137, 122, 30, 243, ink, 'province', {}, true));
    // Late 1953/54 over-run bases left this panel empty, pre-drilled for the tab.
    if (!blank) inscriptions.push((dies && dieLabel('bc-year-1952', '52', w - 47.4, 55, 48.6, 55, ink, 'base-year', true)) || L('52', w - 47.4, 55, 48.6, 55, ink, 'base-year', {}, true));
    if (!blank) inscriptions.push(n('use', { href: `#${id}-totem`, x: w - 85.2, y: 50.2, width: 69.4, height: 67.6, color: ink, 'data-role': 'base-emblem', 'data-accuracy': 'approximate' }));
  } else if (centenary) {
    inscriptions.push(L('BRITISH COLUMBIA', w / 2, 28, 24, w - 49, ink, 'province', {}, true));
    inscriptions.push(serialLabel(serial, w / 2, 111, 109, w - 22, ink, 'serial', serialFont));
    inscriptions.push(L('1858   CENTENARY   1958', w / 2, 139, 21, w - 19, ink, 'centenary', {}, true));
  } else if (standard) {
    inscriptions.push(serialLabel(serial, w / 2, 109, 118, w - 30, ink, 'serial', serialFont));
    inscriptions.push(L('BRITISH COLUMBIA', (w - 54) / 2 + 6, 133, 23, w - 73, ink, 'province', {}, true));
    inscriptions.push((dies && typeof design.dateDie === 'string' && dieLabel(design.dateDie, String(r.year).slice(2), w - 27, 134, 30, 34, ink, 'base-year')) || L(String(r.year).slice(2), w - 27, 134, 30, 34, ink, 'base-year'));
    if (r.year > 1957) inscriptions.push(n('circle', { cx: w - 51, cy: 127, r: 1.9, fill: ink }));
  } else {
    // Measured from 1940 99·830, 1949 71·064 / 121·464 and 1950 230·229: a 71 mm serial spanning about 13 mm to
    // w − 29 mm on a 90 mm baseline; 32 mm year digits stacked 15 mm from the right edge, level with the serial's top
    // and baseline; and a 20.5 mm legend with ordinary letter spacing whose word gap widens to fill the plate.
    inscriptions.push(serialLabel(serial, (w - 16) / 2, 90, 101.5, w - 42, ink, 'serial', serialFont));
    const [left, right] = long ? [23, w - 23] : [14, w - 15];
    inscriptions.push(L('BRITISH COLUMBIA', (left + right) / 2, 120.5, 29.3, right - left, ink, 'province', {}, true));
    const yy = String(r.baseYear).slice(2);
    const year = (digit: string, baseline: number, role: string) =>
      (dies && dieLabel('bc-year-1940', digit, w - 15, baseline, 45.7, 17, ink, role)) || L(digit, w - 15, baseline, 45.7, 17, ink, role);
    inscriptions.push(year(yy[0], 51.5, 'base-year-tens'));
    inscriptions.push(year(yy[1], 90, 'base-year-ones'));
  }
  // Renewal pieces were separately issued; they sit above the base rather than
  // replacing its artwork, so the retained base date and emblem stay underneath.
  const overlays: SvgNode[] = [];
  if (fitted && r.layout === 'renewal-strip') {
    const stripWidth = long ? 318 : 270;
    const x = (w - stripWidth) / 2;
    const slotY = mount === 'top' ? slotInset(h) : h - slotInset(h);
    const holeXs = slotXs(w);
    overlays.push(n('g', { 'data-role': 'renewal-strip', 'data-year': 1951, 'data-mount': mount, transform: `translate(${x} ${slotY - STRIP_HOLE_Y})`, filter: `url(#${id}-lift)` },
      ...renewalStrip(stripWidth, holeXs.map((cx) => cx - x), parts, false)));
    overlays.push(...holeXs.map((cx) => bolt(cx, slotY)));
  }
  if (fitted && renewed) {
    overlays.push(n('g', { 'data-role': 'renewal-tab', 'data-year': r.year, 'data-mount': mount, transform: `translate(${w - TAB.width} 0)`, filter: `url(#${id}-lift)` },
      ...renewalTab(r.year, `${id}-totem`, parts, false, L, !!dies)));
    overlays.push(...TAB_HOLE_YS.map((cy) => bolt(w - TAB.width + TAB_CX, cy)));
  }
  const metadata = {
    jurisdiction: 'CA-BC', vehicleClass: 'passenger', year: r.year, baseYear: r.baseYear,
    variant: design.dashless ? 'no-dash' : 'standard', serial, parts,
    physicalMm: { width: w, height: h }, renewal: renewalMetadata(r.year, long, mount),
    material: totem || (r.year === 1951 && Number(compactBcSerial(parts.serial ?? '')) > 230000) ? 'aluminum' : r.year >= 1955 ? 'steel' : 'metal',
    colourDescription: r.colourDescription, source: BC_SOURCES[r.source],
    lettering: dies ? { mode: 'source-die', serial: dies.serial, legend: dies.legend, evidence: dieProfile(dies.serial).evidence.status, requested: 'die', fallback: false }
      : { ...letteringMetadata(vectorType ?? 'default'), requested: parts.lettering ?? 'default', fallback: isLetteringType(parts.lettering) && !vectorType },
    reconstruction: { colours: 'approximate', typography: dies ? `die reconstruction (${dieProfile(dies.serial).evidence.status})` : vectorType ? 'procedural category; not original dies' : 'proxy; not original dies', geometry: 'source dimensions; estimated detail positions', emblem: totem ? 'approximate' : 'not applicable' },
  };
  const plate = [
    n('g', { mask: `url(#${id}-holes)` }, ...base,
      n('g', { ...(embossed ? { filter: `url(#${id}-relief)` } : {}), 'data-role': 'inscriptions' }, ...inscriptions)),
    ...overlays,
  ];
  return n('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${w} ${fullHeight}`, width: w, height: fullHeight, role: 'img', 'aria-label': `British Columbia ${r.year}: ${serial}` },
    n('title', {}, `British Columbia passenger plate · ${r.year} · ${serial}`),
    n('desc', {}, `${BC_RECONSTRUCTION_NOTE} ${r.note}`),
    n('metadata', {}, JSON.stringify(metadata)), defs,
    ...(oy ? [n('g', { transform: `translate(0 ${oy})` }, ...plate)] : plate),
  );
}

export function renderBcSvg(design: BcDesign, parts: Parts, scope?: string): string {
  return serializeBcNode(buildBcScene(design, parts, scope));
}
