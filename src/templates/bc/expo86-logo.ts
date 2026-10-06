/** User-supplied Expo86logo.svg: original primitive geometry, not a font. */
import source from './expo86-logo.json';
import {node,type SvgNode} from '../svg-scene';

export const EXPO86_LOGO_VIEWBOX = source.viewBox as [number,number];
export function expo86LogoPrimitives(wordInk='#000000',symbolInk='#1F92CF',part?:'wordmark'|'linked86'):SvgNode[] {
 return source.primitives.filter(primitive=>!part||primitive.part===part).map(primitive=>node(primitive.tag,{
  ...(primitive.attrs as unknown as SvgNode['attrs']),stroke:primitive.part==='wordmark'?wordInk:symbolInk,
  'data-logo-part':primitive.part,
 }));
}
/** Photographed booster arrangement: same supplied components, alongside one another. */
export const EXPO86_HORIZONTAL_VIEWBOX:[number,number]=[302,70];
export function expo86HorizontalPrimitives(ink='currentColor'):SvgNode[] {
 const wordScale=70/66.784,symbolScale=70/236.12;
 return [
  node('g',{transform:`scale(${wordScale}) translate(-24.399 -20.75)`},...expo86LogoPrimitives(ink,ink,'wordmark')),
  node('g',{transform:`translate(${214.351*wordScale+7} 0) scale(${symbolScale}) translate(-10.272 -93.886)`},...expo86LogoPrimitives(ink,ink,'linked86')),
 ];
}
export function buildExpo86Logo(box:{x:number;y:number;width:number;height:number},wordInk:string,symbolInk=wordInk):SvgNode {
 const [width,height]=EXPO86_LOGO_VIEWBOX;
 const scale=Math.min(box.width/width,box.height/height);
 const x=box.x+(box.width-width*scale)/2,y=box.y+(box.height-height*scale)/2;
 return node('g',{'data-role':'decal-expo-logo','data-artwork':'expo86-linked-logo','data-source':'user-supplied-Expo86logo.svg',
  'data-accuracy':'supplied geometry; photographic placement and ink approximate',
  transform:`translate(${x} ${y}) scale(${scale})`,role:'img','aria-label':'Expo 86 linked event symbol'},
  ...expo86LogoPrimitives(wordInk,symbolInk));
}
