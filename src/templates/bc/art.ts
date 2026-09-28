/**
 * Plate artwork masters, drawn as simple flat vectors in their own unit boxes
 * and placed by recipes. They are approximate reconstructions sized for a
 * licence plate, not official artwork files.
 */
import { node as n, type SvgNode } from '../svg-scene';
import { BC_LOGO, MONOGRAM_1914, MONOGRAM_1918, SPIRIT_FLAG } from './emblems';

export interface ArtBox { x: number; y: number; width: number; height: number }
/** A vector master drawn in its own viewBox units; `aspect: 'stretch'` fills the box, otherwise it is fitted. */
export interface ArtMaster { viewBox: [number, number]; draw(): SvgNode[]; aspect?: 'stretch' | 'meet' }

const FLAG_BLUE = '#1f3f8f', FLAG_RED = '#c8203a', FLAG_GOLD = '#f2b632';

/** Flag of British Columbia, 60 × 36: Union Jack chief with crown, sun setting over waves. */
function bcFlag(): SvgNode[] {
  const waves = [0, 1, 2, 3].map((i) => {
    const y = 22.5 + i * 3.4;
    return n('path', { d: `M0 ${y} q3.75 -1.6 7.5 0 t7.5 0 t7.5 0 t7.5 0 t7.5 0 t7.5 0 t7.5 0 t7.5 0 V${y + 1.7} q-3.75 1.6 -7.5 0 t-7.5 0 t-7.5 0 t-7.5 0 t-7.5 0 t-7.5 0 t-7.5 0 t-7.5 0 Z`, fill: FLAG_BLUE });
  });
  const rays = Array.from({ length: 13 }, (_, i) => {
    const a = Math.PI * (i / 12);
    const x1 = 30 - Math.cos(a) * 6.2, y1 = 22.5 - Math.sin(a) * 6.2, x2 = 30 - Math.cos(a) * 11, y2 = 22.5 - Math.sin(a) * 11;
    return n('path', { d: `M${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)}`, stroke: FLAG_GOLD, strokeWidth: 1.4 });
  });
  return [
    n('rect', { width: 60, height: 36, fill: '#ffffff' }),
    // Union Jack chief (top third).
    n('g', { 'data-part': 'union-chief' },
      n('rect', { width: 60, height: 12, fill: FLAG_BLUE }),
      n('path', { d: 'M0 0 L60 12 M60 0 L0 12', stroke: '#ffffff', strokeWidth: 2.4 }),
      n('path', { d: 'M0 0 L60 12 M60 0 L0 12', stroke: FLAG_RED, strokeWidth: 0.9 }),
      n('path', { d: 'M30 0 V12 M0 6 H60', stroke: '#ffffff', strokeWidth: 4 }),
      n('path', { d: 'M30 0 V12 M0 6 H60', stroke: FLAG_RED, strokeWidth: 2.2 }),
      n('path', { d: 'M27.4 4.2 l1 -2 1.6 1.2 1.6 -1.2 1 2 v2.6 h-5.2 Z', fill: FLAG_GOLD, 'data-part': 'crown' })),
    n('g', { 'data-part': 'setting-sun' }, ...rays, n('path', { d: 'M24 22.5 A6 6 0 0 1 36 22.5 Z', fill: FLAG_GOLD })),
    n('g', { 'data-part': 'waves' }, ...waves),
  ];
}

/** The plate's waving flag (shared by every 1985– flag base), 940 × 724 in the supplied vector's units. */
function spiritFlag(): SvgNode[] {
  const [x, y] = SPIRIT_FLAG.box;
  return [n('g', { transform: `translate(${-x} ${-y})`, 'data-part': 'spirit-flag' }, ...SPIRIT_FLAG.paths.map(({ fill, d }) => n('path', { d, fill })))];
}

/** Interlaced "BC" monogram of the 1918–23 steel plates and tabs, 640 × 603, drawn in currentColor. */
function bcMonogram(): SvgNode[] {
  const [x, y] = MONOGRAM_1918.box;
  return [n('path', { d: MONOGRAM_1918.d, transform: `translate(${-x} ${-y})`, fill: 'currentColor', fillRule: 'evenodd' })];
}

/** Serif "BC" monogram of the 1914 porcelain plate, 924 × 1084, drawn in currentColor. */
function bcMonogram1914(): SvgNode[] {
  const [x, y] = MONOGRAM_1914.box;
  return [n('g', { transform: `translate(${-x} ${-y})`, fill: 'currentColor' }, ...MONOGRAM_1914.paths.map(({ id, d }) => n('path', { d, 'data-part': id })))];
}

/** The B.C. government logo; `wordmark` adds BRITISH COLUMBIA below the sun and mountains.
 * `mono` draws it in currentColor with no white knockout, for dark or coloured plates. */
function bcLogo(wordmark: boolean, mono = false): () => SvgNode[] {
  const [x, y] = wordmark ? BC_LOGO.fullBox : BC_LOGO.symbolBox;
  const paths = BC_LOGO.paths.filter((p) => (wordmark || p.part !== 'wordmark') && !(mono && p.part === 'knockout'));
  return () => [n('g', { transform: `translate(${-x} ${-y})`, 'data-part': 'bc-logo' },
    ...paths.map(({ part, fill, d }) => n('path', { d, fill: mono ? 'currentColor' : fill, 'data-part': part })))];
}

/** Provincial coat of arms, simplified for small line-art use (1915–17 tin, 1919 cardboard), 50 × 62.
 * Crest crown, shield (Union upper third; sun over waves below) and motto scroll; supporters omitted. */
function bcArms(): SvgNode[] {
  const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round' as const };
  return [
    n('path', { d: 'M17 9 L19 3 L22 7 L25 2 L28 7 L31 3 L33 9 Z', ...line, 'data-part': 'crown' }),
    n('path', { d: 'M9 12 H41 V33 C41 46 33 52 25 56 C17 52 9 46 9 33 Z', ...line, 'data-part': 'shield' }),
    n('path', { d: 'M9 22 H41 M25 12 V22 M9 12 L41 22 M41 12 L9 22', ...line, strokeWidth: 1.1 }),
    n('path', { d: 'M17 32 A8 8 0 0 1 33 32', ...line }),
    ...[36, 41, 46].map((y) => n('path', { d: `M11 ${y} q3.5 -2 7 0 t7 0 t7 0 t7 0`, ...line, strokeWidth: 1.1 })),
    n('path', { d: 'M4 56 Q14 61 25 58 Q36 61 46 56 L44 61 Q35 63 25 61 Q15 63 6 61 Z', ...line, strokeWidth: 1.1, 'data-part': 'motto-scroll' }),
  ];
}

/** Cream panel with an arched top behind the 1915 coat of arms, 34 × 60. */
function armsPanel(): SvgNode[] {
  return [n('path', { d: 'M0 60 V8 Q0 0 8 0 H26 Q34 0 34 8 V60 Z', fill: '#ece4bd' })];
}

const MASTERS: Record<string, ArtMaster> = {
  'arms-panel': { viewBox: [34, 60], draw: armsPanel, aspect: 'stretch' },
  'bc-monogram': { viewBox: [MONOGRAM_1918.box[2], MONOGRAM_1918.box[3]], draw: bcMonogram },
  'bc-monogram-1914': { viewBox: [MONOGRAM_1914.box[2], MONOGRAM_1914.box[3]], draw: bcMonogram1914 },
  'bc-arms': { viewBox: [50, 62], draw: bcArms },
  'bc-spirit-flag': { viewBox: [SPIRIT_FLAG.box[2], SPIRIT_FLAG.box[3]], draw: spiritFlag },
  'bc-flag': { viewBox: [60, 36], draw: bcFlag },
  'bc-logo': { viewBox: [BC_LOGO.symbolBox[2], BC_LOGO.symbolBox[3]], draw: bcLogo(false) },
  'bc-logo-wordmark': { viewBox: [BC_LOGO.fullBox[2], BC_LOGO.fullBox[3]], draw: bcLogo(true) },
  'bc-logo-wordmark-mono': { viewBox: [BC_LOGO.fullBox[2], BC_LOGO.fullBox[3]], draw: bcLogo(true, true) },
};

export const hasArtwork = (id: string): boolean => id in MASTERS;
export function registerArtwork(id: string, master: ArtMaster): void { MASTERS[id] = master; }

/** Places an artwork master in a box (mm). */
export function artwork(id: string, box: ArtBox & { color?: string }, role = 'artwork'): SvgNode {
  const master = MASTERS[id];
  if (!master) throw new RangeError(`Unknown plate artwork: ${id}`);
  const [vw, vh] = master.viewBox;
  const sx = box.width / vw, sy = box.height / vh;
  const [kx, ky] = master.aspect === 'stretch' ? [sx, sy] : [Math.min(sx, sy), Math.min(sx, sy)];
  const dx = box.x + (box.width - vw * kx) / 2, dy = box.y + (box.height - vh * ky) / 2;
  return n('g', { 'data-role': role, 'data-art': id, 'data-accuracy': 'approximate', ...(box.color ? { color: box.color } : {}), transform: `translate(${dx.toFixed(3)} ${dy.toFixed(3)}) scale(${kx.toFixed(5)} ${ky.toFixed(5)})` }, ...master.draw());
}
