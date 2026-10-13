import {describe,expect,it} from 'vitest';
import type {FontAsset} from '../core/types';
import {exportFontAliases} from './font-aliases';
const face=(id:string,weight=700,style:'normal'|'italic'='normal'):FontAsset=>({id,family:'Example CJK',url:id+'.woff2',weight,style,unicodeRange:'U+4E00-9FFF'});
describe('private physical-face aliases for standalone SVG',()=>{
  it('separates equal-family CJK subsets and retains reverse CSS precedence',()=>{
    const a=face('a'),b=face('b');const result=exportFontAliases([a,b],[a,b]);
    expect(result.faces.map(f=>f.family)).toEqual(['PlateForgeExportFace0','PlateForgeExportFace1']);
    expect(result.familyFor('"Example CJK", sans-serif',700,'normal')).toBe('"PlateForgeExportFace1", "PlateForgeExportFace0", sans-serif');
    expect(result.faces.map(f=>f.url)).toEqual([a.url,b.url]);
    expect(result.metadata.map(f=>f.family)).toEqual(['Example CJK','Example CJK']);
  });
  it('does not select the wrong weight just because its alias appears first',()=>{
    const a=face('normal',400),b=face('bold',700),c=face('italic',700,'italic');
    const result=exportFontAliases([a,b,c],[a,b,c]);
    expect(result.familyFor('Example CJK',400,'normal')).toBe('"PlateForgeExportFace0"');
    expect(result.familyFor('Example CJK',700,'normal')).toBe('"PlateForgeExportFace1"');
    expect(result.familyFor('Example CJK',700,'italic')).toBe('"PlateForgeExportFace2"');
  });
  it('keeps unbundled families visible rather than relabelling them as embedded',()=>{
    const a=face('a');const result=exportFontAliases([a],[a]);
    expect(result.familyFor('Missing, cursive',400,'normal')).toBe('"Missing", cursive');
  });
  it('preserves a quoted comma in a family name',()=>{
    const a={...face('a'),family:'Example, CJK'};const result=exportFontAliases([a],[a]);
    expect(result.familyFor('"Example, CJK", sans-serif',700,'normal')).toBe('"PlateForgeExportFace0", sans-serif');
  });
});
