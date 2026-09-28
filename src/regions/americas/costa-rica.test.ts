import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createRng } from '../../core/random';
import type { Parts } from '../../core/types';
import { crTemplate } from '../../templates/cr';
import { CR_BUS_PREFIXES, CR_SERIES_LETTERS, CR_TAXI_PREFIXES, costaRica } from './costa-rica';

const fmt = (id: string) => {
  const f = costaRica.formats.find((x) => x.id === id);
  if (!f) throw new Error(`missing format ${id}`);
  return f;
};
const text = (id: string, parts: Parts) => fmt(id).text?.(parts) ?? parts.serial;

describe('Costa Rica serial shapes', () => {
  const cases: Array<[string, RegExp]> = [
    ['private', /^[B-DF-HJ-NP-TV-Z]{3}-\d{3}$/],
    ['private-numeric', /^[1-9]\d{0,5}$/],
    ['electric', /^[A-Z]{3}-\d{3}$/],
    ['motorcycle', /^M [1-9]\d{0,5}$/],
    ['motorcycle-alpha', /^M \d{3}[A-Z]{3}$/],
    ['disabled', /^D-\d{3,4}$/],
    ['historical', /^VH \d{2,4}$/],
    ['heavy-cargo', /^C \d{1,6}$/],
    ['light-cargo', /^CL \d{1,6}$/],
    ['taxi', /^T(SJ|[ACHPGL]) \d{1,5}$/],
    ['bus', /^(SJ|[ACHPGL])B \d{1,5}$/],
    ['official', /^\d{2}-\d{4}$/],
    ['executive', /^PE \d{2}·\d{4}$/],
    ['diplomatic', /^CD \d{2}·\d{3}$/],
    ['consular', /^CC \d-\d{2}$/],
    ['mission', /^MI \d{2}·\d{3}$/],
    ['embossed-heavy-cargo', /^C\d{1,6}$/],
  ];
  for (const [id, shape] of cases) {
    it(id, () => {
      const rng = createRng(`cr/${id}`);
      for (let i = 0; i < 300; i++) expect(text(id, fmt(id).generate(rng))).toMatch(shape);
    });
  }

  it('sequential letters skip vowels but chosen plates may use them', () => {
    expect(CR_SERIES_LETTERS).not.toMatch(/[AEIOU]/);
    expect(fmt('private').validate?.({ serial: 'AEI-123' })).toBeNull();
    expect(fmt('private').validate?.({ serial: 'BBB1234' })).not.toBeNull();
    expect(fmt('private-numeric').validate?.({ serial: '1234567' })).not.toBeNull();
    expect(fmt('disabled').validate?.({ serial: 'D-12' })).not.toBeNull();
  });

  it('taxi and bus province codes', () => {
    expect(CR_TAXI_PREFIXES.map((p) => p.value)).toEqual(['TSJ', 'TA', 'TC', 'TH', 'TP', 'TG', 'TL']);
    expect(CR_BUS_PREFIXES.map((p) => p.value)).toEqual(['SJB', 'AB', 'CB', 'HB', 'PB', 'GB', 'LB']);
    expect(fmt('taxi').validate?.({ prefix: 'SJB', serial: '1234' })).not.toBeNull();
    expect(fmt('bus').validate?.({ prefix: 'SJB', serial: '1234' })).toBeNull();
  });

  it('dated formats form a timeline; undated embossed ones stay loose', () => {
    expect(fmt('electric').period).toEqual([2019, 2026]);
    expect(costaRica.formats.filter((f) => f.id.startsWith('embossed')).every((f) => !f.period)).toBe(true);
    expect(new Set(costaRica.formats.map((f) => f.id)).size).toBe(costaRica.formats.length);
  });
});

describe('Costa Rica template', () => {
  it('is 12 × 6 in (motorcycle smaller) and renders every format', () => {
    expect(crTemplate.size({})).toEqual({ width: 600, height: 300 });
    for (const format of costaRica.formats) {
      const parts = format.generate(createRng(format.id));
      const design = { ...costaRica.design, ...format.design };
      const size = crTemplate.size(design, parts);
      if (design.compact) expect(size.width).toBeLessThan(600);
      expect(size.width / size.height).toBe(2);
      const svg = renderToStaticMarkup(crTemplate.render({ parts, design, text: format.text?.(parts) ?? '' }));
      expect(svg).toContain(`viewBox="0 0 ${size.width} ${size.height}"`);
      expect(svg).toContain('COSTA RICA');
      expect(svg).not.toMatch(/NaN|undefined/);
    }
  });
});
