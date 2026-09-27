import { describe, expect, it } from 'vitest';
import { createRng } from '../../core/random';
import { buildKitScene } from '../../templates/bc/kit';
import { serializeSvgNode } from '../../templates/svg-scene';
import { kitDecal, kitPalette, kitRecipe } from './bc-kit';
import { BC_TRADE_ERAS, BC_TRADE_FAMILIES, BC_TRADE_FORMATS } from './bc-trade';

function render(format: (typeof BC_TRADE_FORMATS)[number], parts: Record<string, string>): string {
  const recipe = kitRecipe(String(format.design!.kit));
  const withDie = parts.die ? { ...recipe, serial: { ...recipe.serial, die: parts.die } } : recipe;
  return serializeSvgNode(buildKitScene(withDie, parts, { scope: `t-${format.id}`, decal: kitDecal(recipe.id, parts), ...kitPalette(recipe.id, parts.palette) }));
}

describe('B.C. dealer, industrial and carrier plates', () => {
  it('declares its own families and eras only', () => {
    const families = new Set(BC_TRADE_FAMILIES.map((f) => f.id));
    expect([...families].sort()).toEqual(['carrier', 'industrial', 'trade']);
    for (const era of BC_TRADE_ERAS) expect(families.has(era.family!)).toBe(true);
    for (const f of BC_TRADE_FORMATS) {
      expect(families.has(f.family!), f.id).toBe(true);
      expect(BC_TRADE_ERAS.some((e) => e.id === f.era && e.family === f.family), f.id).toBe(true);
      expect(f.id.startsWith(`${f.family}-`), f.id).toBe(true);
    }
    expect(new Set(BC_TRADE_FORMATS.map((f) => f.id)).size).toBe(BC_TRADE_FORMATS.length);
  });

  for (const format of BC_TRADE_FORMATS) it(`${format.id}: 400 samples validate and render, every palette and die renders`, () => {
    const rng = createRng(`trade-${format.id}`);
    for (let i = 0; i < 400; i++) {
      const parts = format.generate(rng) as Record<string, string>;
      expect(format.validate?.(parts), JSON.stringify(parts)).toBeNull();
      if (i % 20 === 0) {
        const svg = render(format, parts);
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg).not.toMatch(/NaN|Infinity|\{yy|\{yyyy/);
      }
    }
    const base = format.generate(createRng(format.id)) as Record<string, string>;
    for (const field of format.fields.filter((f) => f.options && f.key !== 'decalMonth')) {
      for (const option of field.options!) {
        const parts = { ...base, [field.key]: option.value };
        expect(format.validate?.(parts), `${field.key}=${option.value}`).toBeNull();
        expect(render(format, parts)).not.toMatch(/NaN|\{yy/);
      }
    }
  });

  it('accepts the photographed serials and rejects out-of-range ones', () => {
    const ok: Record<string, string[]> = {
      'trade-dealer-1913': ['D78', 'D18'], 'trade-dealer-1968': ['D3-362', 'D3-792'], 'trade-dealer-1976': ['D14-000'], 'trade-dealer-1979': ['D55-804', 'D65-515'],
      'trade-dealer-flag': ['D0-0909', 'D3-2930'], 'trade-dealer-mc-flag': ['DM-0325', 'DM-2003'], 'trade-manufacturer-flag': ['MA-0046', 'MA-0642'],
      'trade-repairer-1974': ['R80-331', 'R86-785', 'R545'], 'trade-repairer-flag': ['R0-0800', 'R0-4631'], 'trade-transporter-1964': ['T122', '223', '2-653'],
      'trade-transporter-flag': ['TR-0792', 'TS-1749'], 'industrial-x-1976': ['X00-521'], 'industrial-x-1979': ['X54-082'], 'industrial-x-flag': ['X0-0839'],
      'industrial-logging-1985': ['T3-3949'], 'industrial-logging-flag': ['T0-1942', 'T2-1230'], 'industrial-restricted': ['AT-0570', '01-522X', '03635-X'],
      'industrial-off-road': ['0B2700', '1B1111'], 'industrial-sa-1973': ['GR011', 'CL525'], 'industrial-sa-flag': ['0362-SA'], 'carrier-cl-1936': ['H-2733'], 'carrier-cl-1946': ['K-20510'],
      'carrier-cl-1951': ['L41173', 'J15888', '6315'], 'carrier-mc-1988': ['052-798'], 'carrier-mc-1995': ['139-986'], 'carrier-passenger-2005': ['810-301'],
      'carrier-prorate-flag-1985': ['P4-4433'], 'carrier-prorate-apportioned': ['P7-5280', '1225-5P'], 'carrier-fuel-1969': ['MF12-864'], 'carrier-reciprocity-1973': ['227', '1053'],
    };
    for (const [id, serials] of Object.entries(ok)) {
      const f = BC_TRADE_FORMATS.find((x) => x.id === id)!;
      for (const serial of serials) expect(f.validate?.({ ...f.generate(createRng(id)), serial }), `${id} ${serial}`).toBeNull();
    }
    const bad: Record<string, string[]> = {
      'trade-dealer-1913': ['D121', 'D0', '78'], 'trade-dealer-flag': ['D00909', 'D5-0000'], 'industrial-x-1979': ['X49-999', 'X5-4082'],
      'carrier-prorate-apportioned': ['12255P', 'P7-52800'], 'industrial-off-road': ['0C2700', 'B2700'],
    };
    for (const [id, serials] of Object.entries(bad)) {
      const f = BC_TRADE_FORMATS.find((x) => x.id === id)!;
      for (const serial of serials) expect(f.validate?.({ ...f.generate(createRng(id)), serial }), `${id} ${serial}`).not.toBeNull();
    }
  });
});
