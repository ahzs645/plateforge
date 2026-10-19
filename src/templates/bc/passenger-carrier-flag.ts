import {node,type SvgNode} from '../svg-scene';
import drawing from './passenger-carrier-flag.json';

/** Plate-specific print arrangement. Every supplied path remains in the original master. */
export function passengerCarrierFlag():SvgNode[] {
  const [x,y,w,h]=drawing.viewBox;
  const original=drawing.nodes as unknown as SvgNode[];
  const group=original[1],paths=group.children[1] as SvgNode;
  const inks:Record<string,string>={'#0047bb':'#004c97','#d22630':'#c54542','#ffcd00':'#d4b338','#ffd200':'#d4b338'};
  const print=(item:SvgNode|string):SvgNode|string=>typeof item==='string'?item:{...item,attrs:{...item.attrs,...(typeof item.attrs.fill==='string'&&inks[item.attrs.fill]?{fill:inks[item.attrs.fill]}:{})},children:item.children.map(print)};
  const layer=(indices:number[],transform:string,role:string)=>node('g',{transform,'data-role':role},
    node('g',{transform:`scale(${60/w} ${36/h}) translate(${-x} ${-y})`},
      node('g',group.attrs,node('g',paths.attrs,...indices.map(i=>print(paths.children[i]))))));
  return [node('g',{'data-source':'user-supplied-bc-flag-svg','data-artwork':'passenger-carrier-supplied-flag'},
    original[0],node('rect',{width:60,height:36,fill:'#fff'}),
    layer([0],'translate(0 -17.64) scale(1 1.49)','carrier-wave-print'),
    layer([1,2,3,4,5],'scale(1 .6)','carrier-upper-print'),
    node('rect',{x:26.5,y:9.5,width:7,height:5,fill:'#c54542','data-role':'carrier-centre-print'}),
    layer([6,7,8,9],'translate(0 1.8) scale(1 .95)','carrier-sun-print'),
    layer([10,11,12],'translate(12 2.5) scale(.6)','carrier-crown-print')),
    node('rect',{width:60,height:36,fill:'#ffffff',opacity:.32,'data-role':'flag-print-wash'}),
  ];
}
