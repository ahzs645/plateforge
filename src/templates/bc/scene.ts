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
const TAB_HOLE_YS = [12, TAB.height - 12];
/** Strip bolt holes sit this far down the strip, matching the base's lower slots. */
const STRIP_HOLE_Y = 28;

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
const slotInset = (_plateHeight: number) => 10;

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

/** 1951 blue-on-white strip in its own coordinates (0,0 top-left). */
function renewalStrip(width: number, holeXs: number[], parts: Parts, withHoles: boolean): SvgNode[] {
  return [
    n('rect', { width, height: STRIP_HEIGHT, rx: 2, fill: '#f0eee0', stroke: '#254658', strokeWidth: 1 }),
    n('rect', { x: 2.5, y: 2.5, width: width - 5, height: STRIP_HEIGHT - 5, rx: 1.5, fill: 'none', stroke: '#254658', strokeWidth: 0.8, opacity: 0.55 }),
    label('BRITISH·51·COLUMBIA', width / 2, 25, 25, width - 12, '#254658', 'renewal-legend', {}, true),
    ...(parts.tabSerial ? [label(parts.tabSerial, width / 2, 33.5, 5, 22, '#8a9699', 'tab-serial')] : []),
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
function renewalTab(year: number, emblem: string, parts: Parts, withHoles: boolean): SvgNode[] {
  const tabInk = year === 1953 ? '#f1ede0' : '#e4c879';
  const tabBackground = year === 1953 ? '#266b87' : '#202525';
  const { width: w, height: h } = TAB;
  return [
    // Sheared straight on the left where it meets the base; rounded on the outer edge.
    n('path', { d: rightRounded(0, 0, w, h, 6), fill: tabBackground, 'data-role': 'tab-shell' }),
    // Raised rim runs top, right and bottom only; the sheared left edge has none.
    n('path', { d: rightRim(3, w - 6, h - 6, 5), fill: 'none', stroke: tabInk, strokeWidth: 1.5, strokeLinecap: 'butt' }),
    label(`5 ${year % 10}`, w / 2, 44, 40, 70, tabInk, 'renewal-year', {}, true),
    n('use', { href: `#${emblem}`, x: 7, y: 50, width: 76, height: 74, color: tabInk, 'data-role': 'tab-emblem', 'data-accuracy': 'approximate' }),
    ...(parts.tabSerial ? [label(parts.tabSerial, w - 22, h - 6.5, 7, 32, tabInk, 'tab-serial', { opacity: 0.8 })] : []),
    ...(withHoles ? TAB_HOLE_YS.map((cy) => n('circle', { cx: w / 2, cy, r: 3, fill: 'black', 'data-role': 'tab-hole' })) : []),
  ];
}

const bolt = (cx: number, cy: number): SvgNode => n('g', { 'data-role': 'fastener' },
  n('circle', { cx, cy, r: 4.4, fill: '#6b4a33' }),
  n('circle', { cx: cx - 1, cy: cy - 1, r: 2.2, fill: '#8d6a4c' }),
  n('path', { d: `M${cx - 3} ${cy} H${cx + 3}`, stroke: '#3d2a1d', strokeWidth: 1 }));

function renewalMetadata(year: number, long: boolean, mount: BcRenewalMount | null) {
  if (!mount) return null;
  return year === 1951 ? { kind: 'bottom-strip', widthMm: long ? 318 : 270, heightMm: STRIP_HEIGHT, mount }
    : { kind: 'side-tab', widthMm: TAB.width, heightMm: TAB.height, mount };
}

/** A renewal piece drawn alone, as it was sold before fitting. */
function buildLooseRenewal(design: BcDesign, parts: Parts, id: string): SvgNode {
  const r = bcYear(design.year);
  const { width: w, height: h, long } = bcGeometry(design, parts);
  const plate = long ? r.longWidthMm! : r.widthMm;
  const strip = r.year === 1951;
  const holeXs = [plate * 0.21, plate * 0.79].map((x) => x - (plate - w) / 2);
  const piece = strip ? renewalStrip(w, holeXs, parts, true) : renewalTab(r.year, `${id}-totem`, parts, true);
  const holes = [...piece].filter((item) => ['strip-hole', 'tab-hole'].includes(String(item.attrs['data-role'])));
  const metadata = {
    jurisdiction: 'CA-BC', vehicleClass: 'passenger', year: r.year, baseYear: r.baseYear, serial: null, parts,
    physicalMm: { width: w, height: h }, renewal: renewalMetadata(r.year, long, 'loose'),
    material: 'metal', source: BC_SOURCES[r.source],
    reconstruction: { colours: 'approximate', typography: 'proxy; not original dies', geometry: 'source dimensions; estimated detail positions', emblem: strip ? 'not applicable' : 'approximate' },
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
  const serialLabel = (value: string, x: number, y: number, size: number, width: number, color: string, role: string, extra: SvgNode['attrs']): SvgNode => vectorType
    ? buildLettering({ text: value, type: vectorType, centerX: x, baseline: y, height: size * 0.76, maxWidth: width, ink: color, role })
    : label(value, x, y, size, width, color, role, extra);
  const embossed = parts.finish === 'embossed';
  const totem = r.layout === 'totem-base';
  const standard = r.layout === 'annual-standard';
  const centenary = r.layout === 'centenary';
  const renewed = r.year === 1953 || r.year === 1954;
  const fitted = mount === 'on-plate' || mount === 'top';
  const blank = mount === 'blank-base';
  const slots: SvgNode[] = [];
  for (const x of [w * (totem ? 0.27 : 0.21), w * (totem ? 0.70 : 0.79)]) {
    for (const y of [10, h - 10]) {
      slots.push(totem ? n('circle', { cx: x, cy: y, r: 3.2, fill: 'black' })
        : n('rect', { x: x - 12, y: y - 3, width: 24, height: 6, rx: 3, fill: 'black' }));
    }
  }
  // Reserved renewal-tab attachments on 1955–1957; positions estimated from references.
  if (r.year >= 1955 && r.year <= 1957) slots.push(
    n('circle', { cx: w - 51, cy: 127, r: 1.9, fill: 'black' }),
    n('rect', { x: w - 8, y: 120, width: 2.5, height: 13, rx: 1, fill: 'black' }),
  );
  if (renewed && (fitted || blank)) for (const y of TAB_HOLE_YS) slots.push(n('circle', { cx: w - TAB.width / 2, cy: y, r: 3, fill: 'black' }));
  const defs = n('defs', {},
    n('mask', { id: `${id}-holes`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: w, height: h },
      n('rect', { width: w, height: h, fill: 'white' }), ...slots),
    ...(totem && !blank ? [totemEmblemSymbol(`${id}-totem`)] : []),
    n('filter', { id: `${id}-lift`, x: '-10%', y: '-20%', width: '120%', height: '150%' },
      n('feDropShadow', { dx: 0.8, dy: 1.2, stdDeviation: 0.9, floodColor: '#000000', floodOpacity: 0.4 })),
    n('filter', { id: `${id}-relief`, x: '-5%', y: '-10%', width: '110%', height: '125%' },
      n('feDropShadow', { dx: 0.6, dy: 0.7, stdDeviation: 0.25, floodColor: '#000000', floodOpacity: 0.3 })),
  );
  const rim = n('rect', { x: 4, y: 4, width: w - 8, height: h - 8, rx: 6, fill: 'none', stroke: ink, strokeWidth: 1.6, 'data-role': 'rim' });
  const base: SvgNode[] = [n('rect', { width: w, height: h, rx: 9, fill: background, 'data-role': 'base' }), rim];
  const inscriptions: SvgNode[] = [];
  const serialFont: SvgNode['attrs'] = {
    fontFamily: typeof design.serialFontFamily === 'string' ? design.serialFontFamily : FAMILY,
    fontStyle: standard || centenary ? 'normal' : 'italic',
    fontWeight: standard || centenary ? 700 : 600,
    'data-die-profile': standard || centenary ? 'oakalla-block-proxy' : 'oakalla-rounded-proxy',
  };
  if (totem) {
    inscriptions.push(serialLabel(serial, (w - 99) / 2, 96, 104, w - 121, ink, 'serial', serialFont));
    inscriptions.push(label('BRITISH COLUMBIA', (w - 99) / 2, 122, 25, w - 121, ink, 'province', {}, true));
    // Late 1953/54 over-run bases left this panel empty, pre-drilled for the tab.
    if (!blank) inscriptions.push(label('52', w - 47, 44, 40, 58, ink, 'base-year', {}, true));
    if (!blank) inscriptions.push(n('use', { href: `#${id}-totem`, x: w - 88, y: 48, width: 79, height: 81, color: ink, 'data-role': 'base-emblem', 'data-accuracy': 'approximate' }));
  } else if (centenary) {
    inscriptions.push(label('BRITISH COLUMBIA', w / 2, 28, 24, w - 49, ink, 'province', {}, true));
    inscriptions.push(serialLabel(serial, w / 2, 111, 109, w - 22, ink, 'serial', serialFont));
    inscriptions.push(label('1858   CENTENARY   1958', w / 2, 139, 21, w - 19, ink, 'centenary', {}, true));
  } else if (standard) {
    inscriptions.push(serialLabel(serial, w / 2, 109, 118, w - 30, ink, 'serial', serialFont));
    inscriptions.push(label('BRITISH COLUMBIA', (w - 54) / 2 + 6, 133, 23, w - 73, ink, 'province', {}, true));
    inscriptions.push(label(String(r.year).slice(2), w - 27, 134, 30, 34, ink, 'base-year'));
    if (r.year > 1957) inscriptions.push(n('circle', { cx: w - 51, cy: 127, r: 1.9, fill: ink }));
  } else {
    inscriptions.push(serialLabel(serial, (w - 28) / 2, 98, 104, w - 48, ink, 'serial', serialFont));
    inscriptions.push(label('BRITISH COLUMBIA', w / 2, 121, 24, w - 28, ink, 'province', {}, true));
    const yy = String(r.baseYear).slice(2);
    inscriptions.push(label(yy[0], w - 18, 48, 34, 17, ink, 'base-year-tens'));
    inscriptions.push(label(yy[1], w - 18, 88, 34, 17, ink, 'base-year-ones'));
  }
  // Renewal pieces were separately issued; they sit above the base rather than
  // replacing its artwork, so the retained base date and emblem stay underneath.
  const overlays: SvgNode[] = [];
  if (fitted && r.layout === 'renewal-strip') {
    const stripWidth = long ? 318 : 270;
    const x = (w - stripWidth) / 2;
    const slotY = mount === 'top' ? slotInset(h) : h - slotInset(h);
    const holeXs = [w * 0.21, w * 0.79];
    overlays.push(n('g', { 'data-role': 'renewal-strip', 'data-year': 1951, 'data-mount': mount, transform: `translate(${x} ${slotY - STRIP_HOLE_Y})`, filter: `url(#${id}-lift)` },
      ...renewalStrip(stripWidth, holeXs.map((cx) => cx - x), parts, false)));
    overlays.push(...holeXs.map((cx) => bolt(cx, slotY)));
  }
  if (fitted && renewed) {
    overlays.push(n('g', { 'data-role': 'renewal-tab', 'data-year': r.year, 'data-mount': mount, transform: `translate(${w - TAB.width} 0)`, filter: `url(#${id}-lift)` },
      ...renewalTab(r.year, `${id}-totem`, parts, false)));
    overlays.push(...TAB_HOLE_YS.map((cy) => bolt(w - TAB.width / 2, cy)));
  }
  const metadata = {
    jurisdiction: 'CA-BC', vehicleClass: 'passenger', year: r.year, baseYear: r.baseYear,
    variant: design.dashless ? 'no-dash' : 'standard', serial, parts,
    physicalMm: { width: w, height: h }, renewal: renewalMetadata(r.year, long, mount),
    material: totem || (r.year === 1951 && Number(compactBcSerial(parts.serial ?? '')) > 230000) ? 'aluminum' : r.year >= 1955 ? 'steel' : 'metal',
    colourDescription: r.colourDescription, source: BC_SOURCES[r.source],
    lettering: { ...letteringMetadata(vectorType ?? 'default'), requested: parts.lettering ?? 'default', fallback: isLetteringType(parts.lettering) && !vectorType },
    reconstruction: { colours: 'approximate', typography: vectorType ? 'procedural category; not original dies' : 'proxy; not original dies', geometry: 'source dimensions; estimated detail positions', emblem: totem ? 'approximate' : 'not applicable' },
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
