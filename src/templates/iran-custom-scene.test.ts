import { describe, expect, it } from 'vitest';
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_SOURCE_COVERAGE, iranCustomizerState, renderIranCustom, applyIranClass, iranCustomSize } from './iran-custom-scene';
import { generateIranNumber } from './iran-number-generation';
import { IRAN_EVIDENCE_RECORDS } from './iran-custom-evidence';
const art=(svg:string)=>svg.replace(/<metadata[^>]*>[\s\S]*?<\/metadata>/g,'').replace(/<title>[\s\S]*?<\/title>/g,'').replace(/<desc>[\s\S]*?<\/desc>/g,'');
describe('Iran full-scope flat scene engine',()=>{
 it('renders every frozen preset with valid defaults and self-contained vector geometry',()=>{
  expect(IRAN_CUSTOM_PRESETS.length).toBe(53);
  expect(new Set(IRAN_CUSTOM_PRESETS.map(p=>p.id)).size).toBe(53);
  for(const p of IRAN_CUSTOM_PRESETS){
   const s=renderIranCustom(iranCustomizerState(p.id));
   expect(s.errors,p.id).toEqual([]);expect(s.width).toBeGreaterThan(100);expect(s.height).toBeGreaterThan(80);
   expect(s.svg,p.id).toContain('data-canonical="true"');expect(s.svg).not.toMatch(/<(?:image|text|foreignObject|script)\b/);
   expect(s.svg).not.toMatch(/NaN|Infinity|undefined/);expect(s.svg).toContain('<metadata');expect(s.svg).toContain('<path');
   expect(p.sourceArtworks.length,p.id).toBeGreaterThan(0);
  }
 });
 it('maps every requested-source/prior image or supporting text to a preset or explicit barrier',()=>{
  expect(IRAN_EVIDENCE_RECORDS).toHaveLength(66);
  expect(IRAN_EVIDENCE_RECORDS.filter(x=>x.scope==='requested-source')).toHaveLength(52);
  expect(IRAN_EVIDENCE_RECORDS.filter(x=>x.scope==='prior-inspected')).toHaveLength(11);
  expect(IRAN_EVIDENCE_RECORDS.filter(x=>x.scope==='supporting-text')).toHaveLength(3);
  for(const row of IRAN_CUSTOM_SOURCE_COVERAGE){expect(row.sourceUrl).toMatch(/^https?:/);expect(row.note.length).toBeGreaterThan(5);if(row.presetId)expect(IRAN_CUSTOM_PRESETS.some(x=>x.id===row.presetId),row.id).toBe(true);}
  expect(IRAN_CUSTOM_SOURCE_COVERAGE.find(x=>x.id==='ir-wlp-fake-police')?.presetId).toBeNull();
  expect(IRAN_CUSTOM_PRESETS.some(x=>x.kind==='free-zone-2017')).toBe(false);
 });
 it('keeps historical zeros but rejects them in ordinary national main serials',()=>{
  const h=iranCustomizerState('historical-1342');expect(renderIranCustom(h).errors).toEqual([]);
  expect(renderIranCustom({...h,serial:'00000'}).errors).toEqual([]);
  const n=iranCustomizerState('national-private');expect(renderIranCustom({...n,serial:'305'}).errors.join()).toContain('zero');
  expect(renderIranCustom({...n,code:'10'}).errors).toEqual([]);
  expect(renderIranCustom({...n,prefix:'۱۲',serial:'۳۴۵',code:'۱۰'}).errors).toEqual([]);
  expect(renderIranCustom({...n,letter:'ه'}).svg).toContain('هـ');
 });
 it('preserves flat repeated editing with real art changes for numeric inputs',()=>{
  for(const p of IRAN_CUSTOM_PRESETS){let state=iranCustomizerState(p.id);const original=art(renderIranCustom(state).svg);
   state=generateIranNumber(state,'scene-repeat-'+p.id);
   expect(renderIranCustom(state).errors,p.id).toEqual([]);
   expect(art(renderIranCustom(state).svg),p.id).not.toBe(original);
   expect(renderIranCustom(iranCustomizerState(p.id)).svg).toBe(renderIranCustom(p.defaults).svg);
  }
 });
 it('moves live layout, scale, spacing and colors without editing static photograph strings',()=>{
  const s=iranCustomizerState('national-private'),original=art(renderIranCustom(s).svg);
  for(const patch of [{mainScale:.6},{mainScale:1.1},{tracking:10},{bg:'#112233'},{ink:'#887766'},{strip:'#aa3388'},{border:false},{layout:'compact' as const}])expect(art(renderIranCustom({...s,...patch}).svg)).not.toBe(original);
  expect(iranCustomSize({...s,layout:'compact'})).toEqual({width:320,height:160});
  expect(iranCustomSize({...s,aspectRatio:4})).toEqual({width:520,height:130});
  expect(renderIranCustom({...s,aspectRatio:7}).errors.join()).toContain('Aspect ratio');
 });
 it('uses historical year tabs, correct temporary divisions and nonstandard national titles',()=>{
  const y=renderIranCustom(iranCustomizerState('historical-1335')).svg;
  expect(y).toContain('<g color="#faf7e9" fill="currentColor">');
  expect(renderIranCustom(iranCustomizerState('temporary-old')).svg).toContain('M3 77.5L85.12 77.5');
  expect(renderIranCustom(iranCustomizerState('national-diplomatic')).svg).toContain('سیاسی');
  expect(renderIranCustom(iranCustomizerState('national-service')).svg).toContain('سرویس');
  expect(renderIranCustom(iranCustomizerState('public-2002')).svg).toContain('fill="#165099"');
 });
 it('treats missing joined words as export errors and permits only explicit labelled fallback',()=>{
  const s={...iranCustomizerState('full-city-gilan'),city:'tehran',missingPolicy:'strict' as const};
  expect(renderIranCustom(s).errors.length).toBeGreaterThan(0);
  const f=renderIranCustom({...s,missingPolicy:'fallback'});expect(f.errors).toEqual([]);expect(f.warnings.join()).toMatch(/fallback/i);
  expect(renderIranCustom({...iranCustomizerState('national-private'),letter:'\uE001'}).errors.length).toBeGreaterThan(0);
 });
 it('keeps the explicit photographic national arrangement editable and class-bounded',()=>{
  for(const id of ['national-private','national-public']){
   let state={...iranCustomizerState(id),nationalVariant:'early-photo' as const};
   for(let i=0;i<20;i++){state=generateIranNumber(state,'photo-'+id+i) as typeof state;expect(renderIranCustom(state).errors).toEqual([]);expect(state.nationalVariant).toBe('early-photo');}
   expect(applyIranClass(state,'government').nationalVariant).toBe('diagram');
  }
  expect(renderIranCustom({...iranCustomizerState('national-government'),nationalVariant:'early-photo'}).errors.join()).toContain('documented only');
 });
 it('escapes injected state and safely rejects invalid colors, IDs, profile and calendar fields',()=>{
  const s=iranCustomizerState('historical-1335');
  const r=renderIranCustom({...s,letter:'<script>alert(1)</script>',bg:'red"/><script>',year:'1963',fontProfile:'not-a-font'});
  expect(r.errors.length).toBeGreaterThan(0);expect(r.svg).not.toContain('<script>');expect(r.svg).not.toContain('NaN');
  expect(renderIranCustom({...iranCustomizerState('temporary'),expiry:'1405/13'}).errors.length).toBeGreaterThan(0);
  expect(renderIranCustom({...s,tracking:NaN,mainScale:Infinity}).errors.length).toBeGreaterThan(0);
 });
 it('changes national vehicle class lettering, palette and right-hand heading together',()=>{
  const state=applyIranClass(iranCustomizerState('national-private'),'service');
  expect(applyIranClass(state,'private').letter).toBe('ب');
  expect(state.code).toBe('11');expect(state.letter).toBe('S');expect(state.bg).toBe('#00a2e8');expect(renderIranCustom({...state,serial:'214'}).errors).toEqual([]);
 });
 it('never adds evidence-free 1979 or 2017 geometry and discloses omitted tiny artwork',()=>{
  expect(IRAN_CUSTOM_PRESETS.some(x=>x.id.includes('1979'))).toBe(false);
  expect(renderIranCustom(iranCustomizerState('international-2010')).warnings.join()).toContain('medallion is omitted');
  expect(IRAN_CUSTOM_SOURCE_COVERAGE.filter(x=>x.id.startsWith('ir-freezone-2017')).every(x=>x.presetId===null)).toBe(true);
 });
});
