/** User-supplied geometric reconstruction; not an authenticated historical master. */
import {node, type SvgNode} from '../svg-scene';
import drawing from './vancouver-centennial.json';
export const VANCOUVER_CENTENNIAL_VIEWBOX: [number, number] = [1236, 894];
export function vancouverCentennialArtwork(): SvgNode[] {
  return [node('g', {transform: 'translate(-150 -114)', color: '#0047BA',
    'data-source': 'user-supplied-vancouver-centennial-vector-kit',
    'data-artwork': 'vancouver-centennial-geometric-reconstruction'}, ...(drawing.nodes as unknown as SvgNode[]))];
}
