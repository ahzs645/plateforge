import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyDecal, filterProvinceDecals, provinceDecals } from '../library/province-decals';
import { britishColumbia as bc } from '../regions/canada';
import { canadianProvinces } from '../regions/canada/provinces';
import { registerRegion } from '../core/registry';
import { readAppRoute } from './App';
import { DecalGallery } from './DecalGallery';

vi.mock('./PlateView', () => ({ PlateView: () => <svg aria-label="Current plate" /> }));
registerRegion(bc, canadianProvinces.find(region => region.id === 'ca-ab')!);
const flag = bc.formats.find(format => format.id === '1985-flag')!;
const carrier = bc.formats.find(format => format.id === 'carrier-passenger-2005')!;
const parts = { serial: 'XXH-578', decal: '1996', decalMonth: 'APR', die: 'bc-astro-4', finish: 'flat', lettering: 'die' };

describe('Province decal gallery', () => {
  it('sorts same-year variants together and keeps unissued years absent', () => {
    const references = filterProvinceDecals('ca-bc', flag, '', false);
    expect(references.map(decal => decal.year)).toEqual(references.map(decal => decal.year).sort((a, b) => a - b));
    expect(references.filter(decal => [1973, 1979].includes(decal.year))).toEqual([]);
    expect(filterProvinceDecals('ca-bc', flag, '1996', false).map(decal => decal.variant)).toEqual([undefined, 'pink']);
    expect(provinceDecals('ca-ab')).toEqual([]);
  });
  it('applies supported variants while preserving serial, month, dies and finish', () => {
    const pink = provinceDecals('ca-bc').find(decal => decal.year === 1996 && decal.variant === 'pink')!;
    expect(applyDecal(flag, parts, pink)).toEqual({ ...parts, decal: '1996-pink' });
    expect(parts.decal).toBe('1996');
    expect(applyDecal(carrier, parts, pink)).toBe(parts);
    expect(filterProvinceDecals('ca-bc', carrier, '', true)).toEqual([]);
    expect(filterProvinceDecals('ca-bc', flag, '', true).every(decal => decal.year >= 1985 && decal.year <= 2001)).toBe(true);
  });
  it('restores province and current base from a direct gallery route', () => {
    expect(readAppRoute('#/decals/ca-bc/1985-flag')).toEqual({ region: 'ca-bc', format: '1985-flag', view: 'decals' });
    expect(readAppRoute('#/decals/ca-ab/standard')).toEqual({ region: 'ca-ab', format: 'standard', view: 'gallery' });
    expect(readAppRoute('#/ca-bc/carrier-passenger-2005').view).toBe('single');
  });
  it('labels generated artwork and source photographs separately, with a return to the current plate', () => {
    const html = renderToStaticMarkup(<DecalGallery plate={{ region: bc, format: flag, parts, text: parts.serial }} onChange={() => {}} onBack={() => {}} />);
    expect(html).toContain('British Columbia decal gallery');
    expect(html).toContain('Back to current plate');
    expect(html).toContain('Original decal photograph');
    expect(html).toContain('control numbers are illustrative');
    expect(html).toContain('data-decal-id="1996-pink"');
    expect(html).toContain('data-role="renewal-decal"');
    expect(html).not.toContain('<img');
  });
});
