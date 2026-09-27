import type { Parts } from '../../core/types';
import { isLetteringType, letteringMetadata } from '../../core/lettering';
import { bcLaterRecipe, BC_LATER_NOTE, laterSerial } from '../../regions/canada/bc-later';
import { buildLettering, supportsLettering } from '../lettering';
import { node as n, type SvgNode } from '../svg-scene';
const FAMILY = '"Barlow Condensed", "Arial Narrow", sans-serif';
function text(value: string, x: number, y: number, size: number, width: number, ink: string, role: string, stretch = false): SvgNode {
  const estimate = [...value].reduce((v, c) => v + (c === ' ' ? .22 : /[·-]/.test(c) ? .20 : c === '1' ? .28 : .45), 0) * size;
  return n('text', { x, y, fill: ink, fontFamily: FAMILY, fontSize: size, fontWeight: 700, textAnchor: 'middle', textLength: stretch ? width : Math.min(width, Math.max(size * .3, estimate)), lengthAdjust: 'spacingAndGlyphs', 'data-role': role }, value);
}
export function bcLaterGeometry(design: Record<string, unknown>) {
  const r = bcLaterRecipe(design);
  return { width: r.width, height: r.height };
}
/** One shell and inscription system for annual and three permanent-base layouts. */
export function buildBcLaterScene(design: Record<string, unknown>, parts: Parts, scope = 'bc-later'): SvgNode {
  const r = bcLaterRecipe(design), w = r.width, h = r.height;
  const id = scope.replace(/[^a-zA-Z0-9_-]/g, '') || 'bc-later';
  const ink = typeof design.ink === 'string' ? design.ink : r.ink;
  const bg = typeof design.background === 'string' ? design.background : r.background;
  const serial = laterSerial(parts.serial ?? '');
  const visibleSerial = serial.replace('-', '·');
  const procedural = isLetteringType(parts.lettering) && supportsLettering(visibleSerial);
  const inscriptions: SvgNode[] = [text('BEAUTIFUL', w / 2, 28, 25, 128, ink, 'slogan', true)];
  inscriptions.push(procedural ? buildLettering({ text: visibleSerial, type: parts.lettering as 'semicircular' | 'squarish' | 'oval' | 'hybrid', centerX: w / 2, baseline: 113, height: 87, maxWidth: w - 28, ink })
    : text(visibleSerial, w / 2, 112, 112, w - 28, ink, 'serial'));
  const box = (x: number, y: number, width: number, height: number) => n('rect', { x, y, width, height, rx: 2, fill: 'none', stroke: ink, strokeWidth: 1, 'data-role': 'blank-renewal-box' });
  if (r.layout === 'annual-beautiful') {
    const bottomYear = r.datePosition === 'bottom-right';
    inscriptions.push(text('BRITISH COLUMBIA', bottomYear ? (w - 42) / 2 : w / 2, 136, 23, bottomYear ? w - 66 : w - 36, ink, 'province', true));
    inscriptions.push(text(String(r.baseYear).slice(2), w - 23, bottomYear ? 136 : 28, 26, 31, ink, 'base-year'));
    if (r.datePosition === 'split-top') inscriptions.push(text('19', 23, 28, 26, 31, ink, 'base-century'));
  } else if (r.layout === 'top-right-decal') {
    inscriptions.push(box(w - 55, 9, 44, 23), text('BRITISH COLUMBIA', w / 2, 136, 23, w - 40, ink, 'province', true));
  } else {
    const wide = r.layout === 'bottom-wide-decal', boxWidth = wide ? 64 : 39;
    const sideWidth = (w - boxWidth) / 2 - 17;
    inscriptions.push(box((w - boxWidth) / 2, 116, boxWidth, 28),
      text('BRITISH', (w - boxWidth) / 4, 136, 23, sideWidth, ink, 'province-left', true),
      text('COLUMBIA', w - (w - boxWidth) / 4, 136, 23, sideWidth, ink, 'province-right', true));
  }
  const slots = [w * .21, w * .79].flatMap((x) => [9, h - 9].map((y) => n('rect', { x: x - 11, y: y - 2.6, width: 22, height: 5.2, rx: 2.6, fill: 'black' })));
  const metadata = { jurisdiction: 'CA-BC', vehicleClass: 'passenger', baseId: r.id, baseYear: r.baseYear, issuePeriod: r.period,
    physicalMm: { width: w, height: h }, material: r.material, serial, parts, source: r.source,
    renewal: r.layout === 'annual-beautiful' ? null : { rendering: 'empty placement box only', datedDecalReconstructed: false },
    lettering: { ...letteringMetadata(procedural ? parts.lettering : 'default'), fallback: isLetteringType(parts.lettering) && !procedural },
    accuracy: { artwork: 'approximate reconstruction', dies: 'proxy or category illustration', paint: 'uncalibrated digital approximation', allocations: 'supported subset only' }, note: r.note };
  return n('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${w} ${h}`, width: w, height: h, role: 'img', 'aria-label': `British Columbia ${r.label}: ${serial}` },
    n('title', {}, `British Columbia · ${r.label} · ${serial}`), n('desc', {}, BC_LATER_NOTE), n('metadata', {}, JSON.stringify(metadata)),
    n('defs', {}, n('mask', { id: `${id}-holes`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: w, height: h }, n('rect', { width: w, height: h, fill: 'white' }), ...slots),
      n('filter', { id: `${id}-relief`, x: '-5%', y: '-10%', width: '110%', height: '125%' }, n('feDropShadow', { dx: .6, dy: .7, stdDeviation: .25, floodColor: '#000', floodOpacity: .3 }))),
    n('g', { mask: `url(#${id}-holes)` }, n('rect', { width: w, height: h, rx: 8, fill: bg, 'data-role': 'base' }),
      n('rect', { x: 4, y: 4, width: w - 8, height: h - 8, rx: 5, fill: 'none', stroke: ink, strokeWidth: 1.5 }),
      n('g', { ...(parts.finish === 'embossed' ? { filter: `url(#${id}-relief)` } : {}) }, ...inscriptions)));
}
