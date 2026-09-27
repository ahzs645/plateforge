/**
 * Plate artwork masters, drawn as simple flat vectors in their own unit boxes
 * and placed by recipes. They are approximate reconstructions sized for a
 * licence plate, not official artwork files.
 */
import { node as n, type SvgNode } from '../svg-scene';

export interface ArtBox { x: number; y: number; width: number; height: number }
interface ArtMaster { viewBox: [number, number]; draw(): SvgNode[]; aspect?: 'stretch' | 'meet' }

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

/** The plate's waving "Spirit" flag, 100 × 76: Union Jack fragments and a scalloped sun over wavy bands. */
function spiritFlag(): SvgNode[] {
  const RED = '#c41b23', BLUE = '#1650b0', DEEP = '#0d3f95', SUN = '#f4d925';
  // A horizontal band that follows the wave: y offset = amplitude * sin.
  const band = (y0: number, thick: number, x0 = 4, x1 = 96, amp = 3.2) => {
    const pts = (y: number) => Array.from({ length: 13 }, (_, i) => { const x = x0 + ((x1 - x0) * i) / 12; return [x, y + amp * Math.sin((x / 100) * Math.PI * 2 + 0.6)] as const; });
    const top = pts(y0), bottom = pts(y0 + thick).reverse();
    return 'M' + [...top, ...bottom].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + ' Z';
  };
  const hair = { stroke: '#ffffff', strokeWidth: 1, strokeLinejoin: 'round' as const };
  const rays = Array.from({ length: 11 }, (_, i) => {
    const a = Math.PI * (0.08 + (0.84 * i) / 10);
    const r1 = 13.5, r2 = 17;
    return `${(50 - Math.cos(a) * (i % 2 ? r2 : r1)).toFixed(1)} ${(47 - Math.sin(a) * (i % 2 ? r2 : r1)).toFixed(1)}`;
  });
  return [n('g', { transform: 'skewY(-9) translate(0 9)', 'data-part': 'spirit-flag' },
    // Union Jack fragments rising above the stripes.
    n('path', { d: 'M20 22 L28 6 L44 12 L40 24 Z', fill: BLUE, ...hair }),
    n('path', { d: 'M46 24 L50 4 L56 24 Z', fill: RED, ...hair }),
    n('path', { d: 'M58 24 L64 7 L74 16 L70 24 Z', fill: BLUE, ...hair }),
    n('path', { d: 'M70 24 L90 4 L94 10 L78 26 Z', fill: RED, ...hair }),
    n('path', { d: 'M82 26 L96 14 L96 26 Z', fill: BLUE, ...hair }),
    // Stripes, top to bottom; the sun covers their centre.
    n('path', { d: band(22, 8), fill: RED, ...hair }),
    n('path', { d: band(30, 8), fill: BLUE, ...hair }),
    n('path', { d: band(38, 8), fill: RED, ...hair }),
    n('path', { d: `M${rays.join(' L')} L${(50 + 13.5 * Math.cos(Math.PI * 0.08)).toFixed(1)} 48 L${(50 - 13.5 * Math.cos(Math.PI * 0.08)).toFixed(1)} 48 Z`, fill: SUN, ...hair, 'data-part': 'sun' }),
    n('path', { d: band(46, 9), fill: BLUE, ...hair }),
    n('path', { d: band(55, 9), fill: DEEP, ...hair }),
    n('path', { d: band(64, 9), fill: DEEP, ...hair }))];
}

const MASTERS: Record<string, ArtMaster> = {
  'bc-spirit-flag': { viewBox: [100, 76], draw: spiritFlag },
  'bc-flag': { viewBox: [60, 36], draw: bcFlag },
};

export const hasArtwork = (id: string): boolean => id in MASTERS;
export function registerArtwork(id: string, master: ArtMaster): void { MASTERS[id] = master; }

/** Places an artwork master in a box (mm). */
export function artwork(id: string, box: ArtBox, role = 'artwork'): SvgNode {
  const master = MASTERS[id];
  if (!master) throw new RangeError(`Unknown plate artwork: ${id}`);
  const [vw, vh] = master.viewBox;
  const sx = box.width / vw, sy = box.height / vh;
  const [kx, ky] = master.aspect === 'stretch' ? [sx, sy] : [Math.min(sx, sy), Math.min(sx, sy)];
  const dx = box.x + (box.width - vw * kx) / 2, dy = box.y + (box.height - vh * ky) / 2;
  return n('g', { 'data-role': role, 'data-art': id, 'data-accuracy': 'approximate', transform: `translate(${dx.toFixed(3)} ${dy.toFixed(3)}) scale(${kx.toFixed(5)} ${ky.toFixed(5)})` }, ...master.draw());
}
