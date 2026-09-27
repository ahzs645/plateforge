import { describe, expect, it } from 'vitest';
import { range, randomBb26, toNumber, toString } from '../core/bb26';
import { formatText } from '../core/format';
import { compilePattern } from '../core/pattern';
import { createRng } from '../core/random';
import { generateBatch } from '../core/registry';
import { displayNumber } from './asia/japan';
import { BUILT_IN_REGIONS } from './index';
import * as us from './us/serials';

const SAMPLES = 400;

describe('every built-in format', () => {
  for (const region of BUILT_IN_REGIONS) {
    for (const format of region.formats) {
      it(`${region.id}/${format.id} generates valid, non-empty plates`, () => {
        const rng = createRng(`${region.id}/${format.id}`);
        for (let i = 0; i < SAMPLES; i++) {
          const parts = format.generate(rng);
          for (const f of format.fields) {
            expect(parts[f.key], `missing part ${f.key}`).toBeTypeOf('string');
            if (f.options) expect(f.options.map((o) => o.value)).toContain(parts[f.key]);
          }
          expect(formatText(format, parts).trim().length).toBeGreaterThan(0);
          expect(format.validate?.(parts) ?? null, JSON.stringify(parts)).toBeNull();
        }
      });
    }
  }

  it('region ids are unique', () => {
    const ids = BUILT_IN_REGIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('US serial shapes (from license-plate-serial-generator docs)', () => {
  const cases: Array<[keyof typeof us, RegExp]> = [
    ['california', /^[6-8][A-Z]{3}\d{3}$/],
    ['texas', /^[B-K][A-Z]{2}-\d{4}$/],
    ['newYork', /^[F-J][A-Z]{2}-\d{4}$/],
    ['florida', /^Z\d{2} \d[A-Z]{2}$/],
    ['connecticut', /^A[A-V]·\d{5}$/],
    ['nevada', /^\d{3}·[A-Z]\d{2}$/],
    ['massachusetts', /^1[A-HJ-NPR-TV-Z]{3} \d{2}$/],
    ['newJersey', /^[A-HJ-NPR-U]\d{2}-[A-HJ-NPR-Z]{3}$/],
    ['mississippi', /^[A-Z]{3} \d{4}$/],
    ['wyoming', /^\d{1,2}-\d{5}$/],
    ['colorado', /^[A-B][A-Z]{2}-[A-Z]\d{2}$/],
  ];
  for (const [state, shape] of cases) {
    it(state, () => {
      const rng = createRng(state);
      for (let i = 0; i < SAMPLES; i++) expect(us[state](rng)).toMatch(shape);
    });
  }
});

describe('core', () => {
  it('bb26 round-trips and ranges are half-open', () => {
    for (const s of ['A', 'Z', 'AA', 'AZ', 'ZZ', 'AAA', 'KPQ']) expect(toString(toNumber(s))).toBe(s);
    expect(range('X', 'AB')).toEqual(['X', 'Y', 'Z', 'AA']);
    const rng = createRng(1);
    for (let i = 0; i < 200; i++) expect(toNumber(randomBb26(rng, 'AA', 'AC'))).toBeLessThan(toNumber('AC'));
  });

  it('pattern DSL generates and validates', () => {
    const p = compilePattern('AA-999-{x}[B-D]\\A', { exclude: 'IO', sets: { x: 'XY' } });
    const rng = createRng('dsl');
    for (let i = 0; i < 200; i++) {
      const s = p.generate(rng);
      expect(s).toMatch(/^[A-HJ-NP-Z]{2}-\d{3}-[XY][B-D]A$/);
      expect(p.test(s)).toBe(true);
    }
    expect(p.test('AI-123-XBA')).toBe(false);
    expect(p.capacity).toBe(24 * 24 * 1000 * 2 * 3);
  });

  it('seeded batches are reproducible', () => {
    const src = { regionPool: BUILT_IN_REGIONS };
    const a = generateBatch(30, 'seed', src).map((p) => p.text);
    const b = generateBatch(30, 'seed', src).map((p) => p.text);
    expect(a).toEqual(b);
  });

  it('japanese number layout', () => {
    expect(displayNumber('1234')).toBe('12-34');
    expect(displayNumber('123')).toBe('・1-23');
    expect(displayNumber('12')).toBe('・・ 12');
    expect(displayNumber('1')).toBe('・・ ・1');
  });
});
