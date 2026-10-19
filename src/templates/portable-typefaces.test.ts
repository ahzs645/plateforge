import {afterEach,describe,expect,it} from 'vitest';
import {portableFamily,CN_STACK,JP_STACK,KR_STACK} from './portable-typefaces';
import {node,serializeSvgNode} from './svg-scene';
import {applyResearchTypefaces} from './dies/research-text';
import {installResearchRegistry,setResearchDiesEnabled,withResearchContext} from './dies/research-dies';
afterEach(()=>installResearchRegistry(null));
describe('explicit portable substitutes',()=>{
  it('keeps script locales separate',()=>expect(new Set([CN_STACK,JP_STACK,KR_STACK]).size).toBe(3));
  it.each(['Harrington','Frankfurter Std Medium','ITC Avant Garde','EuroPlate','Custom Typeface'])('never renames source-specific %s',family=>expect(portableFamily(family)).toBe(family));
  it('records the previous proxy identity',()=>{const text=node('text',{fontFamily:'Georgia, serif'},'BC');expect(text.attrs['data-original-font-family']).toBe('Georgia, serif');expect(text.attrs.fontFamily).toContain('Noto Serif');});
  it('still resolves BC research bindings using their original font key',()=>{
    setResearchDiesEnabled(true);installResearchRegistry({glyphs:[[60,'M0 0H50V100H0Z']],units:{sample:{role:'legend',title:'Evidence',reviewReady:true,glyphs:{A:0}}},bindings:{sample:{'font:Georgia, serif':['sample']}}});
    const text=node('text',{fontFamily:'Georgia, serif',fontSize:20,fill:'#111','data-role':'legend'},'A');
    const svg=serializeSvgNode(withResearchContext('sample',()=>applyResearchTypefaces(text)));
    expect(svg).toContain('data-research-unit="sample"');expect(svg).toContain('data-provenance="research-candidate"');expect(svg).not.toContain('<text');
  });
});
