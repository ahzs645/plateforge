import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BASE, VARIANTS, geometryGlyph, studyGlyph, glyphSvg, stripSvg } from './glyph-study.mjs';
const tests=[];
function check(name,fn){fn();tests.push({name,status:'pass'});}
check('Baseline parameters equal inspected bc-waldale source',()=>{
  assert.equal(BASE.width,53);assert.equal(BASE.stroke,11);assert.equal(BASE.curve,'oval');assert.equal(BASE.seven,'straight');
});
check('Baseline seven path equals evaluated source formula',()=>assert.deepEqual(studyGlyph('7').paths,['M5.5 5.5 H47.5 L20.34 94.5']));
check('Built-in curved seven equals evaluated source formula',()=>assert.deepEqual(studyGlyph('7','minimal').paths,['M5.5 5.5 H47.5 C43.26 38 24.5 62 22.5 94.5']));
check('Zero changes from ellipse commands to arcs and vertical segments',()=>{
  assert(studyGlyph('0').paths[0].includes('C'));
  assert(studyGlyph('0','minimal').paths[0].includes('A21 21'));
  assert(studyGlyph('0','minimal').paths[0].includes('V'));
});
check('Minimal and exploratory variants leave non-0/7 glyphs unchanged',()=>{
  for(const c of '1689AFJKLPS ')for(const v of ['minimal','exploratory'])assert.deepEqual(studyGlyph(c,v),studyGlyph(c));
});
check('Every tested variant preserves advances and stroke weights',()=>{
  for(const c of '016789AFJKLPS ')for(const v of VARIANTS){assert.equal(studyGlyph(c,v.id).advance,studyGlyph(c).advance);assert.equal(studyGlyph(c,v.id).stroke,11);}
});
check('Global stadium control also changes 6 8 9 P',()=>{
  for(const c of '689P')assert.notDeepEqual(studyGlyph(c,'global').paths,studyGlyph(c).paths);
});
check('Exploratory seven differs from both stock alternatives',()=>{
  for(const v of ['current','minimal'])assert.notDeepEqual(studyGlyph('7','exploratory'),studyGlyph('7',v));
});
check('All three serials render in every study variant',()=>{
  for(const text of ['098 SJF','976 SKP','JA7 91L'])for(const v of VARIANTS){const svg=stripSvg(text,v.id);assert(svg.startsWith('<svg'));assert(!/NaN|undefined/.test(svg));}
});
check('Unsupported glyphs/variants fail explicitly',()=>{
  assert.throws(()=>studyGlyph('Z'),RangeError);assert.throws(()=>studyGlyph('0','unknown'),RangeError);
});
check('Call ordering does not reuse another variant geometry',()=>{
  const a=studyGlyph('7','current');studyGlyph('7','minimal');assert.deepEqual(studyGlyph('7','current'),a);
});
const result={runAt:new Date().toISOString(),scope:'Isolated transcribed glyph harness; NOT repository CI or an image-match benchmark',passed:tests.length,tests};
fs.writeFileSync(new URL('./output/test-results.json',import.meta.url),JSON.stringify(result,null,2));
for(const t of tests)console.log('PASS '+t.name);
console.log(`${tests.length} isolated checks passed.`);
