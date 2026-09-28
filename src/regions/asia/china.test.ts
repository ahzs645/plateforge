import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createRng } from '../../core/random';
import { cnLayout, cnTemplate, type CnDesign } from '../../templates/cn';
import { china, serialN } from './china';

const fmt = (id: string) => china.formats.find((f) => f.id === id)!;
const designOf = (id: string) => ({ ...china.design, ...fmt(id).design }) as CnDesign;

describe('China GA 36-2018', () => {
  it('keeps the original format ids', () => {
    const ids = china.formats.map((f) => f.id);
    for (const id of ['blue', 'nev-small', 'nev-large', 'yellow', 'coach', 'hkmo']) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('limits 4- and 5-character serials to two letters', () => {
    const rng = createRng('serialN');
    for (let i = 0; i < 500; i++) {
      for (const n of [4, 5]) {
        const s = serialN(rng, n);
        expect(s).toMatch(new RegExp(`^[0-9A-HJ-NP-Z]{${n}}$`));
        expect(s.replace(/\d/g, '').length).toBeLessThanOrEqual(2);
      }
    }
    for (const id of ['blue', 'yellow', 'yellow-rear']) {
      expect(fmt(id).validate!({ province: '京', city: 'A', serial: 'ABC12' })).not.toBeNull();
      expect(fmt(id).validate!({ province: '京', city: 'A', serial: 'AB123' })).toBeNull();
      expect(fmt(id).validate!({ province: '京', city: 'A', serial: 'IO123' })).not.toBeNull();
    }
  });

  it('Hong Kong / Macau plates require 粤Z', () => {
    const v = fmt('hkmo').validate!;
    expect(v({ province: '粤', city: 'Z', serial: 'F023港' })).toBeNull();
    expect(v({ province: '粤', city: 'Z', serial: 'F023澳' })).toBeNull();
    expect(v({ province: '粤', city: 'B', serial: 'F023港' })).toMatch(/Z/);
    expect(v({ province: '京', city: 'Z', serial: 'F023港' })).toMatch(/粤/);
    expect(v({ province: '粤', city: 'Z', serial: 'F0231' })).not.toBeNull();
  });

  const bad: Record<string, Record<string, string>[]> = {
    'nev-small': [{ serial: 'Z12345' }, { serial: 'D1234' }, { serial: 'DA123B' }],
    'nev-large': [{ serial: '12345Z' }, { serial: 'D12345' }],
    'yellow-rear': [{ serial: '1234' }],
    trailer: [{ serial: '12345' }, { serial: '1234学' }, { serial: 'ABC1挂' }],
    coach: [{ serial: '1234挂' }],
    police: [{ serial: '1234' }, { serial: '12345警' }],
    'police-rear': [{ serial: '警1234' }],
    embassy: [{ org: '22', serial: '578使' }, { org: '224', serial: '578' }, { org: '224', serial: '57A使' }],
    consulate: [{ org: '224', serial: 'A8领' }, { org: '2245', serial: '78领' }, { org: '224', serial: '78使' }],
  };
  for (const [id, cases] of Object.entries(bad)) {
    it(`${id} accepts generated serials and rejects malformed ones`, () => {
      const f = fmt(id);
      const rng = createRng(id);
      let good = f.generate(rng);
      for (let i = 0; i < 300; i++, good = f.generate(rng)) expect(f.validate!(good), JSON.stringify(good)).toBeNull();
      for (const c of cases) expect(f.validate!({ ...good, ...c }), JSON.stringify(c)).not.toBeNull();
    });
  }

  it('prints separators where GA 36-2018 puts them', () => {
    expect(fmt('police').text!({ province: '京', city: 'A', serial: '0006警' })).toBe('京·A0006警');
    expect(fmt('embassy').text!({ org: '224', serial: '578使' })).toBe('224·578使');
    expect(fmt('consulate').text!({ province: '沪', org: '224', serial: '78领' })).toBe('沪224·78领');
  });

  it('small NEV boxes follow fig. 7 (45 + 43 mm, 9 mm gaps, 49 mm emblem gap)', () => {
    const L = cnLayout({ variant: 'nev' }, 8);
    expect(L.boxes.map((b) => b.x)).toEqual([15.5, 69.5, 161.5, 213.5, 265.5, 317.5, 369.5, 421.5]);
    expect(L.boxes.map((b) => b.w)).toEqual([45, 43, 43, 43, 43, 43, 43, 43]);
    expect(L.boxes.at(-1)!.x + 43).toBe(480 - 15.5);
    expect(L.emblem).toEqual({ x: 137, y: 70 });
    expect(L.separator).toBeUndefined();
  });

  it('places the separator after 1, 2, 3 or 4 characters', () => {
    const sep = (d: CnDesign) => cnLayout(d, 7).separator!.x;
    expect(sep({})).toBe(15 + 45 + 12 + 45 + 17);
    expect(sep({ separatorAfter: 1 })).toBe(15 + 45 + 17);
    expect(sep({ separatorAfter: 3 })).toBe(15.5 + 3 * 45 + 2 * 12 + 17);
    expect(sep({ separatorAfter: 4 })).toBe(15.5 + 4 * 45 + 3 * 12 + 17);
    for (const after of [1, 2, 3, 4]) expect(cnLayout({ separatorAfter: after }, 7).boxes.at(-1)!.x + 45).toBeLessThanOrEqual(425);
  });

  it('two-row plates use the fig. 6 boxes', () => {
    const L = cnLayout({ variant: 'yellow', rows: 2 }, 7);
    expect(L.boxes.slice(0, 2)).toEqual([{ x: 110, y: 15, w: 80, h: 60 }, { x: 250, y: 15, w: 80, h: 60 }]);
    expect(L.boxes.slice(2).map((b) => b.x)).toEqual([27.5, 107.5, 187.5, 267.5, 347.5]);
    expect(L.boxes.slice(2).every((b) => b.y === 90 && b.w === 65 && b.h === 110)).toBe(true);
  });

  it('sizes and renders every format per layout', () => {
    const expected: Record<string, [number, number]> = {
      blue: [440, 140], 'nev-small': [480, 140], 'nev-large': [480, 140], yellow: [440, 140], 'yellow-rear': [440, 220],
      trailer: [440, 220], coach: [440, 140], hkmo: [440, 140], police: [440, 140], 'police-rear': [440, 140], embassy: [440, 140], consulate: [440, 140],
    };
    for (const f of china.formats) {
      const design = designOf(f.id);
      const parts = f.generate(createRng(f.id));
      const { width, height } = cnTemplate.size(design, parts);
      expect([width, height], f.id).toEqual(expected[f.id]);
      const svg = renderToStaticMarkup(cnTemplate.render({ design, parts, text: f.text!(parts) }));
      expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
      expect(svg).not.toMatch(/NaN|undefined/);
      expect((svg.match(/#d7141a/g) ?? []).length, f.id).toBe(f.id.startsWith('police') ? 1 : 0);
    }
  });
});
