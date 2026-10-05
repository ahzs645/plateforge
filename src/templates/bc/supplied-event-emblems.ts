/** Supplied reconstructions; geometry and palette are preserved without live-font dependencies. */
import {node, type SvgNode} from '../svg-scene';
import asiaPacific from './supplied-asia-pacific.json';
import pacificGateway from './supplied-pacific-gateway.json';
import royal1994 from './supplied-royal-1994.json';

const artwork = (drawing: {viewBox: number[]; nodes: unknown[]}, source: string): SvgNode[] => [
  node('g', {transform: `translate(${-drawing.viewBox[0]} ${-drawing.viewBox[1]})`, 'data-source': source},
    ...(drawing.nodes as SvgNode[])),
];
export const ASIA_PACIFIC_VIEWBOX: [number, number] = [86, 84];
export const PACIFIC_GATEWAY_VIEWBOX: [number, number] = [1254, 1254];
export const ROYAL_1994_VIEWBOX: [number, number] = [250, 250];
export const asiaPacificArtwork = () => artwork(asiaPacific, 'user-supplied-canada-asia-pacific-1997-vector-package');
export const pacificGatewayArtwork = () => artwork(pacificGateway, 'user-supplied-maple-leaf-emblem-vector-package');
export const royal1994Artwork = () => artwork(royal1994, 'user-supplied-crowned-eiir-maple-emblem');
