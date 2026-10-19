import {describe,expect,it} from 'vitest';
import {inspectSvgTypography} from './font-inspection';
import type {FontAsset} from '../core/types';
function svg(text:string,family='Example',weight='700',style='normal'):SVGSVGElement{
  const element={childNodes:[{nodeType:3,textContent:text}],getAttribute:()=>null};
  return {ownerDocument:{defaultView:{getComputedStyle:()=>({fontFamily:family,fontSize:'20px',fontWeight:weight,fontStyle:style})}},querySelectorAll:(selector:string)=>selector==='text, tspan, textPath'?[element]:[]} as unknown as SVGSVGElement;
}
const face:FontAsset={id:'example',family:'Example',weight:700,style:'normal',url:'/e',unicodeRange:'U+41-5A',sourceVersion:'1.0',license:{status:'open',label:'OFL',sourceUrl:'source'}};
describe('rendered typography inspection',()=>{
  it('selects the actual used weight without embedding unused faces',()=>{const result=inspectSvgTypography(svg('KOR'),[face,{...face,id:'other',weight:600}]);expect(result.faces).toEqual([face]);expect(result.warnings).toEqual([]);});
  it('includes the Latin-extended subset when needed',()=>{const ext={...face,id:'ext',unicodeRange:'U+100-17F'};expect(inspectSvgTypography(svg('AĀ'),[face,ext]).faces).toHaveLength(2);});
  it('reports unbundled character fallback',()=>expect(inspectSvgTypography(svg('京'),[face]).warnings.join()).toContain('Unbundled fallback'));
  it('does not clear unverified licences just because an asset loads',()=>expect(inspectSvgTypography(svg('ABC'),[{...face,license:{...face.license!,status:'unverified'}}]).warnings.join()).toContain('Example:'));
  it('labels nearest-weight and style substitutions',()=>{const result=inspectSvgTypography(svg('ABC','Example','600','italic'),[face]);expect(result.warnings.join()).toContain('Weight substitution');expect(result.warnings.join()).toContain('Style substitution');});
  it('does not claim an unregistered OS font is bundled',()=>expect(inspectSvgTypography(svg('ABC','Unknown, serif'),[face]).systemFamilies).toHaveLength(1));
});
