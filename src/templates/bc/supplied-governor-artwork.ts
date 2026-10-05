import {node as n, type SvgNode} from '../svg-scene';
import crest from './supplied-lg-crest.json';
import crown from './supplied-edward-crown.json';
import solidArms from './supplied-lg-arms-solid.json';
import {CREST_PATH} from './crest';

/** Flag rectangle is omitted; the supplied emblem is preserved inside a plaque. */
export function suppliedGovernorCrest(): SvgNode[] {
  return [
    n('circle', {cx: 75, cy: 75, r: 74, fill: '#142b78', stroke: '#c5a34a', strokeWidth: 2, 'data-part': 'gold-rimmed-crest-plaque'}),
    n('g', {transform: 'translate(20 16) scale(.22 .22) translate(-350 -39)', 'data-source': 'user-supplied-lieutenant-governor-flag-vector', 'data-palette': 'yellow-replaced-with-gold'}, ...(crest.nodes as unknown as SvgNode[])),
  ];
}

export function suppliedEdwardCrown(): SvgNode[] {
  return [n('g', {'data-source': 'user-supplied-edward-crown-goldenrod'}, ...(crown.nodes as unknown as SvgNode[]))];
}

/** Filled relief proxy, independent of the fine line arms on historical tin plates. */
export function solidGovernorArms(): SvgNode[] {
  return [
    n('path', {d: solidArms.outline, fill: '#c49a3e', 'data-part': 'solid-gold-arms-body'}),
    n('path', {d: CREST_PATH, fill: '#76551d', opacity: .42, fillRule: 'evenodd', 'data-part': 'arms-relief-detail'}),
  ];
}
