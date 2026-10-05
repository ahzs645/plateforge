import { describe, expect, it } from 'vitest';
import { BC_MUNICIPAL_FORMATS } from './bc-municipal';

const format = (id: string) => BC_MUNICIPAL_FORMATS.find((f) => f.id === id)!;
const ok = (id: string, serial: string) => expect(format(id).validate?.({ serial }), `${id} ${serial}`).toBeNull();
const bad = (id: string, serial: string) => expect(format(id).validate?.({ serial }), `${id} ${serial}`).not.toBeNull();

describe('B.C. municipal and bicycle grammars', () => {
  it('accepts documented examples', () => {
    for (const s of ['9495', '17193', '757', '87']) ok('municipal-prov-1963', s);
    ok('municipal-prov-1979', '019426');
    for (const s of ['022-205', '059-761', '075-475']) ok('municipal-prov-1983', s);
    for (const s of ['2277', '84365']) ok('municipal-exempt-1963', s);
    ok('municipal-city-victoria', 'CAB 111');
    ok('municipal-vancouver-taxi-1956', 'D 489');
    for (const s of ['00']) { ok('municipal-city-trail', s); ok('municipal-city-chilliwack', s); }
    ok('municipal-city-powell-river', '000');
    for (const s of ['K220', 'P251', 'S127', '096C']) ok('bicycle-vancouver-1940s', s);
  });
  it('rejects out-of-format serials', () => {
    bad('municipal-prov-1983', '022205');
    bad('municipal-city-victoria', 'CAB111');
    bad('bicycle-vancouver-1940s', 'KK20');
  });
  it('uses unique ids within the two families', () => {
    expect(new Set(BC_MUNICIPAL_FORMATS.map((f) => f.id)).size).toBe(BC_MUNICIPAL_FORMATS.length);
    expect(BC_MUNICIPAL_FORMATS.every((f) => f.family === 'municipal' || f.family === 'bicycle')).toBe(true);
  });
});

import {kitRecipe,kitPalette} from './bc-kit';
import {buildKitScene} from '../../templates/bc/kit';
import {serializeSvgNode} from '../../templates/svg-scene';
import {dieGlyph,dieSupports} from '../../templates/dies/engine';
import {dieProfile} from '../../templates/dies/profiles';
import {FRANKFURTER_EXPO_PROFILE} from '../../templates/dies/frankfurter-expo';
describe('source-specific municipal components',()=>{
 it('separates fixed screened Frankfurter words from embossed serial tooling',()=>{
  for(const id of ['municipal-vancouver-for-hire-1986','municipal-vancouver-for-hire-1995','municipal-vancouver-taxi-1996','municipal-vancouver-taxi-1997']){
   const recipe=kitRecipe(id);expect(recipe.fontLegends).toEqual([]);
   expect(recipe.legends.every(t=>t.die==='municipal-vancouver-frankfurter'&&t.screened)).toBe(true);
   expect(recipe.serial.die).toBe('municipal-vancouver-embossed');
   const svg=serializeSvgNode(buildKitScene(recipe,{serial:id.endsWith('1986')?'':'1071'}));
   expect(svg).toContain('underlying-centennial-emblem');expect(svg).toContain('1886');expect(svg).toContain('1986');
   if(!id.endsWith('1986'))expect(svg.indexOf('underlying-centennial-emblem')).toBeLessThan(svg.indexOf('data-role="city-decal"'));
   expect(kitPalette(id,'green').ink).not.toBe(kitPalette(id,'blue').ink);
  }
  const p=dieProfile('municipal-vancouver-frankfurter');expect(p.allowResearchReplacement).toBe(false);
  expect(dieSupports(p,'Vehicle for Hire VANCOUVER TAXI CAB')).toBe(true);
  expect(dieGlyph(p,'E')!.advance).toBeCloseTo(dieGlyph(FRANKFURTER_EXPO_PROFILE,'E')!.advance,2);
  expect(dieSupports(p,'1071')).toBe(false);
 });
 it('uses separate Prince George upper/lower/date components and permits the source15',()=>{
  ok('municipal-city-prince-george','15');const r=kitRecipe('municipal-city-prince-george');
  expect(r.legends.map(t=>t.die)).toEqual(['municipal-prince-george-wide','municipal-prince-george-wide','municipal-prince-george-tall']);
  expect(r.serial.die).toBe('municipal-prince-george-digits');
  expect(dieProfile(r.serial.die).overrides?.['1']).toBeDefined();
 });
});
