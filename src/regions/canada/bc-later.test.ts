import { describe, expect, it } from 'vitest';
import { createRng } from '../../core/random';
import { BC_LATER_RECIPES, bcLaterFormats, bcLaterRecipe, laterSerial, validateLaterSerial } from './bc-later';
import { britishColumbia } from './index';
import { buildBcLaterScene } from '../../templates/bc/later-scene';
import { serializeSvgNode, type SvgNode } from '../../templates/svg-scene';

function byRole(root: SvgNode, role: string): SvgNode[] {
  const result = root.attrs['data-role'] === role ? [root] : [];
  for (const child of root.children) if (typeof child !== 'string') result.push(...byRole(child, role));
  return result;
}
function meta(root: SvgNode) {
  const value = root.children.find((child) => typeof child !== 'string' && child.tag === 'metadata') as SvgNode;
  return JSON.parse(value.children[0] as string);
}
describe('B.C. later passenger bases', () => {
  it('extends the registry without replacing the twenty-five legacy formats', () => {
    expect(BC_LATER_RECIPES).toHaveLength(17);
    expect(britishColumbia.formats).toHaveLength(42);
    expect(new Set(britishColumbia.formats.map((f) => f.id)).size).toBe(42);
    expect(britishColumbia.formats.some((f) => f.id === '1962-no-dash')).toBe(true);
    expect(() => bcLaterRecipe({ year: 1986 })).toThrow();
  });
  for (const format of bcLaterFormats) it(`${format.id}: 400 deterministic samples validate and render`, () => {
    const a = createRng(format.id), b = createRng(format.id);
    for (let i = 0; i < 400; i++) {
      const parts = format.generate(a);
      expect(parts).toEqual(format.generate(b));
      expect(format.validate?.(parts)).toBeNull();
      const scene = buildBcLaterScene(format.design!, parts, `test-${format.id}-${i}`);
      const svg = serializeSvgNode(scene);
      expect(svg).toContain('data-role="serial"');
      expect(svg).not.toMatch(/NaN|Infinity|<image/);
      expect(meta(scene).source.url).toBe(format.references![0].url);
      expect(meta(scene).accuracy.dies).toContain('proxy');
    }
  });
  it('limits the 1985 fourth block to the source-reported ALA–AXK and BLA–BRB runs', () => {
    const recipe = bcLaterRecipe({ baseId: '1985-fourth' });
    for (const serial of ['ALA-001', 'AXK-999', 'BLA-500', 'BPK-123', 'BRA-001', 'BRB-999']) expect(validateLaterSerial(serial, recipe), serial).toBeNull();
    for (const serial of ['ALL-001', 'AAA-001', 'BRC-001', 'BSA-001', 'CLA-001']) expect(validateLaterSerial(serial, recipe), serial).not.toBeNull();
    expect(recipe.prefixes).toHaveLength(10 * 10 + 4 * 10 + 2);
  });
  it('preserves century/year placements and the explicit 1967 over-run range', () => {
    const normal = buildBcLaterScene({ year: 1967 }, { serial: '650-000' });
    const over = buildBcLaterScene({ year: 1967, baseId: '1967-overrun' }, { serial: '710-000' });
    expect(byRole(normal, 'base-century')).toHaveLength(0);
    expect(byRole(over, 'base-century')[0].children[0]).toBe('19');
    expect(byRole(over, 'base-year')[0].children[0]).toBe('67');
    const recipe = bcLaterRecipe({ baseId: '1967-overrun' });
    expect(validateLaterSerial('700-001', recipe)).toBeNull();
    expect(validateLaterSerial('700-000', recipe)).not.toBeNull();
    expect(validateLaterSerial('720-001', recipe)).not.toBeNull();
    expect(byRole(buildBcLaterScene({ year: 1964 }, { serial: '123456' }), 'base-year')[0].attrs.y).toBe(136);
  });
  it('checks letter-block membership and does not accept zero or malformed serials', () => {
    const first = bcLaterRecipe({ baseId: '1970-1972' });
    for (const value of ['AAA-001', 'KKJ-999', 'ABC123']) expect(validateLaterSerial(value, first)).toBeNull();
    for (const value of ['AAA-000', 'AIA-123', 'AOL-123', 'LLL-123', 'ABC--123', 'abc-123']) expect(validateLaterSerial(value, first)).not.toBeNull();
    const over = bcLaterRecipe({ baseId: '1972-overrun' });
    expect(validateLaterSerial('KLL-123', over)).toBeNull();
    expect(validateLaterSerial('KAA-123', over)).not.toBeNull();
    const third = bcLaterRecipe({ baseId: '1982-third' });
    expect(validateLaterSerial('ALL-123', third)).toBeNull();
    expect(validateLaterSerial('AAA-123', third)).not.toBeNull();
    expect(laterSerial('ABC123')).toBe('ABC-123');
    expect(laterSerial('123456')).toBe('123-456');
    expect(laterSerial('12--345')).toBe('12--345');
  });
  it('retains permanent base dates and explicitly leaves renewal decals unreconstructed', () => {
    for (const [id, baseYear] of [['1972-overrun', 1970], ['1978-acme', 1973], ['1982-third', 1979]] as const) {
      const scene = buildBcLaterScene({ baseId: id }, { serial: 'KLL-123' });
      expect(meta(scene).baseYear).toBe(baseYear);
      expect(meta(scene).renewal.datedDecalReconstructed).toBe(false);
      expect(byRole(scene, 'blank-renewal-box')).toHaveLength(1);
    }
  });
  it('renders all four optional construction modes across every new base', () => {
    for (const format of bcLaterFormats) for (const lettering of ['semicircular', 'squarish', 'oval', 'hybrid']) {
      const parts = { ...format.generate(createRng(format.id)), lettering };
      const scene = buildBcLaterScene(format.design!, parts);
      expect(byRole(scene, 'serial')[0].attrs['data-lettering']).toBe(lettering);
      expect(meta(scene).lettering.fallback).toBe(false);
    }
  });
  it('escapes unsupported text, scopes ids and labels the fallback correctly', () => {
    const scene = buildBcLaterScene({ year: 1964 }, { serial: '<script>"&', lettering: 'squarish' }, 'one');
    const svg = serializeSvgNode(scene);
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('id="one-holes"');
    expect(meta(scene).lettering.fallback).toBe(true);
    expect(meta(scene).lettering.mode).toBe('font-text');
  });
});
