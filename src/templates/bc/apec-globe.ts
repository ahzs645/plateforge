/** Supplied historical APEC kit, preserving its expanded vector paths and clipping. */
import {node, type SvgNode} from '../svg-scene';
import drawing from './apec-globe.json';
export const APEC_GLOBE_VIEWBOX: [number, number] = [260, 136];
export function apecGlobeArtwork(): SvgNode[] {
  return [node('g', {transform: 'translate(-32 -40)', 'data-source': 'user-supplied-apec-vector-kit',
    'data-artwork': 'apec-historical-globe'}, ...(drawing.nodes as unknown as SvgNode[]))];
}
