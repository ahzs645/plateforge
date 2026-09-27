import { describe, it, expect } from 'vitest';
import { LETTERING_TYPES, isLetteringType, withLettering, regenerateParts, letteringMetadata } from './lettering';
import { createRng } from './random';
import { britishColumbia } from '../regions/canada/bc';
import { BC_YEARS } from '../regions/canada/bc-data';
import { buildLettering, glyphPaths, GLYPH_CHARS, curveFor, letteringLayout, supportsLettering } from '../templates/lettering';
import { renderBcSvg, buildBcScene } from '../templates/bc/scene';
import { serializeSvgNode } from '../templates/svg-scene';

const bc = britishColumbia.formats[0];
describe('North American lettering system', () => {
  it('has four unique categories, separate from the default font', () => {
    expect(new Set(LETTERING_TYPES.map((item) => item.id)).size).toBe(4);
    expect(isLetteringType('default')).toBe(false);
    expect(isLetteringType('not-a-font')).toBe(false);
    expect(letteringMetadata('default').mode).toBe('font-text');
  });
  for (const type of LETTERING_TYPES) {
    it(`${type.id} supplies all A–Z, 0–9 and separators without a font asset`, () => {
      for (const char of GLYPH_CHARS + '-.· ') {
        const paths = glyphPaths(char, type.id);
        expect(paths.length > 0 || char === ' ').toBe(true);
        expect(paths.join(' ')).not.toMatch(/NaN|Infinity|undefined/);
      }
      const scene = buildLettering({ text: 'BOD-2689', type: type.id, centerX: 300, baseline: 200, height: 100, maxWidth: 500, ink: 'black' });
      const svg = serializeSvgNode(scene);
      expect(svg).toContain(`data-lettering="${type.id}"`);
      expect(svg).toContain('<path');
      expect(svg).not.toContain('<text');
      expect(svg).not.toContain('font-family');
      expect(svg).not.toContain('data:');
    });
  }
  it('draws genuinely different curved glyph geometry', () => {
    const zeroes = ['semicircular', 'squarish', 'oval'] as const;
    expect(new Set(zeroes.map((type) => glyphPaths('0', type).join(''))).size).toBe(3);
    expect(glyphPaths('0', 'semicircular')[0]).toContain(' A');
    expect(glyphPaths('0', 'oval')[0]).toContain('C');
    expect(glyphPaths('O', 'hybrid')).toEqual(glyphPaths('O', 'squarish'));
    expect(glyphPaths('0', 'hybrid')).toEqual(glyphPaths('0', 'oval'));
    expect(curveFor('hybrid', 'B')).toBe('squarish');
    expect(curveFor('hybrid', '6')).toBe('oval');
  });
  it('keeps font selection and finish through Generate, without retaining identifiers', () => {
    const format = britishColumbia.formats.find((item) => item.id === '1953')!;
    const old = { serial: '1', tabSerial: '123456', lettering: 'squarish', finish: 'embossed' };
    const parts = regenerateParts(format, old, createRng('persistent'));
    expect(parts.lettering).toBe('squarish');
    expect(parts.finish).toBe('embossed');
    expect(parts.serial).not.toBe('1');
    expect(parts.tabSerial).toBe('');
    expect(format.validate?.(parts)).toBeNull();
    expect(regenerateParts(format, { ...old, lettering: 'bad' }, createRng('a')).lettering).toBe('default');
  });
  it('is idempotent and accepts legacy parts without a selection', () => {
    expect(withLettering(bc)).toBe(bc);
    expect(bc.fields.filter((field) => field.key === 'lettering')).toHaveLength(1);
    expect(bc.validate?.({ serial: '12345' })).toBeNull();
    expect(bc.validate?.({ serial: '12345', lettering: 'unknown' })).toBeTruthy();
    expect(bc.text?.({ serial: '12345', lettering: 'oval' })).toBe('12-345');
  });
  it('does not consume extra randomness or change default serials', () => {
    const plain = { ...bc, fields: bc.fields.filter((field) => field.key !== 'lettering') };
    const wrapped = withLettering(plain);
    expect(wrapped.generate(createRng('compare'))).toEqual(plain.generate(createRng('compare')));
  });
  it('keeps every BC base, serial, date and renewal while changing only lettering', () => {
    for (const recipe of BC_YEARS) {
      const plain = buildBcScene({ year: recipe.year }, { serial: recipe.sample });
      for (const type of LETTERING_TYPES) {
        const scene = buildBcScene({ year: recipe.year }, { serial: recipe.sample, lettering: type.id });
        expect(scene.attrs.viewBox).toBe(plain.attrs.viewBox);
        const svg = serializeSvgNode(scene);
        expect(svg).toContain(`data-lettering="${type.id}"`);
        expect(svg).toContain('procedural-svg');
        expect(svg).toContain(recipe.sample);
        expect(svg).toContain('not original dies');
      }
    }
  });
  it('preserves the existing live-text serial in default mode', () => {
    const a = renderBcSvg({ year: 1958 }, { serial: '126-175' });
    const b = renderBcSvg({ year: 1958 }, { serial: '126-175', lettering: 'default' });
    expect(a).toContain('data-role="serial"');
    expect(b).not.toContain('data-lettering=');
    expect(b).toContain('font-text');
    expect(b).toContain('<text');
  });
  it('never silently drops unsupported input; fallback is reflected in metadata', () => {
    expect(supportsLettering('<script>')).toBe(false);
    expect(() => glyphPaths('é', 'oval')).toThrow(RangeError);
    const svg = renderBcSvg({ year: 1958 }, { serial: '<script>', lettering: 'oval' });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('&quot;fallback&quot;:true');
    expect(svg).toContain('font-text');
  });
  it('fits long runs uniformly and handles empty edits without NaN', () => {
    for (const text of ['', '1', '123456', 'ABC-1234', GLYPH_CHARS]) {
      const layout = letteringLayout(text, 100, 250);
      expect(layout.renderedWidth).toBeLessThanOrEqual(250);
      expect(layout.renderedHeight).toBeLessThanOrEqual(100);
      expect(Number.isFinite(layout.scale)).toBe(true);
    }
    expect(() => letteringLayout('123', 0, 100)).toThrow(RangeError);
    expect(() => letteringLayout('123', 100, Infinity)).toThrow(RangeError);
  });
});
