/**
 * Artwork for B.C. dealer, industrial and carrier plates: flat bands printed
 * under screened legends, contrasting serial dashes, the boxed class letter of
 * 1935–50 motor-carrier plates, the "BC Mark", the washed-out flag background
 * of Passenger Carrier plates and the 1934 triangular carrier plate.
 * All approximate vector reconstructions from BCpl8s photographs.
 */
import { node as n } from '../svg-scene';
import { artwork, registerArtwork } from './art';

/** A solid band in currentColor (expiry strips, RESTRICTED / OFF ROAD VEHICLE bars). */
registerArtwork('trade-solid', { viewBox: [10, 10], aspect: 'stretch', draw: () => [n('rect', { width: 10, height: 10, fill: 'currentColor' })] });

/** A serial dash in its own colour (1985–2005 Motor Carrier plates), used as an artwork separator. */
export function registerDash(id: string, color: string): void {
  registerArtwork(id, { viewBox: [10, 10], aspect: 'stretch', draw: () => [n('rect', { x: 0, y: 3.2, width: 10, height: 3.6, fill: color })] });
}

/**
 * The 1935–50 motor-carrier class letter sits in a stamped rectangle. Drawn as the
 * serial separator: the art box starts right after the letter, so the frame reaches
 * back over the letter (`letter` mm wide) and the art's width is the space before the digits.
 * The art box is `space` × `height` mm and is scaled 1:1 (stretch), so units are millimetres.
 */
export function registerLetterBox(id: string, color: string, o: { letter: number; pad: number; space: number; height: number; stroke: number }): void {
  registerArtwork(id, { viewBox: [o.space, o.height], aspect: 'stretch', draw: () => [
    n('rect', { x: -(o.letter + o.pad), y: 0, width: o.letter + 2 * o.pad, height: o.height, rx: 1.5, fill: 'none', stroke: color, strokeWidth: o.stroke }),
  ] });
}

/** The provincial flag printed faintly across a Passenger Carrier plate (2005–), 60 × 36. */
registerArtwork('trade-flag-wash', { viewBox: [60, 36], aspect: 'stretch', draw: () => [
  artwork('bc-flag', { x: 0, y: 0, width: 60, height: 36 }, 'flag-background'),
  n('rect', { width: 60, height: 36, fill: '#ffffff', opacity: 0.62 }),
] });

/** The 1934 "P.C. LICENCE" plate: a downward-pointing navy triangle with a cream border, 100 × 64. */
registerArtwork('trade-pc-triangle', { viewBox: [100, 64], aspect: 'stretch', draw: () => [
  n('path', { d: 'M2 2 H98 L52 62 Q50 64 48 62 Z', fill: '#1a2440', strokeLinejoin: 'round' }),
  n('path', { d: 'M8 5.5 H92 L51 58 Q50 59 49 58 Z', fill: 'none', stroke: '#e8dcc0', strokeWidth: 1.2, strokeLinejoin: 'round' }),
] });
