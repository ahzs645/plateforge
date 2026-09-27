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
});
