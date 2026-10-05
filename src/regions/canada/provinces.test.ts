import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRng } from '../../core/random';
import { getRegion, getTemplate } from '../../core/registry';
import type { PlateFormat, Region } from '../../core/types';
import { caTemplate, POLAR_BEAR_PATH, type CaDesign } from '../../templates/ca';
import { NWT_POLAR_BEAR_PATH, NWT_POLAR_BEAR_BORDER_PATH } from '../../templates/shapes/nwt-polar-bear';
import '../../templates';
import { REGIONS } from '../index';
import { canadianProvinces, series } from './provinces';

const CODES = ['AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'];
const region = (code: string) => canadianProvinces.find((r) => r.code === code)!;
const format = (code: string, id: string) => region(code).formats.find((f) => f.id === id)!;
const check = (f: PlateFormat, serial: string) => f.validate?.({ serial, lettering: 'default' }) ?? null;
const render = (r: Region, f: PlateFormat, serial?: string) => {
  const parts = serial ? { serial, lettering: 'default' } : f.generate(createRng(f.id));
  const design = { ...r.design, ...f.design } as CaDesign;
  const text = f.text?.(parts) ?? parts.serial;
  return renderToStaticMarkup(caTemplate.render({ parts, design, text }));
};

describe('Canadian provinces and territories', () => {
  it('registers every jurisdiction besides B.C. under Canada with the ca template', () => {
    expect(canadianProvinces.map((r) => r.code)).toEqual(CODES);
    for (const code of CODES) {
      const r = getRegion(`ca-${code.toLowerCase()}`);
      expect(r, code).toBeDefined();
      expect(REGIONS).toContain(r);
      expect(r).toMatchObject({ group: 'North America', country: 'Canada', flag: '🇨🇦', template: 'ca' });
      expect(r!.formats[0].id).toBe('standard');
      for (const f of r!.formats) expect(f.references?.length, `${code}/${f.id}`).toBeGreaterThan(0);
    }
    expect(getTemplate('ca')).toBe(caTemplate);
  });

  it('includes the requested variants', () => {
    expect(format('AB', 'moraine-lake-2026')).toMatchObject({ status: 'uncertain', period: [2026, 2026] });
    expect(format('QC', 'electric').design).toMatchObject({ text: '#17803d' });
    expect(format('ON', 'green-vehicle').design).toMatchObject({ slogan: 'GREEN VEHICLE', separator: 'trillium' });
    expect(region('NT').design.shape).toBe('polar-bear');
  });

  it.each([
    ['AB', 'standard', 'CKT-1800', 'ABC-1234'],
    ['AB', 'moraine-lake-2026', 'DBD-2026', 'DBO-2026'],
    ['SK', 'standard', '905 PIK', '905 POK'],
    ['MB', 'standard', 'MCX 825', 'MOX 825'],
    ['ON', 'standard', 'BPNW 958', 'BPGW 958'],
    ['ON', 'green-vehicle', 'GVAH 823', 'GXAH 823'],
    ['ON', 'green-vehicle-french', 'VEAA-132', 'VEAA-13'],
    ['QC', 'standard', 'BXX 05A', 'BXX 05'],
    ['QC', 'electric', 'B12 VEA', 'B12 AEA'],
    ['QC', 'b12-2009', 'M45 KFB', 'A45 KFB'],
    ['QC', '123-abc-1996', '574 PAB', '574 PUB'],
    ['NB', 'standard', 'KFR 200', 'KFR200'],
    ['NS', 'standard', 'HTH 021', 'HTI 021'],
    ['PE', 'standard', '123 ABC', 'ABC 123'],
    ['NL', 'standard', 'JXH 941', 'JXY 941'],
    ['YT', 'standard', 'KAA04', 'CAA04'],
    ['NT', 'standard', '331758', '33175'],
    ['NT', 'explore-1986', '85148', '085148'],
    ['NU', 'standard', '017 363', '017363'],
    ['NU', 'night-scene-2012', '013 562', '013·562'],
  ])('%s/%s accepts %s and rejects %s', (code, id, good, bad) => {
    const f = format(code, id);
    expect(check(f, good)).toBeNull();
    expect(check(f, bad)).toMatch(/^Expected/);
  });

  it('generates serials inside the documented current series', () => {
    const rng = createRng('ca-series');
    for (let i = 0; i < 300; i++) {
      expect(format('AB', 'standard').generate(rng).serial).toMatch(/^(C[K-Z]|D[AB])[B-DF-HJ-NPR-TV-Z]-\d{4}$/);
      expect(format('ON', 'standard').text!(format('ON', 'standard').generate(rng))).toMatch(/^(C[P-Z]|D[A-L])[A-FH-NPR-TV-Z]{2}·\d{3}$/);
      expect(format('MB', 'standard').generate(rng).serial).not.toMatch(/^[CJ]/);
      expect(format('YT', 'standard').generate(rng).serial).toMatch(/^[ABEHJK][A-HJ-PR-TV-XZ]{2}\d{2}$/);
      expect(Number(format('NT', 'standard').generate(rng).serial)).toBeGreaterThanOrEqual(300000);
    }
    expect(() => series('ABC', 'AAD', 'CCC')).toThrow();
  });

  it('normalises a typed space or dash to the emblem separator', () => {
    const on = format('ON', 'standard');
    expect(on.text!({ serial: 'BPNW 958' })).toBe('BPNW·958');
    expect(format('AB', 'moraine-lake-2026').text!({ serial: 'DBD-2026' })).toBe('DBD·2026');
    expect(format('AB', 'standard').text!({ serial: 'CKT-1800' })).toBe('CKT-1800');
  });

  it('draws the emblem separator only where the serial has a ·', () => {
    const cases: Array<[string, string, string, string]> = [
      ['ON', 'standard', 'BPNW 958', 'crown'],
      ['ON', 'green-vehicle', 'GVAH 823', 'trillium'],
      ['PE', 'standard', '123 ABC', 'pei-crest'],
      ['NU', 'standard', '017 363', 'inuksuk'],
      ['AB', 'moraine-lake-2026', 'DBD 2026', 'wild-rose'],
    ];
    for (const [code, id, serial, emblem] of cases) {
      const svg = render(region(code), format(code, id), serial);
      expect(svg, `${code}/${id}`).toContain('data-role="serial-separator"');
      expect(svg).toMatch(new RegExp(`data-role="serial-separator"><g data-emblem="${emblem}"`));
      expect(svg).toContain(`>${serial.split(' ')[0]}<`);
    }
    // A dash stays a dash on the standard Alberta plate; a `·` on a plate without a separator emblem draws none.
    expect(render(region('AB'), format('AB', 'standard'), 'CKT-1800')).not.toContain('serial-separator');
    expect(render(region('NS'), format('NS', 'standard'), 'HTH·021')).not.toContain('serial-separator');
  });

  it('keeps the separator with vector lettering', () => {
    const f = format('ON', 'standard');
    const design = { ...region('ON').design, ...f.design } as CaDesign;
    const svg = renderToStaticMarkup(caTemplate.render({ parts: { serial: 'BPNW·958', lettering: 'squarish' }, design, text: 'BPNW·958' }));
    expect(svg).toContain('data-lettering="squarish"');
    expect(svg).toContain('aria-label="BPNW"');
    expect(svg).toContain('aria-label="958"');
    expect(svg).toContain('data-emblem="crown"');
  });

  it('uses the NWT reconstruction without changing the Nunavut silhouette in the 600×300 canvas', () => {
    for (const [code, facing] of [['NT', undefined], ['NU', 'left']] as const) {
      const r = region(code);
      const design = { ...r.design, ...r.formats[0].design } as CaDesign;
      expect(caTemplate.size(design)).toEqual({ width: 600, height: 300 });
      expect(design.facing).toBe(facing);
      const svg = render(r, r.formats[0]);
      expect(svg).toContain('data-shape="polar-bear"');
      const expectedPath = code === 'NT' ? NWT_POLAR_BEAR_PATH : POLAR_BEAR_PATH;
      expect(svg).toContain(`<path d="${expectedPath}"`);
      if (code === 'NT') {
        expect(svg).toContain('data-shape-profile="nwt-reference"');
        expect(svg).not.toContain(`d="${POLAR_BEAR_PATH}"`);
      } else {
        expect(svg).toContain('transform="translate(600 0) scale(-1 1)"');
        expect(svg).not.toContain('data-shape-profile="nwt-reference"');
        expect(svg).not.toContain(`d="${NWT_POLAR_BEAR_PATH}"`);
      }
    }
    expect(render(region('NU'), format('NU', 'night-scene-2012'))).toContain('data-shape="rect"');
  });

  it('exports a separate NWT inset border and four transparent holes matching each reference style', () => {
    expect(NWT_POLAR_BEAR_BORDER_PATH).not.toBe(NWT_POLAR_BEAR_PATH);
    for (const [id, kind] of [['standard', 'circle'], ['explore-1986', 'rect']] as const) {
      const svg = render(region('NT'), format('NT', id));
      const mask = svg.match(/<mask\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/mask>/);
      expect(mask, id).not.toBeNull();
      expect(mask![2]).toContain(`d="${NWT_POLAR_BEAR_PATH}"`);
      expect(mask![2].match(new RegExp(`<${kind}\\b[^>]*data-role="mounting-hole"`, 'g'))).toHaveLength(4);
      expect(mask![2].match(/data-role="mounting-hole"/g)).toHaveLength(4);
      expect(svg).toContain(`<g mask="url(#${mask![1]})">`);
      expect(svg).toContain(`<path d="${NWT_POLAR_BEAR_BORDER_PATH}" fill="none"`);
      expect(svg).toContain('data-role="inset-border"');
      if (id === 'standard') {
        expect(svg).toContain('data-source="user-supplied-aurora-over-arctic-wilderness"');
        expect(svg).toContain('preserveAspectRatio="xMidYMid slice"');
      } else expect(svg).not.toMatch(/<image\b/);
    }
  });

  it('can omit NWT mounting holes without losing the cut silhouette', () => {
    const design = { ...region('NT').design, holes: 'none' } as CaDesign;
    const svg = renderToStaticMarkup(caTemplate.render({ parts: { serial: '331758' }, design, text: '331758' }));
    expect(svg).toContain(`d="${NWT_POLAR_BEAR_PATH}"`);
    expect(svg).not.toContain('data-role="mounting-hole"');
  });

  it('renders every format without broken markup', () => {
    for (const r of canadianProvinces) {
      for (const f of r.formats) {
        const svg = render(r, f);
        expect(svg, `${r.id}/${f.id}`).toContain('viewBox="0 0 600 300"');
        expect(svg).not.toMatch(/NaN|undefined|<script/);
      }
    }
  });
});
