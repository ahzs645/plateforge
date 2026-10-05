import {describe, expect, it} from 'vitest';
import {BC_VEHICLE_FORMATS} from '../../regions/canada/bc-vehicles';
import {kitRecipe} from '../../regions/canada/bc-kit';
import {buildKitScene, kitGeometry} from './kit';
import {serializeSvgNode} from '../svg-scene';

describe('separate commercial renewal piece', () => {
  const recipe = kitRecipe('commercial-1953-tab');
  const render = (renewal: string) => serializeSvgNode(buildKitScene(recipe, {serial: 'C29-419', renewal}));
  it('exports the complete fitted piece and can recover the original base or isolated tab', () => {
    expect(kitGeometry(recipe, {renewal: 'on-plate'})).toEqual({width: 335, height: 140});
    expect(kitGeometry(recipe, {renewal: 'base-only'})).toEqual({width: 335, height: 137});
    expect(kitGeometry(recipe, {renewal: 'loose'})).toEqual({width: 63, height: 140});
    expect(render('on-plate')).toContain('viewBox="0 -1.5 335 140"');
    expect(render('on-plate')).toContain('data-role="renewal-tab"');
    expect(render('base-only')).not.toContain('data-role="renewal-tab"');
    const loose = render('loose');
    expect(loose).toContain('viewBox="0 0 63 140"');
    expect(loose).toContain('data-role="tab-year"');
    expect(loose).not.toContain('data-role="serial"');
    expect(loose).not.toContain('data-role="province"');
    expect(loose).toContain('data-role="tab-hole"');
  });
  it('resolves every mask/filter reference in fitted and isolated exports', () => {
    for (const mode of ['on-plate', 'base-only', 'loose']) {
      const svg = render(mode);
      const ids = new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
      for (const match of svg.matchAll(/url\(#([^)]*)\)/g)) expect(ids.has(match[1]), `${mode}: ${match[1]}`).toBe(true);
      expect(svg).not.toMatch(/NaN|Infinity/);
    }
  });
  it('validates the mounting control without treating a loose tab as a repeated plate number', () => {
    const format = BC_VEHICLE_FORMATS.find(f => f.id === 'commercial-1953-tab')!;
    for (const renewal of ['on-plate', 'base-only', 'loose']) expect(format.validate?.({serial: 'C29-419', renewal})).toBeNull();
    expect(format.validate?.({serial: 'C29-419', renewal: 'invalid'})).not.toBeNull();
  });
});
