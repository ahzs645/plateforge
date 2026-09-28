import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createRng } from '../../core/random';
import { krTemplate } from '../../templates/kr';
import { KR_HANGUL, KR_REGIONS, korea, splitKrSerial } from './korea';

const f = (id: string) => korea.formats.find((x) => x.id === id)!;
const sample = (id: string, n = 300) => {
  const rng = createRng(id);
  return Array.from({ length: n }, () => f(id).generate(rng));
};

describe('South Korea', () => {
  it('has unique, sourced formats', () => {
    expect(new Set(korea.formats.map((x) => x.id)).size).toBe(korea.formats.length);
    for (const x of korea.formats) expect(x.references?.length).toBeGreaterThan(0);
  });

  it('keeps hangul series sets distinct and complete', () => {
    expect([...KR_HANGUL.private]).toHaveLength(32);
    expect(KR_REGIONS).toHaveLength(17);
    const all = Object.values(KR_HANGUL).join('');
    expect(new Set(all).size).toBe(all.length);
  });

  it('uses the right hangul and class ranges per class', () => {
    const cases: Array<[string, string, number, number]> = [
      ['private-2020', KR_HANGUL.private, 100, 699],
      ['private-2006', KR_HANGUL.private, 1, 69],
      ['rental', KR_HANGUL.rental, 100, 699],
      ['commercial', KR_HANGUL.commercial, 1, 97],
      ['delivery', KR_HANGUL.delivery, 80, 97],
    ];
    for (const [id, set, lo, hi] of cases) {
      for (const p of sample(id)) {
        const { cls, hangul, number } = splitKrSerial(p.serial);
        expect(set).toContain(hangul);
        expect(Number(cls)).toBeGreaterThanOrEqual(lo);
        expect(Number(cls)).toBeLessThanOrEqual(hi);
        expect(number).toMatch(/^\d{4}$/);
      }
    }
    // Commercial syllables never appear on white private plates and vice versa.
    expect(sample('private-2020').some((p) => /[바사아자배]/.test(p.serial))).toBe(false);
  });

  it('validates serial shapes', () => {
    expect(f('private-2020').validate?.({ serial: '123가 4567' })).toBeNull();
    expect(f('private-2020').validate?.({ serial: '123가4567' })).toBeNull();
    expect(f('private-2020').validate?.({ serial: '12가 4567' })).not.toBeNull();
    expect(f('private-2020').validate?.({ serial: '723가 4567' })).not.toBeNull();
    expect(f('private-2020').validate?.({ serial: '123바 4567' })).not.toBeNull();
    expect(f('private-2006').validate?.({ serial: '70가 1234' })).not.toBeNull();
    expect(f('ev').validate?.({ serial: '12가 3108' })).toBeNull();
    expect(f('ev').validate?.({ serial: '123가 3108' })).toBeNull();
    expect(f('commercial').validate?.({ region: '서울', serial: '32사 1234' })).toBeNull();
    expect(f('commercial').validate?.({ region: 'Seoul', serial: '32사 1234' })).not.toBeNull();
    expect(f('commercial').text?.({ region: '부산', serial: '90아 8057' })).toBe('부산 90아 8057');
  });

  it('sizes each layout and renders it', () => {
    const expected: Record<string, [number, number]> = {
      'private-2020': [520, 110], 'private-2006-short': [335, 155], commercial: [520, 110], 'commercial-two-row': [335, 170],
    };
    for (const [id, [w, h]] of Object.entries(expected)) {
      const design = { ...korea.design, ...f(id).design };
      const parts = f(id).generate(createRng(id));
      expect(krTemplate.size(design, parts)).toEqual({ width: w, height: h });
      const svg = renderToStaticMarkup(krTemplate.render({ design, parts, text: f(id).text?.(parts) ?? '' }));
      expect(svg).toContain(`viewBox="0 0 ${w} ${h}"`);
      expect(svg).not.toMatch(/NaN|undefined/);
    }
  });
});
