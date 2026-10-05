import { describe, it } from 'vitest';
import { ok, equal } from 'node:assert/strict';
import { createRng } from '../../core/random';
import { serializeSvgNode } from '../../templates/svg-scene';
import { buildKitScene } from '../../templates/bc/kit';
import { kitDecal, kitPalette, kitRecipe } from './bc-kit';
import { BC_VEHICLE_ERAS, BC_VEHICLE_FAMILIES, BC_VEHICLE_FORMATS } from './bc-vehicles';

const families = new Set(BC_VEHICLE_FAMILIES.map((f) => f.id));
const eras = new Map(BC_VEHICLE_ERAS.map((e) => [e.id, e]));

describe('B.C. vehicle-class plates', () => {
  it('uses only the assigned families and its own eras', () => {
    equal([...families].sort().join(), 'commercial,farm,motorcycle,trailer');
    for (const f of BC_VEHICLE_FORMATS) {
      ok(families.has(f.family!), f.id);
      ok(eras.get(f.era!)?.family === f.family, f.id);
      ok(f.id.startsWith(f.family === 'farm' ? 'farm-' : `${f.family}-`), f.id);
    }
  });
  for (const format of BC_VEHICLE_FORMATS) {
    it(`${format.id}: renders every palette with generated serials`, () => {
      const rng = createRng(`vehicles-${format.id}`);
      const recipe = kitRecipe(String(format.design?.kit));
      const palettes = format.fields.find((f) => f.key === 'palette')?.options?.map((o) => o.value) ?? [undefined];
      for (let i = 0; i < 40; i++) {
        const parts = { ...format.generate(rng), ...(palettes[0] ? { palette: palettes[i % palettes.length] } : {}) };
        equal(format.validate?.(parts) ?? null, null, JSON.stringify(parts));
        const svg = serializeSvgNode(buildKitScene(recipe, parts, { scope: `t${i}`, decal: kitDecal(recipe.id, parts), ...kitPalette(recipe.id, parts.palette) }));
        ok(!/NaN|Infinity|\{yy/.test(svg), `${format.id} ${JSON.stringify(parts)}`);
      }
    });
  }
  it('stacks the palette year as two digits on the plate', () => {
    const recipe = kitRecipe('commercial-1936');
    const svg = serializeSvgNode(buildKitScene(recipe, { serial: 'C7-609' }, { ...kitPalette(recipe.id, '1937') }));
    ok(svg.includes('data-role="year-decade"') && svg.includes('data-role="year-unit"'));
  });
  it('uses independent smaller trailer prefixes and one upright BC master', () => {
    const renders = ['trailer-1923', 'trailer-1931', 'trailer-1936'].map(id => {
      const recipe = kitRecipe(id);
      const serial = id === 'trailer-1923' ? '323' : id === 'trailer-1931' ? 'T1159' : 'TR510';
      const svg = serializeSvgNode(buildKitScene(recipe, {serial}, kitPalette(id, undefined)));
      equal(recipe.legends.find(t => t.role === 'bc')?.die, 'bc-trailer-early-bc');
      ok(svg.includes('data-die="bc-trailer-early-bc"'));
      if (id === 'trailer-1923') ok(!svg.includes('data-role="serial-prefix"'));
      else {
        ok(recipe.serial.prefix!.cap < recipe.serial.cap * 0.65);
        ok(svg.includes('data-role="serial-prefix"') && svg.includes('data-role="serial-number"'));
        ok(svg.includes(`aria-label="${serial}"`));
        ok(svg.includes(`aria-label="${serial.replace(/^TR?/, '')}"`));
      }
      return recipe;
    });
    equal(renders[1].serial.cap, renders[2].serial.cap);
    equal(BC_VEHICLE_FORMATS.find(f => f.id === 'trailer-1921')!.period![1], 1922);
    const unprefixed = BC_VEHICLE_FORMATS.find(f => f.id === 'trailer-1923')!;
    equal(unprefixed.validate?.({serial: '323', palette: '1925'}), null);
    ok(unprefixed.validate?.({serial: 'T323', palette: '1925'}));
  });

  it('keeps full-height numerals for four-wide-digit and mixed-width trailer runs', () => {
    const recipe = kitRecipe('trailer-1936');
    for (const serial of ['T1941', 'T2458', 'TR510']) {
      const svg = serializeSvgNode(buildKitScene(recipe, {serial}, kitPalette(recipe.id, '1936')));
      ok(!svg.includes('data-fit="reduced"'), serial);
      ok(svg.includes('scale(0.66144)'), `${serial} keeps the 66.144 mm numeric cap`);
      ok(svg.includes('scale(0.40352)'), `${serial} keeps the 40.352 mm prefix cap`);
    }
  });

});
