import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BRITISH_COLUMBIA } from './bc';
import { getRegions, plateforgeLink, regionFamilies, regionSections, samplePlate, templateFor } from './index';

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('embed', () => {
  it('registers British Columbia alone', () => {
    expect(getRegions().map((region) => region.id)).toEqual(['ca-bc']);
    expect(templateFor(BRITISH_COLUMBIA, BRITISH_COLUMBIA.formats[0]).id).toBe('bc-historical');
  });

  it('lays every B.C. design out once, family by family', () => {
    const families = regionFamilies(BRITISH_COLUMBIA);
    expect(families.length).toBeGreaterThan(10);
    const ids = families.flatMap((family) => regionSections(BRITISH_COLUMBIA, { family: family.id }).flatMap((section) => section.cards.map((card) => card.format.id)));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(BRITISH_COLUMBIA.formats.map((format) => format.id).sort());
    expect(regionSections(BRITISH_COLUMBIA, { query: '1953' }).every((section) => section.cards.length > 0)).toBe(true);
    const passenger = regionSections(BRITISH_COLUMBIA, { family: 'passenger' });
    expect(passenger[0]).toMatchObject({ family: 'passenger', heading: `Passenger · ${passenger[0].label}` });
  });

  it('gives every design a valid seeded sample', () => {
    for (const format of BRITISH_COLUMBIA.formats) {
      const plate = samplePlate(BRITISH_COLUMBIA, format);
      expect(format.validate?.(plate.parts) ?? null, format.id).toBeNull();
    }
  });

  it('links to the full editor', () => {
    expect(plateforgeLink(BRITISH_COLUMBIA, { id: '1953' })).toBe('https://projects.ahmadjalil.com/plateforge/#/ca-bc/1953');
    expect(plateforgeLink(BRITISH_COLUMBIA)).toBe('https://projects.ahmadjalil.com/plateforge/#/gallery/ca-bc');
  });

  it('keeps the CJK font subsets out of the shared font module', () => {
    expect(source('../templates/fonts.ts')).not.toMatch(/from '\.\/font-assets'/);
    expect(source('../templates/font-assets-core.ts')).not.toMatch(/noto-sans-(sc|jp|kr)/);
  });
});
