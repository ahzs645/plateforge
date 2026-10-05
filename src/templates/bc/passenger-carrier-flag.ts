import {node,type SvgNode} from '../svg-scene';
import drawing from './passenger-carrier-flag.json';

/** Supplied flag paths; pale printing is a separate plate-specific treatment. */
export function passengerCarrierFlag():SvgNode[] {
  const [x,y,w,h]=drawing.viewBox;
  return [node('g',{transform:`scale(${60/w} ${36/h}) translate(${-x} ${-y})`,
    'data-source':'user-supplied-bc-flag-svg','data-artwork':'passenger-carrier-supplied-flag'},
    ...(drawing.nodes as unknown as SvgNode[])),
    node('rect',{width:60,height:36,fill:'#ffffff',opacity:.5,'data-role':'flag-print-wash'}),
  ];
}
