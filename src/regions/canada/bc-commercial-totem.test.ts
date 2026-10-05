import {describe, expect, it} from 'vitest';
import {BC_VEHICLE_FORMATS} from './bc-vehicles';
import {kitRecipe} from './bc-kit';
import {buildKitScene} from '../../templates/bc/kit';
import {serializeSvgNode} from '../../templates/svg-scene';

describe('1952 commercial base and separately mounted 1953 tab', () => {
  it('keeps the same full base under the renewal, including its year and last A', () => {
    const base = kitRecipe('commercial-1952');
    const renewed = kitRecipe('commercial-1953-tab');
    expect(renewed.serial).toEqual(base.serial);
    expect(renewed.art).toEqual(base.art);
    expect(renewed.holeAt).toEqual(base.holeAt);
    expect(renewed.legends.find((t) => t.role === 'province')).toEqual(base.legends.find((t) => t.role === 'province'));
    expect(renewed.legends.find((t) => t.role === 'year')?.text).toBe('52');
    expect(base.serial.cap).toBe(66);
    expect(base.legends.find((t) => t.role === 'province')?.cap).toBe(20);
  });

  it('uses a full-height commercial piece with a clearance notch and separate year die', () => {
    const tab = kitRecipe('commercial-1953-tab').renewalPanel!;
    expect([tab.x, tab.y, tab.width, tab.height]).toEqual([272, -1.5, 63, 140]);
    expect(tab.bodyPath).toContain('H0 V127 H12 Q17 127 15 121 L0 98');
    expect(tab.rimPath).toBe('M0 4 H51 Q59 4 59 12 V128 Q59 136 51 136 H0');
    expect(tab.holes).toEqual([{cx: 29, cy: 14.5, r: 3}, {cx: 29, cy: 127, r: 3}]);
    expect(tab.texts?.[0]).toMatchObject({text: '53', cap: 32.5, die: 'bc-tab-1953'});
    expect(tab.art?.[0].art).toBe('vehicles-totem');
    expect(tab.serial).toBeUndefined(); // Independent tab number is not the base serial.
  });

  it('supports the photographed number without claiming a new serial family', () => {
    const format = BC_VEHICLE_FORMATS.find((f) => f.id === 'commercial-1952')!;
    expect(format.validate?.({serial: 'C29-419'})).toBeNull();
    const svg = serializeSvgNode(buildKitScene(kitRecipe('commercial-1952'), {serial: 'C29-419'}, {tokens: {yy: '52'}}));
    expect(svg).toContain('data-die="bc-commercial-1952-year"');
    expect(svg).toContain('data-die="bc-commercial-1952-serial"');
    expect(svg).toContain('data-part="totem"');
    expect(svg).not.toContain('data-part="maple-leaf"');
    expect(svg).not.toMatch(/NaN|Infinity/);
  });
});
