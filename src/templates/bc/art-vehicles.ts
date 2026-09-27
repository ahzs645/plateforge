/**
 * Artwork for the B.C. vehicle-class plates (commercial, farm, trailer, motorcycle).
 * Approximate flat vectors, placed by the kit recipes in regions/canada/bc-vehicles.ts.
 */
import { node as n, type SvgNode } from '../svg-scene';
import { registerArtwork } from './art';
import { totemEmblemSymbol } from './totem-emblem';

/**
 * Totem alone (no maple leaf): the 1952–54 commercial base had room for the
 * thunderbird totem but "the maple leaf had to be dropped". Reuses the passenger
 * totem geometry, lifted out of its symbol, in currentColor. Box 560 × 728.
 */
function totemOnly(): SvgNode[] {
  const symbol = totemEmblemSymbol('vehicles-totem');
  const totem = symbol.children.find((c): c is SvgNode => typeof c !== 'string' && c.attrs['data-part'] === 'totem');
  return totem ? [n('g', { transform: 'translate(-266 -197)', fill: 'currentColor', fillRule: 'evenodd', 'data-part': 'totem' }, ...totem.children)] : [];
}

/** The BC Mark used on 2011+ motorcycle plates, 60 × 34: a gold half-sun over three blue wave lines. */
function bcMark(): SvgNode[] {
  const GOLD = '#f2b21c', BLUE = '#1f55b4';
  const rays = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI * (0.1 + (0.8 * i) / 8);
    const p = (r: number) => `${(30 - Math.cos(a) * r).toFixed(2)} ${(19 - Math.sin(a) * r).toFixed(2)}`;
    return n('path', { d: `M${p(10.5)} L${p(16)}`, stroke: GOLD, strokeWidth: 2.2, strokeLinecap: 'round' });
  });
  const wave = (y: number, w: number) => n('path', { d: `M4 ${y} q6.5 -3 13 0 t13 0 t13 0 t13 0`, fill: 'none', stroke: BLUE, strokeWidth: w, strokeLinecap: 'round' });
  return [...rays, n('path', { d: 'M21 19 A9 9 0 0 1 39 19 Z', fill: GOLD }), wave(22.5, 2.6), wave(27, 2.4), wave(31, 2.2)];
}

registerArtwork('vehicles-totem', { viewBox: [560, 728], draw: totemOnly });
registerArtwork('vehicles-bc-mark', { viewBox: [60, 34], draw: bcMark });
