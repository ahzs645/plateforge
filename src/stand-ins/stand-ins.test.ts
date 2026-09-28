import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { formatText } from '../core/format';
import { createRng } from '../core/random';
import { BUILT_IN_REGIONS, REGIONS } from '../regions';
import { standInTemplate } from '../templates/standin';
import { getStandIn, isThemed, layoutStandIn, MARK, normalizeStandIn, STAND_INS, type Metrics } from './index';
import { STAND_IN_FAMILY, THEMED_REGION_ID } from './regions';

const standInFormats = REGIONS.flatMap((region) => region.formats.filter((f) => f.status === 'stand-in').map((format) => ({ region, format })));
/** Every glyph 40 units wide at the source size, scaling with the font; ink 70% of the size above the baseline. */
const fixed: Metrics = { width: (_, size) => size * 0.4, ink: (_, size) => ({ ascent: size * 0.7, descent: 0 }) };

describe('stand-in artwork', () => {
  it('imports all 94 designs with their artwork and emblem files', () => {
    expect(STAND_INS).toHaveLength(94);
    expect(STAND_INS.filter((p) => p.customizable)).toHaveLength(76);
    for (const p of STAND_INS) {
      expect(p.artwork.url, p.id).toBeTruthy();
      expect([p.artwork.width, p.artwork.height]).toEqual([600, 300]);
      if (p.separator.file) expect(p.separator.url && p.separator.bounds, p.id).toBeTruthy();
    }
  });

  it('attaches state and provincial designs to their own region and gathers the themed ones', () => {
    expect(standInFormats).toHaveLength(94);
    const themed = REGIONS.find((r) => r.id === THEMED_REGION_ID)!;
    expect(themed.formats.every((f) => isThemed(getStandIn(f.design?.standIn)!))).toBe(true);
    expect(themed.formats).toHaveLength(STAND_INS.filter(isThemed).length);
    const ab = REGIONS.find((r) => r.id === 'ca-ab')!;
    expect(ab.formats.map((f) => f.id)).toEqual(expect.arrayContaining(['standard', 'stand-in-alberta-standard', 'stand-in-alberta-moraine-lake']));
    expect(ab.families?.map((f) => f.id)).toEqual(['svg', STAND_IN_FAMILY.id]);
    expect(REGIONS.find((r) => r.id === 'ca-qc')!.formats.some((f) => f.id === 'stand-in-quebec-standard')).toBe(true);
  });

  it('leaves the built-in regions untouched', () => {
    expect(BUILT_IN_REGIONS.some((r) => r.formats.some((f) => f.status === 'stand-in'))).toBe(false);
    const bc = REGIONS.find((r) => r.id === 'ca-bc')!;
    expect(bc.families?.[0].id).toBe(BUILT_IN_REGIONS.find((r) => r.id === 'ca-bc')!.families?.[0].id);
  });

  for (const { region, format } of standInFormats) {
    it(`${region.id}/${format.id} generates text its own validation accepts`, () => {
      const rng = createRng(format.id);
      for (let i = 0; i < 50; i++) {
        const parts = format.generate(rng);
        expect(formatText(format, parts).length).toBeGreaterThan(0);
        expect(format.validate?.(parts) ?? null, JSON.stringify(parts)).toBeNull();
      }
    });
  }

  it('caps letters and emblem marks the way the source editor does', () => {
    const ab = getStandIn('alberta-standard')!;
    expect(normalizeStandIn(ab, 'abc·123·4·5·6')).toBe('ABC·123·4·56');
    expect(normalizeStandIn(ab, 'ABCDEFGHIJKLMNOP')).toBe('ABCDEFGHIJK');
    const plain = getStandIn('california-black-white')!;
    expect(normalizeStandIn(plain, 'AB·12')).toBe('AB12');
    expect(normalizeStandIn(getStandIn('superman')!, 'ANY')).toBe('');
  });

  it('shrinks a long entry to 86% of the plate and centres the ink on text.y', () => {
    const ab = getStandIn('alberta-standard')!;
    const short = layoutStandIn(ab, 'ABC', fixed)!;
    expect(short.size).toBeCloseTo(108 * 1.5);
    const long = layoutStandIn(ab, 'ABCDEFGHIJK', fixed)!;
    const last = long.glyphs.at(-1)!;
    expect(last.x + last.width - long.glyphs[0].x).toBeLessThanOrEqual(600 * 0.86 + 1e-6);
    expect(long.size).toBeLessThan(short.size);
    expect(long.baseline - long.middle).toBeCloseTo((long.size * 0.7) / 2);
    const centre = (long.glyphs[0].x + last.x + last.width) / 2;
    expect(centre).toBeCloseTo(300, 0);
  });

  it('keeps an anchored line inside the room its anchor leaves', () => {
    const il = getStandIn('illinois-electric-vehicle')!;
    expect(il.text.align).toBe('right');
    const line = layoutStandIn(il, 'AB 12345', fixed)!;
    expect(line.glyphs[0].x).toBeGreaterThanOrEqual(600 * 0.07 - 1e-6);
  });

  it('draws the artwork, the letters and a cropped emblem', () => {
    const svg = renderToStaticMarkup(standInTemplate.render({ design: { standIn: 'alberta-standard' }, parts: {}, text: `ABC${MARK}123` }));
    expect(svg).toContain('<image');
    expect(svg.match(/<text /g)).toHaveLength(6);
    expect(svg).toContain('data-role="separator"');
    const fixedArt = renderToStaticMarkup(standInTemplate.render({ design: { standIn: 'superman' }, parts: {}, text: 'Superman' }));
    expect(fixedArt).not.toContain('<text');
    expect(standInTemplate.size({ standIn: 'alberta-standard' })).toEqual({ width: 600, height: 300 });
  });
});
