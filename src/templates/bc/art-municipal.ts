/**
 * Artwork for municipal and bicycle plates: die-cut shells (shield, hexagon,
 * notched, stepped, the 1923 Vancouver taxi disc) and a text overlay for
 * rotated and arched legends, which the kit's straight die runs cannot draw.
 * Overlays are drawn in plate millimetres (viewBox = plate size) in currentColor.
 */
import { node as n, type SvgNode } from '../svg-scene';
import { buildDieText, dieGlyph } from '../dies/engine';
import { dieProfile, registerDieProfile } from '../dies/profiles';
import { registerArtwork } from './art';

const MUNI_PAGE = { title: 'BCpl8s · Municipal city issues', url: 'https://www.bcpl8s.ca/Municipal-City-Issues.htm' };
/** Wider small-plate dies for municipal and bicycle plates (makers mostly unrecorded), matched by eye to gallery photos. */
registerDieProfile(
  { id: 'municipal-legend', label: 'Municipal · small-plate legend',
    params: { width: 64, stroke: 13, curve: 'stadium', tracking: 9, one: 'flag', three: 'round', four: 'open', seven: 'straight', narrow: 0.5, wide: 1.2 },
    evidence: { status: 'legend-approximation', specimens: [MUNI_PAGE], notes: 'Generic block legend for municipal and bicycle plates; wider than the passenger legend dies.' } },
  { id: 'municipal-serial', label: 'Municipal · small-plate numerals',
    params: { width: 58, stroke: 15, curve: 'stadium', tracking: 8, one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.6, wide: 1.2 },
    evidence: { status: 'category', specimens: [MUNI_PAGE], notes: 'Construction category only: rounded block numerals of the small municipal plates.' } },
);

const EDGE = { fill: 'none', stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1.4 };

/** Die-cut outlines in a 100 × 100 box, stretched to the plate. */
const SHELLS: Record<string, string> = {
  // Top edge dips between two raised corners; pointed round bottom.
  shield: 'M0 0 Q50 16 100 0 V52 Q97 86 50 100 Q3 86 0 52 Z',
  hex: 'M13 0 H87 L100 50 L87 100 H13 L0 50 Z',
  // Rectangle with concave (cut-out) corners.
  notch: 'M10 0 H90 A10 14 0 0 0 100 14 V86 A10 14 0 0 0 90 100 H10 A10 14 0 0 0 0 86 V14 A10 14 0 0 0 10 0 Z',
  // Nanaimo 1946: stepped sides rising to a flat top and bottom.
  step: 'M30 0 H70 V5 H76 V12 H82 V19 H88 V26 H94 V33 H100 V67 H94 V74 H88 V81 H82 V88 H76 V95 H70 V100 H30 V95 H24 V88 H18 V81 H12 V74 H6 V67 H0 V33 H6 V26 H12 V19 H18 V12 H24 V5 H30 Z',
};
for (const [name, d] of Object.entries(SHELLS)) {
  registerArtwork(`municipal-shell-${name}`, { viewBox: [100, 100], aspect: 'stretch', draw: () => [
    n('path', { d, fill: 'currentColor', 'data-part': 'shell' }),
    n('path', { d, ...EDGE, transform: 'translate(3 3) scale(0.94)' }),
  ] });
}
// 1923 Vancouver AUTO & TAXI: a disc with square side wings.
registerArtwork('municipal-shell-taxi', { viewBox: [130, 100], aspect: 'stretch', draw: () => [
  n('rect', { x: 0, y: 24, width: 130, height: 56, rx: 3, fill: 'currentColor' }),
  n('circle', { cx: 65, cy: 50, r: 50, fill: 'currentColor' }),
] });
// City of Victoria seal (1913 porcelain): ring with a small shield, simplified.
registerArtwork('municipal-victoria-seal', { viewBox: [40, 40], draw: () => [
  n('circle', { cx: 20, cy: 20, r: 19, fill: 'currentColor' }),
  n('circle', { cx: 20, cy: 20, r: 13, fill: '#eef1f5' }),
  n('path', { d: 'M13 12 H27 V21 Q27 28 20 31 Q13 28 13 21 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 }),
  n('path', { d: 'M13 17 H27 M20 12 V31', stroke: 'currentColor', strokeWidth: 0.9 }),
] });

export type OverlayItem =
  /** Text turned on its side, centred on (x, y): dir 1 reads top to bottom, -1 bottom to top. */
  | { kind: 'rot'; text: string; x: number; y: number; cap: number; die: string; dir: 1 | -1; spacing?: number }
  /** Text on a circle of baseline radius r about (cx, cy): over the top, or along the bottom reading left to right. */
  | { kind: 'arc'; text: string; cx: number; cy: number; r: number; cap: number; die: string; side: 'top' | 'bottom'; spacing?: number };

const FONT = '"Barlow Condensed", "Arial Narrow", sans-serif';

/** One character centred on x = 0 with its baseline on y = 0; typeface stand-in where the die has no glyph. */
function glyph(char: string, die: string, cap: number): { node: SvgNode; advance: number } {
  const profile = dieProfile(die), g = dieGlyph(profile, char);
  if (!g) return { node: n('text', { x: 0, y: 0, fill: 'currentColor', fontFamily: FONT, fontWeight: 700, fontSize: cap / 0.72, textAnchor: 'middle', 'data-lettering': 'typeface-proxy' }, char), advance: cap * 0.75 };
  return { node: buildDieText({ text: char, profile, x: 0, baseline: 0, capHeight: cap, anchor: 'middle', ink: 'currentColor', role: 'arc-glyph' }).node, advance: (g.advance * cap) / 100 };
}

function item(it: OverlayItem): SvgNode {
  if (it.kind === 'rot') {
    const run = buildDieText({ text: it.text, profile: dieProfile(it.die), x: 0, baseline: it.cap / 2, capHeight: it.cap, anchor: 'middle', ink: 'currentColor', role: 'rotated-legend', letterSpacing: it.spacing });
    return n('g', { transform: `translate(${it.x.toFixed(2)} ${it.y.toFixed(2)}) rotate(${90 * it.dir})` }, run.node);
  }
  const profile = dieProfile(it.die), track = ((profile.params.tracking + (it.spacing ?? 0)) * it.cap) / 100;
  const glyphs = [...it.text].map((c) => glyph(c, it.die, it.cap));
  const total = glyphs.reduce((s, g) => s + g.advance, 0) + track * (glyphs.length - 1);
  let s = -total / 2;
  const placed = glyphs.map((g) => {
    const a = (s + g.advance / 2) / it.r;
    s += g.advance + track;
    const [x, y, turn] = it.side === 'top'
      ? [it.cx + it.r * Math.sin(a), it.cy - it.r * Math.cos(a), a]
      : [it.cx + it.r * Math.sin(a), it.cy + it.r * Math.cos(a), -a];
    return n('g', { transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${((turn * 180) / Math.PI).toFixed(2)})` }, g.node);
  });
  return n('g', { 'data-role': 'arched-legend', 'aria-label': it.text }, ...placed);
}

/** Registers a plate-sized overlay of rotated/arched legends and returns its artwork id. */
export function textOverlay(id: string, width: number, height: number, items: readonly OverlayItem[]): string {
  registerArtwork(id, { viewBox: [width, height], draw: () => items.map(item) });
  return id;
}
