import {describe, it, expect} from 'vitest';
import {BC_OFFICIAL_FORMATS} from '../../regions/canada/bc-official';
import {kitRecipe} from '../../regions/canada/bc-kit';
import {buildKitScene} from './kit';
import {serializeSvgNode} from '../svg-scene';
import {dieGlyph, dieSupports} from '../dies/engine';
import {FRANKFURTER_EXPO_PROFILE} from '../dies/frankfurter-expo';
import {withResearchContext} from '../dies/research-dies';

const render = (id: string) => withResearchContext(id, () => serializeSvgNode(buildKitScene(kitRecipe(id), {serial: ''})));
describe('Vancouver souvenirs', () => {
  it('exports the complete Centennial artwork without duplicate live wordmarks', () => {
    const svg = render('events-vancouver-100');
    expect(svg).toContain('user-supplied-vancouver-centennial-vector-kit');
    expect(svg).toContain('bc-vc100-emblem-outer-clip');
    expect(svg).toContain('clip-path="url(#bc-vc100-emblem-outer-clip)"');
    expect(svg).not.toMatch(/<(image|script|foreignObject|text)\b/);
    expect(kitRecipe('events-vancouver-100').fontLegends).toEqual([]);
    expect(kitRecipe('events-vancouver-100').legends?.map(t => t.text).join('')).toBe('18861986');
  });
  it('keeps distinct year-column inks', () => {
    const legends = kitRecipe('events-vancouver-100').legends!;
    expect(new Set(legends.filter(t => t.role.startsWith('from-')).map(t => t.color))).toEqual(new Set(['#38B114']));
    expect(new Set(legends.filter(t => t.role.startsWith('to-')).map(t => t.color))).toEqual(new Set(['#0047BA']));
  });
  it('uses the supplied filled souvenir letters instead of the linked event logo', () => {
    const svg = render('events-expo86-souvenir');
    expect(svg).toContain('data-die="bc-frankfurter-expo"');
    expect(svg).toContain('aria-label="EXPO86"');
    expect(svg).not.toContain('data-art="official-expo86"');
    for (const char of 'EXPO86') expect(dieGlyph(FRANKFURTER_EXPO_PROFILE, char)?.fill).toBe(true);
    expect(dieSupports(FRANKFURTER_EXPO_PROFILE, 'EXPO86')).toBe(true);
    expect(dieSupports(FRANKFURTER_EXPO_PROFILE, 'A')).toBe(false);
  });
  it('retains source font sidebearings and round-letter overshoots', () => {
    expect(dieGlyph(FRANKFURTER_EXPO_PROFILE, 'E')?.advance).toBeCloseTo(526 / 672 * 100, 3);
    const roundO = dieGlyph(FRANKFURTER_EXPO_PROFILE, 'O')!;
    expect(roundO.paths[0]).toContain('-1.6369');
    expect(roundO.advance).toBeCloseTo(769 / 672 * 100, 3);
  });
  it('keeps souvenir grammars unnumbered and other Expo designs separate', () => {
    for (const id of ['events-vancouver-100','events-expo86-souvenir']) {
      const format = BC_OFFICIAL_FORMATS.find(f => f.id === id)!;
      expect(format.validate?.({serial: ''})).toBeNull();
      expect(format.validate?.({serial: '123'})).not.toBeNull();
    }
    expect(kitRecipe('events-expo86-booster').art?.some(a => a.art === 'official-expo86')).toBe(true);
    expect(kitRecipe('events-expo86').serial.die).not.toBe('bc-frankfurter-expo');
  });
});
