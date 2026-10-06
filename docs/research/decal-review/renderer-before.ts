/**
 * Renewal decal artwork in four era layouts. Colours and text order come from
 * BCpl8s decal photos; lettering uses the condensed legend die, sizes are
 * estimated, and the control number is illustrative.
 */
import { node as n, type SvgNode } from '../../../src/templates/svg-scene';
import { buildDieText } from '../../../src/templates/dies/engine';
import { dieProfile } from '../../../src/templates/dies/profiles';

export interface DecalArt {
  style: 'annual' | 'panel' | 'bordered' | 'solid';
  background: string;
  ink: string;
  serialInk: string;
  /** Three-letter month (1980 onward). */
  month?: string;
  /** Year as printed: two digits on these decals. */
  year: string;
  serial?: string;
  /** Day-of-month sticker (1993 onward), drawn in its own well when the base has one. */
  day?: string;
  /** Width-to-height ratio of the decal, estimated from photos. */
  aspect: number;
}

/** The decal's own rectangle, centred in a well and never wider than its real proportions. */
export function decalBox(art: DecalArt, well: Box, inset = 1.5): Box {
  const height = well.height - 2 * inset;
  const width = Math.min(well.width - 2 * inset, height * art.aspect);
  return { x: well.x + (well.width - width) / 2, y: well.y + inset, width, height };
}
export interface Box { x: number; y: number; width: number; height: number }

const DIE = () => dieProfile('bc-legend-condensed');
function t(text: string, x: number, baseline: number, cap: number, maxWidth: number, ink: string, role: string, anchor: 'start' | 'middle' | 'end' = 'middle'): SvgNode {
  return buildDieText({ text, profile: DIE(), x, baseline, capHeight: cap, maxWidth, anchor, ink, role }).node;
}

export function buildDecal(art: DecalArt, b: Box): SvgNode {
  const { x, y, width: w, height: h } = b;
  const parts: SvgNode[] = [];
  if (art.style === 'annual') {
    parts.push(n('rect', { x, y, width: w, height: h, fill: art.background }),
      t(art.year, x + w * 0.27, y + h * 0.86, h * 0.72, w * 0.48, art.ink, 'decal-year'),
      t('BRITISH', x + w * 0.76, y + h * 0.3, h * 0.15, w * 0.42, art.ink, 'decal-legend'),
      t('COLUMBIA', x + w * 0.76, y + h * 0.52, h * 0.15, w * 0.42, art.ink, 'decal-legend'),
      ...(art.serial ? [t(art.serial, x + w * 0.76, y + h * 0.85, h * 0.18, w * 0.42, art.serialInk, 'decal-serial')] : []));
  } else {
    const bordered = art.style === 'bordered';
    const edge = bordered ? h * 0.12 : 0;
    parts.push(n('rect', { x, y, width: w, height: h, rx: art.style === 'solid' ? h * 0.08 : 0, fill: art.background }));
    if (bordered) parts.push(n('rect', { x: x + edge / 2, y: y + edge / 2, width: w - edge, height: h - edge, fill: 'none', stroke: art.ink, strokeWidth: edge }));
    const inner = { x: x + edge, w: w - 2 * edge, top: y + edge, h: h - 2 * edge };
    parts.push(
      t(art.month ?? '', inner.x + inner.w * 0.02, inner.top + inner.h * 0.82, inner.h * 0.62, inner.w * 0.3, art.ink, 'decal-month', 'start'),
      t(art.year, inner.x + inner.w * 0.98, inner.top + inner.h * 0.82, inner.h * 0.66, inner.w * 0.28, art.ink, 'decal-year', 'end'),
      t('BRITISH', inner.x + inner.w * 0.5, inner.top + inner.h * 0.28, inner.h * 0.16, inner.w * 0.32, art.ink, 'decal-legend'),
      t('COLUMBIA', inner.x + inner.w * 0.5, inner.top + inner.h * 0.5, inner.h * 0.16, inner.w * 0.32, art.ink, 'decal-legend'),
      ...(art.serial ? [t(art.serial, inner.x + inner.w * 0.5, inner.top + inner.h * 0.86, inner.h * 0.2, inner.w * 0.34, art.serialInk, 'decal-serial')] : []));
  }
  return n('g', { 'data-role': 'renewal-decal', 'data-accuracy': 'approximate' }, ...parts);
}

/** White day-of-month sticker with a black number. */
export function buildDaySticker(day: string, b: Box): SvgNode {
  return n('g', { 'data-role': 'day-decal' },
    n('rect', { x: b.x, y: b.y, width: b.width, height: b.height, rx: 1.5, fill: '#eef3f5', stroke: '#c9cfd4', strokeWidth: 0.4 }),
    t(day, b.x + b.width / 2, b.y + b.height * 0.74, b.height * 0.46, b.width * 0.7, '#111111', 'day-number'));
}
