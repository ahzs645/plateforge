/** Pure SVG scene builder. React and standalone previews use the SAME primitives.
 * No fonts or source photographs are embedded here. Text remains <text>. */
import type { Parts } from '../../core/types';
import { bcYear, BC_SOURCES, BC_RECONSTRUCTION_NOTE } from '../../regions/canada/bc-data';
import { compactBcSerial, displayBcSerial } from '../../regions/canada/bc';

export interface BcDesign {
  [key: string]: unknown;
  year: number;
  dashless?: boolean;
  background?: string;
  ink?: string;
  serialFontFamily?: string;
}
export interface SvgNode {
  tag: string;
  attrs: Record<string, string | number>;
  children: Array<SvgNode | string>;
}
const n = (tag: string, attrs: SvgNode['attrs'] = {}, ...children: SvgNode['children']): SvgNode => ({ tag, attrs, children });
const FAMILY = '"Barlow Condensed", "Arial Narrow", sans-serif';

export function bcGeometry(design: BcDesign, parts: Parts = {}) {
  const r = bcYear(design.year);
  const raw = compactBcSerial(parts.serial ?? r.sample);
  const long = !!r.longWidthMm && raw !== null && /^\d{6}$/.test(raw);
  return { width: long ? r.longWidthMm! : r.widthMm, height: r.heightMm, long };
}

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

/** Editable, original approximation of the historic plate emblem, not a scan
 * and not an authoritative reproduction. Replace this ONE master when audited. */
function totemMaster(id: string): SvgNode {
  return n('symbol', { id, viewBox: '0 0 80 85' },
    n('g', { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinejoin: 'round', strokeLinecap: 'round' },
      n('path', { d: 'M40 3 L49 12 56 10 55 24 66 23 68 20 70 28 77 27 73 42 76 47 66 53 72 68 59 66 59 74 47 70 42 81 36 73 23 72 22 67 8 69 14 54 5 48 10 41 5 28 13 29 14 23 24 26 24 12 32 13 Z' }),
      n('path', { d: 'M36 18 Q43 14 48 18 L45 23 Q36 20 34 26 Q34 29 40 29 Q48 27 47 34 Q45 38 39 34 L35 36 40 41 36 46 38 68 44 70 42 77' }),
      n('path', { d: 'M39 42 L51 40 60 43 61 53 Q52 58 44 52 L43 63 Q48 68 44 71 M36 42 L25 40 25 48 30 54 35 53 M39 52 L34 56 38 59 34 64 M39 61 Q45 58 45 64' }),
      n('path', { d: 'M33 18 L30 23 34 26 M52 44 L52 50 M56 45 L56 51 M28 44 L29 49 M39 31 L43 32 M39 46 L43 45' }),
    ),
  );
}

export function buildBcScene(design: BcDesign, parts: Parts, scope = 'bc-plate'): SvgNode {
  const r = bcYear(design.year);
  const { width: w, height: h, long } = bcGeometry(design, parts);
  const id = scope.replace(/[^a-zA-Z0-9_-]/g, '') || 'bc-plate';
  const ink = typeof design.ink === 'string' ? design.ink : r.ink;
  const background = typeof design.background === 'string' ? design.background : r.background;
  const serial = displayBcSerial(parts.serial ?? '', design.dashless === true);
  const embossed = parts.finish === 'embossed';
  const totem = r.layout === 'totem-base';
  const standard = r.layout === 'annual-standard';
  const centenary = r.layout === 'centenary';
  const renewed = r.year === 1953 || r.year === 1954;
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
  if (renewed) for (const y of [12, h - 12]) slots.push(n('circle', { cx: w - 45, cy: y, r: 3, fill: 'black' }));
  const defs = n('defs', {},
    n('mask', { id: `${id}-holes`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: w, height: h },
      n('rect', { width: w, height: h, fill: 'white' }), ...slots),
    totemMaster(`${id}-totem`),
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
    inscriptions.push(label(serial, (w - 99) / 2, 96, 104, w - 121, ink, 'serial', serialFont));
    inscriptions.push(label('BRITISH COLUMBIA', (w - 99) / 2, 122, 25, w - 121, ink, 'province', {}, true));
    inscriptions.push(label('5·2', w - 47, 43, 39, 76, ink, 'base-year', {}, true));
    inscriptions.push(n('use', { href: `#${id}-totem`, x: w - 88, y: 48, width: 79, height: 81, color: ink, 'data-role': 'base-emblem', 'data-accuracy': 'approximate' }));
  } else if (centenary) {
    inscriptions.push(label('BRITISH COLUMBIA', w / 2, 28, 24, w - 49, ink, 'province', {}, true));
    inscriptions.push(label(serial, w / 2, 111, 109, w - 22, ink, 'serial', serialFont));
    inscriptions.push(label('1858   CENTENARY   1958', w / 2, 139, 21, w - 19, ink, 'centenary', {}, true));
  } else if (standard) {
    inscriptions.push(label(serial, w / 2, 109, 118, w - 30, ink, 'serial', serialFont));
    inscriptions.push(label('BRITISH COLUMBIA', (w - 54) / 2 + 6, 133, 23, w - 73, ink, 'province', {}, true));
    inscriptions.push(label(String(r.year).slice(2), w - 27, 134, 30, 34, ink, 'base-year'));
    if (r.year > 1957) inscriptions.push(n('circle', { cx: w - 51, cy: 127, r: 1.9, fill: ink }));
  } else {
    inscriptions.push(label(serial, (w - 28) / 2, 98, 104, w - 48, ink, 'serial', serialFont));
    inscriptions.push(label('BRITISH COLUMBIA', w / 2, 121, 24, w - 28, ink, 'province', {}, true));
    const yy = String(r.baseYear).slice(2);
    inscriptions.push(label(yy[0], w - 18, 48, 34, 17, ink, 'base-year-tens'));
    inscriptions.push(label(yy[1], w - 18, 88, 34, 17, ink, 'base-year-ones'));
  }
  const overlays: SvgNode[] = [];
  if (r.layout === 'renewal-strip') {
    const stripWidth = long ? 318 : 270;
    overlays.push(n('g', { 'data-role': 'renewal-strip', 'data-year': 1951 },
      n('rect', { x: (w - stripWidth) / 2, y: h - 38, width: stripWidth, height: 36, rx: 2, fill: '#f0eee0', stroke: '#254658', strokeWidth: 1 }),
      label('BRITISH·51·COLUMBIA', w / 2, h - 12, 25, stripWidth - 10, '#254658', 'renewal-legend', {}, true),
      ...(parts.tabSerial ? [label(parts.tabSerial, w - 27, h - 3, 5.5, 26, '#596a70', 'tab-serial')] : []),
    ));
  }
  if (renewed) {
    const tabInk = r.year === 1953 ? '#f1ede0' : '#e4c879';
    const tabBackground = r.year === 1953 ? '#266b87' : '#202525';
    overlays.push(n('g', { 'data-role': 'renewal-tab', 'data-year': r.year },
      n('rect', { x: w - 90, y: 0, width: 90, height: h, rx: 5, fill: tabBackground }),
      n('rect', { x: w - 87, y: 3, width: 84, height: h - 6, rx: 5, fill: 'none', stroke: tabInk, strokeWidth: 1.5 }),
      label(`5·${r.year % 10}`, w - 45, 43, 39, 74, tabInk, 'renewal-year', {}, true),
      n('use', { href: `#${id}-totem`, x: w - 84, y: 48, width: 78, height: 80, color: tabInk, 'data-role': 'tab-emblem', 'data-accuracy': 'approximate' }),
      ...(parts.tabSerial ? [label(parts.tabSerial, w - 22, h - 6, 7, 34, tabInk, 'tab-serial')] : []),
    ));
  }
  const metadata = {
    jurisdiction: 'CA-BC', vehicleClass: 'passenger', year: r.year, baseYear: r.baseYear,
    variant: design.dashless ? 'no-dash' : 'standard', serial, parts,
    physicalMm: { width: w, height: h }, renewal: renewed ? { kind: 'side-tab', widthMm: 90, heightMm: 140 }
      : r.year === 1951 ? { kind: 'bottom-strip', widthMm: long ? 318 : 270, heightMm: 36 } : null,
    material: totem || (r.year === 1951 && Number(compactBcSerial(parts.serial ?? '')) > 230000) ? 'aluminum' : r.year >= 1955 ? 'steel' : 'metal',
    colourDescription: r.colourDescription, source: BC_SOURCES[r.source],
    reconstruction: { colours: 'approximate', typography: 'proxy; not original dies', geometry: 'source dimensions; estimated detail positions', emblem: totem ? 'approximate' : 'not applicable' },
  };
  return n('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${w} ${h}`, width: w, height: h, role: 'img', 'aria-label': `British Columbia ${r.year}: ${serial}` },
    n('title', {}, `British Columbia passenger plate · ${r.year} · ${serial}`),
    n('desc', {}, `${BC_RECONSTRUCTION_NOTE} ${r.note}`),
    n('metadata', {}, JSON.stringify(metadata)), defs,
    n('g', { mask: `url(#${id}-holes)` }, ...base,
      n('g', { ...(embossed ? { filter: `url(#${id}-relief)` } : {}), 'data-role': 'inscriptions' }, ...inscriptions),
      ...overlays),
  );
}

const attrNames: Record<string, string> = {
  fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight', fontStyle: 'font-style',
  textAnchor: 'text-anchor', strokeWidth: 'stroke-width', strokeLinejoin: 'stroke-linejoin',
  strokeLinecap: 'stroke-linecap', floodColor: 'flood-color', floodOpacity: 'flood-opacity',
};
export const escapeXml = (value: string): string => value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]!));
export function serializeBcNode(node: SvgNode | string): string {
  if (typeof node === 'string') return escapeXml(node);
  const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${attrNames[key] ?? key}="${escapeXml(String(value))}"`).join('');
  return `<${node.tag}${attrs}>${node.children.map(serializeBcNode).join('')}</${node.tag}>`;
}
export function renderBcSvg(design: BcDesign, parts: Parts, scope?: string): string {
  return serializeBcNode(buildBcScene(design, parts, scope));
}
