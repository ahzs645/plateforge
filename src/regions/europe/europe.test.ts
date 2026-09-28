import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { formatText } from '../../core/format';
import { createRng } from '../../core/random';
import type { PlateFormat, Region } from '../../core/types';
import { euRows, euTemplate, type EuDesign } from '../../templates/eu';
import { checkVanity, czechRepublic } from './czech';
import { europeRegions } from './index';

const region = (id: string) => europeRegions.find((r) => r.id === id)!;
const format = (r: Region, id: string) => r.formats.find((f) => f.id === id)!;
const cz = (id: string) => format(czechRepublic, id);
const design = (r: Region, f: PlateFormat) => ({ ...r.design, ...f.design }) as EuDesign;

describe('Czech standard series', () => {
  const std = cz('standard');
  const car = (digit: string, region: string, series: string, number: string) => std.validate!({ digit, region, series, number });

  it('prints 9R9 9999 from the region field', () => {
    expect(formatText(std, { digit: '5', region: 'A', series: '2', number: '3456' })).toBe('5A2 3456');
  });

  it('accepts only the 14 region letters', () => {
    for (const r of 'ASCPKULHEJBMTZ') expect(car('1', r, '2', '3456')).toBeNull();
    for (const r of ['D', 'F', 'G', 'X', '']) expect(car('1', r, '2', '3456')).toMatch(/region/);
  });

  it('leading digit is 1–9', () => {
    expect(car('0', 'A', '2', '3456')).toMatch(/1–9/);
  });

  it('third character is a digit or a permitted letter', () => {
    expect(car('1', 'B', 'X', '3456')).toBeNull();
    for (const l of 'GOQW') expect(car('1', 'A', l, '3456')).not.toBeNull();
    expect(car('1', 'S', 'S', '3456')).toMatch(/xSS/);
  });

  it('letter after the space only follows a letter series (Praha 1AA A000)', () => {
    expect(car('1', 'A', 'A', 'A000')).toBeNull();
    expect(car('1', 'A', '2', 'A000')).not.toBeNull();
    expect(car('1', 'A', 'A', 'O123')).not.toBeNull();
  });

  it('generates lettered series only in documented regions', () => {
    const rng = createRng('cz-series');
    for (let i = 0; i < 2000; i++) {
      const p = std.generate(rng);
      if (/[A-Z]/.test(p.series)) expect('ASBTC').toContain(p.region);
      if (/^[A-Z]/.test(p.number)) expect(p.region).toBe('A');
    }
  });

  it('motorcycles print 9R 9999', () => {
    expect(formatText(cz('motorcycle'), { digit: '1', region: 'T', number: '2345' })).toBe('1T 2345');
  });
});

describe('Czech personalised plates', () => {
  it('enforces length per vehicle', () => {
    expect(checkVanity('ABCDE123', 8)).toBeNull();
    expect(checkVanity('ABCDE12', 8)).toMatch(/Exactly 8/);
    expect(checkVanity('ABCDE12', 7)).toBeNull();
    expect(checkVanity('AB123', 5)).toBeNull();
  });

  it('bars G, O, Q, W and CH', () => {
    for (const l of 'GOQW') expect(checkVanity(`${l}BCDE123`, 8)).toMatch(new RegExp(`letter ${l}`));
    expect(checkVanity('ACHDE123', 8)).toMatch(/CH/);
    expect(checkVanity('ACDHE123', 8)).toBeNull();
  });

  it('needs a digit and only A–Z/0–9', () => {
    expect(checkVanity('ABCDEFHJ', 8)).toMatch(/digit/);
    expect(checkVanity('ABC-1234', 8)).toMatch(/Only/);
    expect(checkVanity('ABČD1234', 8)).toMatch(/Only/);
  });

  it('blocks reserved and offensive words, including digit look-alikes', () => {
    expect(checkVanity('HZS12345', 8)).toMatch(/reserved/);
    expect(checkVanity('1ARMADA2', 8)).toMatch(/reserved/);
    expect(checkVanity('P0LICIE1', 8)).toMatch(/reserved/);
  });

  it('generates valid strings for every vehicle type', () => {
    const rng = createRng('cz-vanity');
    for (const [id, len] of [['personalised', 8], ['personalised-motorcycle', 7], ['personalised-moped', 5]] as const) {
      for (let i = 0; i < 500; i++) {
        const p = cz(id).generate(rng);
        expect(p.serial).toHaveLength(len);
        expect(checkVanity(p.serial, len)).toBeNull();
      }
    }
  });

  it('prints 3 + 5, 2 + 5 and 2 + 3', () => {
    expect(formatText(cz('personalised'), { serial: 'ABC12345', layout: 'standard' })).toBe('ABC 12345');
    expect(formatText(cz('personalised-motorcycle'), { serial: 'AB12345' })).toBe('AB 12345');
    expect(formatText(cz('personalised-moped'), { serial: 'AB123' })).toBe('AB 123');
  });
});

describe('Czech special series', () => {
  it('EL plates run EL0 01AA – EL9 99ZZ', () => {
    const v = cz('electric').validate!;
    expect(v({ serial: 'EL0 01AA' })).toBeNull();
    expect(v({ serial: 'EL9 99ZZ' })).toBeNull();
    expect(v({ serial: 'EL0 00AA' })).not.toBeNull();
    expect(v({ serial: 'EL1 23AG' })).not.toBeNull();
  });
});

describe('Finland', () => {
  const v = format(region('eu-fi'), 'standard').validate!;
  const pv = format(region('eu-fi'), 'personalised').validate!;

  it('accepts 2–3 letters and 1–3 digits without a leading zero', () => {
    for (const s of ['ABC-123', 'ABC-12', 'ABC-1', 'AB-123', 'AB-1']) expect(v({ serial: s })).toBeNull();
    for (const s of ['A-1', 'ABCD-123', 'ABC-1234', 'ABC-012', 'ABC-0', 'ABC123']) expect(v({ serial: s })).not.toBeNull();
  });

  it('keeps reserved first letters and Å/Ä/Ö out of the random series', () => {
    for (const s of ['CDA-123', 'DAB-123', 'PAB-123', 'WAB-123', 'ÄBC-123']) expect(v({ serial: s })).not.toBeNull();
    expect(pv({ serial: 'PAB-12' })).toBeNull();
    expect(pv({ serial: 'ÄÖ-7' })).toBeNull();
    expect(pv({ serial: 'CDX-1' })).toMatch(/diplomatic/);
  });

  it('mostly generates three letters and three digits', () => {
    const rng = createRng('fi');
    const f = format(region('eu-fi'), 'standard');
    const serials = Array.from({ length: 1000 }, () => f.generate(rng).serial);
    expect(serials.filter((s) => /^[A-Z]{3}-\d{3}$/.test(s)).length).toBeGreaterThan(700);
    expect(serials.some((s) => /^[A-Z]{2}-/.test(s))).toBe(true);
    expect(serials.some((s) => /-\d{1,2}$/.test(s))).toBe(true);
  });
});

describe('eu template sizes', () => {
  const sizes: Record<string, [number, number]> = {
    standard: [520, 110], 'two-row': [340, 200], 'two-row-280': [280, 200], 'two-row-320': [320, 160],
    motorcycle: [200, 160], 'personalised-motorcycle': [200, 160], 'personalised-moped': [80, 110],
    electric: [520, 110], historic: [520, 110],
  };

  it('returns per-variant dimensions and a matching viewBox', () => {
    for (const [id, [width, height]] of Object.entries(sizes)) {
      const f = cz(id);
      const parts = f.generate(createRng(id));
      const d = design(czechRepublic, f);
      expect(euTemplate.size(d, parts), id).toEqual({ width, height });
      const svg = renderToStaticMarkup(euTemplate.render({ design: d, parts, text: formatText(f, parts) }));
      expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
      expect(svg).not.toMatch(/NaN|undefined/);
    }
  });

  it('follows the personalised plate-size field', () => {
    const f = cz('personalised');
    const d = design(czechRepublic, f);
    expect(euTemplate.size(d, { serial: 'ABC12345', layout: 'standard' })).toEqual({ width: 520, height: 110 });
    expect(euTemplate.size(d, { serial: 'ABC12345', layout: 'truck' })).toEqual({ width: 340, height: 200 });
    expect(euTemplate.size(d, { serial: 'ABC12345', layout: 'square' })).toEqual({ width: 320, height: 160 });
    expect(euTemplate.size(d, { serial: 'ABC12345', layout: 'bogus' })).toEqual({ width: 520, height: 110 });
  });

  it('mopeds have no EU band', () => {
    const f = cz('personalised-moped');
    const svg = renderToStaticMarkup(euTemplate.render({ design: design(czechRepublic, f), parts: { serial: 'AB123' }, text: 'AB 123' }));
    expect(svg).not.toContain('#003399');
    expect(svg).not.toContain('>CZ<');
  });

  it('splits rows at the space or the split index', () => {
    expect(euRows('5A2 3456', 3)).toEqual(['5A2', '3456']);
    expect(euRows('ABC12345', 3)).toEqual(['ABC', '12345']);
    expect(euRows('AB123', 2)).toEqual(['AB', '123']);
  });

  it('other EU regions stay 520×110', () => {
    for (const r of europeRegions.filter((x) => x.id !== 'eu-cz')) {
      for (const f of r.formats) {
        const parts = f.generate(createRng(f.id));
        expect(euTemplate.size(design(r, f), parts), `${r.id}/${f.id}`).toEqual({ width: 520, height: 110 });
      }
    }
  });
});
