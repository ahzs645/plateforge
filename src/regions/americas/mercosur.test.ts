import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { formatText } from '../../core/format';
import { createRng } from '../../core/random';
import type { Region } from '../../core/types';
import { BR_USES, mercosurTemplate } from '../../templates/mercosur';
import { BR_UFS, UY_DEPARTMENTS, argentina, brToMercosur, brazil, mercosurRegions, paraguay, uruguay, uyDepartment } from './mercosur';

const fmt = (region: Region, id: string) => {
  const f = region.formats.find((x) => x.id === id);
  if (!f) throw new Error(`missing format ${region.id}/${id}`);
  return f;
};

describe('Mercosur serial shapes', () => {
  const cases: Array<[Region, string, RegExp]> = [
    [brazil, 'mercosur-particular', /^[A-Z]{3}\d[A-Z]\d{2}$/],
    [brazil, 'mercosur-motorcycle', /^[A-Z]{3}\d[A-Z]\d{2}$/],
    [brazil, 'grey-particular', /^[A-Z]{3}-\d{4}$/],
    [argentina, 'mercosur', /^A[A-G] \d{3} [A-Z]{2}$/],
    [argentina, 'mercosur-motorcycle', /^[A-Z]\d{3}[A-Z]{3}$/],
    [argentina, 'black-1995', /^[A-Z]{3} \d{3}$/],
    [uruguay, 'mercosur', /^[A-S][A-Z]{2} \d{4}$/],
    [uruguay, 'mercosur-motorcycle', /^[A-S][A-Z]{2} \d{3}$/],
    [uruguay, 'mercosur-special', /^[A-S](OF|TX|AM|TC|ES|TU|AL|RE|TP|ME|DI) \d{4}$/],
    [paraguay, 'mercosur', /^[A-Z]{4} \d{3}$/],
    [paraguay, 'mercosur-motorcycle', /^\d{3} [A-Z]{4}$/],
  ];
  for (const [region, id, shape] of cases) {
    it(`${region.id}/${id}`, () => {
      const f = fmt(region, id);
      const rng = createRng(`${region.id}/${id}`);
      for (let i = 0; i < 300; i++) expect(formatText(f, f.generate(rng))).toMatch(shape);
    });
  }

  it('rejects other countries’ shapes', () => {
    expect(fmt(brazil, 'mercosur-particular').validate?.({ serial: 'ABC1234' })).not.toBeNull();
    expect(fmt(argentina, 'mercosur').validate?.({ serial: 'AB123CD' })).not.toBeNull();
    expect(fmt(paraguay, 'mercosur').validate?.({ serial: 'ABC 1234' })).not.toBeNull();
    expect(fmt(paraguay, 'mercosur-motorcycle').validate?.({ serial: 'ABCD 123' })).not.toBeNull();
  });
});

describe('Brazil', () => {
  it('maps use classes to Res. 780/2019 character colours', () => {
    expect(Object.fromEntries(BR_USES.map((u) => [u.id, u.colour]))).toEqual({
      particular: 'black', commercial: 'red', official: 'blue', diplomatic: 'gold', special: 'green', collector: 'silver-grey',
    });
    for (const use of BR_USES) expect(fmt(brazil, `mercosur-${use.id}`).design?.ink).toBe(use.ink);
    // The motorcycle plate takes its colour from the selected use.
    const moto = fmt(brazil, 'mercosur-motorcycle');
    const svg = renderToStaticMarkup(mercosurTemplate.render({ parts: { serial: 'ABC1D23', use: 'commercial' }, design: { ...brazil.design, ...moto.design }, text: 'ABC1D23' }));
    expect(svg).toContain(BR_USES[1].ink);
  });

  it('converts old plates with the Annex II table', () => {
    expect(brToMercosur('ABC-1234')).toBe('ABC1C34');
    expect(brToMercosur('XYZ0987')).toBe('XYZ0J87');
    expect(brToMercosur('AB-1234')).toBeNull();
  });

  it('grey plates carry UF and municipality', () => {
    expect(BR_UFS).toHaveLength(27);
    const parts = fmt(brazil, 'grey-particular').generate(createRng('tarjeta'));
    expect(BR_UFS.some(([uf, , capital]) => uf === parts.uf && capital === parts.city)).toBe(true);
  });
});

describe('Uruguay departments', () => {
  it('lists the 19 department letters A–S', () => {
    expect(UY_DEPARTMENTS.map(([l]) => l).join('')).toBe('ABCDEFGHIJKLMNOPQRS');
    expect(uyDepartment('SAB 1234')).toBe('Montevideo');
    expect(uyDepartment('ABC 1234')).toBe('Canelones');
  });
  it('rejects serials whose first letter is not a department', () => {
    const car = fmt(uruguay, 'mercosur');
    expect(car.validate?.({ serial: 'SAB 1234' })).toBeNull();
    expect(car.validate?.({ serial: 'TAB 1234' })).toMatch(/department/);
    expect(car.validate?.({ serial: 'ZZZ 1234' })).toMatch(/department/);
    expect(fmt(uruguay, 'mercosur-motorcycle').validate?.({ serial: 'XAB 123' })).toMatch(/department/);
  });
});

describe('Mercosur template', () => {
  it('draws 400 × 130 cars, 200 × 170 motorcycles and the older sizes', () => {
    expect(mercosurTemplate.size({})).toEqual({ width: 400, height: 130 });
    expect(mercosurTemplate.size({ moto: true })).toEqual({ width: 200, height: 170 });
    expect(mercosurTemplate.size({ series: 'br-grey', moto: true })).toEqual({ width: 187, height: 136 });
    expect(mercosurTemplate.size({ series: 'ar-1995' })).toEqual({ width: 294, height: 129 });
  });

  it('renders every format with its country band', () => {
    const band: Record<string, string> = { br: 'BRASIL', ar: 'REPUBLICA ARGENTINA', uy: 'URUGUAY', py: 'PARAGUAY' };
    for (const region of mercosurRegions) {
      for (const format of region.formats) {
        const parts = format.generate(createRng(format.id));
        const design = { ...region.design, ...format.design };
        const size = mercosurTemplate.size(design, parts);
        const svg = renderToStaticMarkup(mercosurTemplate.render({ parts, design, text: formatText(format, parts) }));
        expect(svg).toContain(`viewBox="0 0 ${size.width} ${size.height}"`);
        expect(svg).not.toMatch(/NaN|undefined/);
        if (!design.series) expect(svg).toContain(band[region.id]);
        if (design.moto && !design.series) expect(size).toEqual({ width: 200, height: 170 });
      }
    }
  });
});
