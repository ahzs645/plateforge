import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createRng } from '../../core/random';
import { vnTemplate } from '../../templates/vn';
import { VN_LETTERS, VN_PROVINCES, VN_STATE_LETTERS, vietnam } from './vietnam';

const f = (id: string) => vietnam.formats.find((x) => x.id === id)!;

describe('Vietnam', () => {
  it('has unique, sourced formats', () => {
    expect(new Set(vietnam.formats.map((x) => x.id)).size).toBe(vietnam.formats.length);
    for (const x of vietnam.formats) expect(x.references?.length).toBeGreaterThan(0);
  });

  it('uses unique allocated local codes and excludes confusable letters', () => {
    const codes = VN_PROVINCES.map(([c]) => c);
    expect(new Set(codes).size).toBe(codes.length);
    for (const c of ['13', '42', '44', '45', '46', '87', '91', '96']) expect(codes).not.toContain(c);
    expect(VN_PROVINCES.filter(([, p]) => p === 'Hà Nội').map(([c]) => c)).toEqual(['29', '30', '31', '32', '33', '40']);
    for (const ch of 'IJOQWR') expect(VN_LETTERS).not.toContain(ch);
    expect(VN_LETTERS).toHaveLength(20);
    expect(VN_STATE_LETTERS).toHaveLength(11);
    expect(f('state').fields[0].options?.some((o) => o.value === '80')).toBe(true);
    expect(f('car-long').fields[0].options?.some((o) => o.value === '80')).toBe(false);
  });

  it('validates series and numbers', () => {
    const car = f('car-long');
    expect(car.validate?.({ province: '30', series: 'A', number: '123.45' })).toBeNull();
    expect(car.text?.({ province: '30', series: 'A', number: '123.45' })).toBe('30A-123.45');
    expect(car.validate?.({ province: '30', series: 'I', number: '123.45' })).not.toBeNull();
    expect(car.validate?.({ province: '13', series: 'A', number: '123.45' })).not.toBeNull();
    expect(car.validate?.({ province: '30', series: 'A', number: '12345' })).not.toBeNull();
    expect(f('car-long-4').validate?.({ province: '29', series: 'A', number: '1234' })).toBeNull();
    expect(f('state').validate?.({ province: '80', series: 'N', number: '123.45' })).not.toBeNull();
    const moto = f('moto');
    expect(moto.validate?.({ province: '29', series: 'B1', number: '123.45' })).toBeNull();
    expect(moto.validate?.({ province: '29', series: 'B0', number: '123.45' })).not.toBeNull();
    expect(moto.text?.({ province: '29', series: 'B1', number: '123.45' })).toBe('29-B1 123.45');
    expect(f('moto-two-letter').validate?.({ province: '29', series: 'AB', number: '123.45' })).toBeNull();
    const rng = createRng('vn-state');
    for (let i = 0; i < 200; i++) expect(VN_STATE_LETTERS).toContain(f('moto-state').generate(rng).series[0]);
  });

  it('sizes each layout and renders it', () => {
    const expected: Record<string, [number, number]> = { 'car-long': [520, 110], 'car-short': [330, 165], moto: [190, 140] };
    for (const [id, [w, h]] of Object.entries(expected)) {
      const design = { ...vietnam.design, ...f(id).design };
      const parts = f(id).generate(createRng(id));
      expect(vnTemplate.size(design, parts)).toEqual({ width: w, height: h });
      const svg = renderToStaticMarkup(vnTemplate.render({ design, parts, text: f(id).text?.(parts) ?? '' }));
      expect(svg).toContain(`viewBox="0 0 ${w} ${h}"`);
      expect(svg).not.toMatch(/NaN|undefined/);
    }
  });
});
