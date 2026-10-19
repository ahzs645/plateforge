import {describe,expect,it} from 'vitest';
import {fontFaceCss,fontHasCharacter,fontWeightRange,matchingFontFaces,parseUnicodeRange,splitFontFamilies} from './font-contract';
import type {FontAsset} from './types';
const face=(weight:number|string,style:FontAsset['style']='normal'):FontAsset=>({family:'Example',weight,style,url:'/example.woff2',unicodeRange:'U+20-7E,U+1F600'});
describe('font descriptor contract',()=>{
  it.each([100,400,500,700,1000,'400 700'])('accepts CSS weight %s',(weight)=>expect(fontWeightRange(weight)).toHaveLength(2));
  it.each([0,1001,Infinity,NaN,'','700 400','400 500 600','normal'])('rejects invalid weight %s',(weight)=>expect(()=>fontWeightRange(weight)).toThrow());
  it('escapes CSS strings and preserves exact descriptors',()=>{
    const css=fontFaceCss({...face('400 700','italic'),family:'A"<\\B'},'data:font/woff2;base64,AA==');
    expect(css).toContain('font-weight:400 700;');expect(css).toContain('font-style:italic;');expect(css).toContain('unicode-range:U+20-7E,U+1F600;');expect(css).not.toContain('<');
  });
  it('parses intervals and Unicode wildcards',()=>expect(parseUnicodeRange('U+4??, U+1F600, U+61-7A')).toEqual([[0x400,0x4ff],[0x1f600,0x1f600],[0x61,0x7a]]));
  it.each(['U+110000','U+FF-00','U+???????','U+XYZ','U+12?3','garbage'])('rejects invalid range %s',(range)=>expect(()=>parseUnicodeRange(range)).toThrow());
  it('uses codepoints rather than UTF-16 halves',()=>{expect(fontHasCharacter(face(400),'😀')).toBe(true);expect(fontHasCharacter(face(400),'京')).toBe(false);});
  it('preserves quoted comma-containing families',()=>expect(splitFontFamilies('"A, B", \'C D\', sans-serif')).toEqual(['A, B','C D','sans-serif']));
  it.each([
    [400,[300,500,600],500],[500,[300,400,600],400],[450,[400,500,600],500],
    [300,[200,400,700],200],[600,[400,500,700],700],[800,[400,700],700],
  ])('matches weight %s using CSS priorities',(requested,weights,winner)=>expect(matchingFontFaces(weights.map(w=>face(w)),'example',requested)[0].weight).toBe(winner));
  it('uses matching variable intervals and exact styles',()=>{
    const variable=face('400 700','italic');expect(matchingFontFaces([face(600),variable],'Example',600,'italic')).toEqual([variable]);
  });
  it('retains all Unicode subsets of the chosen face',()=>expect(matchingFontFaces([face(600),{...face(600),unicodeRange:'U+100-200'},face(700)],'Example',600)).toHaveLength(2));
});
