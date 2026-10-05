import {describe, expect, it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRng} from '../../core/random';
import type {PlateFormat} from '../../core/types';
import {groupByCountry} from '../../core/timeline';
import {BUILT_IN_REGIONS} from '../index';
import {bcTemplate} from '../../templates/bc';
import {britishColumbia} from './index';
import {canadaFederal} from './federal';
import {FEDERAL_CATALOG, federalGalleryFormats} from './federal-plates';
import {kitRecipe} from './bc-kit';
import {dieProfile} from '../../templates/dies/profiles';
import inventory from '../../../docs/research/canada-federal/inventory.json';

function render(format: PlateFormat, serial?: string) {
  const parts = {...format.generate(createRng(`federal:${format.id}`)), ...(serial===undefined?{}:{serial})};
  expect(format.validate?.(parts)).toBeNull();
  return renderToStaticMarkup(createElement(bcTemplate.render, {parts,
    design:{...canadaFederal.design,...format.design} as Parameters<typeof bcTemplate.render>[0]['design'],
    text:format.text?.(parts)??parts.serial??''}));
}
describe('Canadian federal plates', () => {
  it('keeps national and provincial registrations in their respective jurisdictions', () => {
    const canada=groupByCountry(BUILT_IN_REGIONS).flatMap(c=>c.countries).find(c=>c.country==='Canada')!;
    expect(canada.regions).toContain(canadaFederal);expect(canada.regions).toHaveLength(14);
    expect(canadaFederal.formats).toHaveLength(35);
    expect(britishColumbia.formats.some(f=>f.id==='official-defence-1968')).toBe(true);
    expect(britishColumbia.formats).toHaveLength(446);
    expect(new Set(canadaFederal.formats.map(f=>f.id)).size).toBe(canadaFederal.formats.length);
  });
  it.each(canadaFederal.formats.slice(0,2))('$id preserves its previously published source recipe', format => {
    const source: PlateFormat=britishColumbia.formats.find(f=>f.id===format.design!.formatId)!;
    expect(format.design!.kit).toBe(source.design!.kit);expect(format.references).toEqual(source.references);
  });
  it.each(canadaFederal.formats)('$id generates valid national SVGs without a provincial title', format => {
    for(let i=0;i<20;i++)expect(format.validate?.(format.generate(createRng(`${format.id}:${i}`)))).toBeNull();
    const markup=render(format);expect(markup).toContain('&quot;jurisdiction&quot;:&quot;CA&quot;');
    expect(markup).toContain('aria-label="Canada ·');expect(markup).not.toContain('aria-label="British Columbia ·');
    expect(markup).not.toMatch(/NaN|undefined|Infinity/);
  });
  it('accounts for every gallery occurrence, duplicates and provincial exclusions', () => {
    expect(inventory.references).toHaveLength(41);expect(inventory.excludedRegional).toHaveLength(13);
    expect(new Set(inventory.references.map(r=>r.id)).size).toBe(41);
    for(const ref of inventory.references){
      const format=canadaFederal.formats.find(f=>f.id===ref.preset)!;
      expect(format).toBeDefined();
      if(format.fields.some(f=>f.key==='serial'))expect(format.validate?.({...format.generate(createRng(ref.id)),serial:ref.serial})).toBeNull();
      expect(ref.box[0]).toBeGreaterThanOrEqual(0);expect(ref.box[2]).toBeLessThanOrEqual(ref.imageSize[0]);
      expect(ref.box[1]).toBeGreaterThanOrEqual(0);expect(ref.box[3]).toBeLessThanOrEqual(ref.imageSize[1]);
    }
    expect(FEDERAL_CATALOG).toEqual(inventory.presets);
    for(const spec of FEDERAL_CATALOG)expect(inventory.references.filter(r=>r.preset===spec.id).map(r=>r.id)).toEqual(spec.referenceIds);
  });
  it('preserves leading zeroes, compact stacked layout, and uncertain plate roles', () => {
    expect(render(canadaFederal.formats.find(f=>f.id==='fisheries-bilingual')!,'076775')).toContain('076775');
    const stacked=render(canadaFederal.formats.find(f=>f.id==='germany-cdn-2016-stacked')!,'WE898');
    expect(stacked).toContain('serial-prefix');expect(stacked).toContain('serial-number');expect(stacked).toContain('CDN');
    expect(canadaFederal.formats.find(f=>f.id==='ppcli-air-comdet')?.status).toBe('uncertain');
    expect(canadaFederal.formats.find(f=>f.id==='military-flag-unknown')?.period).toBeUndefined();
    expect(canadaFederal.formats.find(f=>f.id==='rcaf-4-wing-booster')?.status).toBe('souvenir');
  });
  it('leaves undated sources undated and permits overlapping overseas lettering periods', () => {
    for(const spec of FEDERAL_CATALOG.filter(s=>!s.period)){
      const f=canadaFederal.formats.find(f=>f.id===spec.id)!;expect(f.period).toBeUndefined();expect(f.design!.year).toBeUndefined();
    }
    expect(canadaFederal.formats.find(f=>f.id==='europe-red-block')!.period).toEqual([1985,2016]);
    expect(canadaFederal.formats.find(f=>f.id==='europe-red-narrow')!.period).toEqual([1990,2016]);
    for(const format of federalGalleryFormats){
      const recipe=kitRecipe(String(format.design!.kit));const profile=dieProfile(recipe.serial.die);
      expect(profile.id).toMatch(/^ca-federal-/);expect(profile.maker).toBeUndefined();
      expect(profile.allowResearchReplacement).toBe(false);expect(profile.evidence.status).toBe('category');
    }
  });
});
