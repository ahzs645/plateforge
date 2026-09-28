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

registerArtwork('vehicles-totem', { viewBox: [560, 728], draw: totemOnly });
