/** Screened centennial municipal base underneath its replaceable renewal decal. */
import { node as n, type SvgNode } from '../svg-scene';
import { buildDieText, dieGlyph } from '../dies/engine';
import { dieProfile } from '../dies/profiles';
import '../dies/municipal-source';
import { registerArtwork } from './art';
import { vancouverCentennialArtwork } from './vancouver-centennial';
registerArtwork('municipal-vancouver-centennial-base', {viewBox:[180,105],aspect:'stretch',draw:():SvgNode[] => {
 const nodes:SvgNode[]=[n('rect',{x:4,y:56,width:172,height:18,fill:'currentColor'}),...[[76,7],[85,3.4],[90,2.4],[96,1.2]].map(([y,height])=>n('rect',{x:4,y,width:172,height,fill:'currentColor'}))];
 // The central bare-paper field houses the logo; the sticker covers it on renewed examples.
 nodes.push(n('rect',{x:45,y:76,width:90,height:28,rx:3,fill:'#f2f3ec'}));
 const word='VANCOUVER',caps=[21,14,14,14,14,14,14,14,21],profile=dieProfile('municipal-vancouver-frankfurter');
 const widths=[...word].map((c,i)=>dieGlyph(profile,c)!.advance*caps[i]/100);
 let cursor=(180-widths.reduce((a,b)=>a+b,0))/2;
 [...word].forEach((text,i)=>{nodes.push(buildDieText({text,profile,x:cursor,baseline:57+caps[i],capHeight:caps[i],anchor:'start',ink:'#f2f3ec',role:`centennial-city-${i}`}).node);cursor+=widths[i];});
 nodes.push(n('g',{transform:'translate(73 79) scale(.026)', 'data-role':'underlying-centennial-emblem'},...vancouverCentennialArtwork()));
 for(const [value,x,color] of [['1886',67,'#42b729'],['1986',112,'#2483b0']] as const){[...value].forEach((text,i)=>nodes.push(buildDieText({text,profile:dieProfile('bc-frankfurter-centennial-years'),x,baseline:84+i*4.1,capHeight:3.7,ink:color,role:`centennial-year-${value}-${i}`}).node));}
 return nodes;
}});
