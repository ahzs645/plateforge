import {describe, it, expect} from 'vitest';
import {BC_OFFICIAL_FORMATS} from '../../regions/canada/bc-official';
import {kitRecipe} from '../../regions/canada/bc-kit';
import {buildKitScene} from './kit';
import {serializeSvgNode} from '../svg-scene';
import {buildDieText, dieGlyph, dieSupports} from '../dies/engine';
import {dieProfile} from '../dies/profiles';
import {NWT_POLAR_BEAR_PATH, NWT_POLAR_BEAR_BORDER_PATH} from '../shapes/nwt-polar-bear';
import {FRANKFURTER_EXPO_PROFILE} from '../dies/frankfurter-expo';
import {withResearchContext} from '../dies/research-dies';

const render = (id: string) => withResearchContext(id, () => serializeSvgNode(buildKitScene(kitRecipe(id), {serial: ''})));
describe('Vancouver souvenirs', () => {
  it('makes monochrome artwork follow the selected plate ink, including the 1952 totem', () => {
    const svg = serializeSvgNode(buildKitScene(kitRecipe('official-nd-1952'), {serial: 'N-24'}, {ink: '#654321', tokens: {yy: '52'}}));
    expect(svg).toContain('color="#654321" data-role="artwork"');
    expect(svg).toContain('data-art="official-totem"');
    expect(svg).toContain('fill="currentColor"');
  });
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
  it('uses the tested Medium souvenir letters instead of the linked event logo', () => {
    const svg = render('events-expo86-souvenir');
    expect(svg).toContain('data-die="bc-frankfurter-expo"');
    expect(svg).toContain('aria-label="EXPO86"');
    expect(svg).not.toContain('data-art="official-expo86"');
    for (const char of 'EXPO86') expect(dieGlyph(FRANKFURTER_EXPO_PROFILE, char)?.fill).toBe(true);
    expect(dieSupports(FRANKFURTER_EXPO_PROFILE, 'EXPO86')).toBe(true);
    expect(dieSupports(FRANKFURTER_EXPO_PROFILE, 'A')).toBe(false);
  });
  it('retains source font sidebearings and round-letter overshoots', () => {
    expect(FRANKFURTER_EXPO_PROFILE.label).toContain('Std Medium');
    expect(dieGlyph(FRANKFURTER_EXPO_PROFILE, 'E')?.advance).toBeCloseTo(536 / 676 * 100, 3);
    const roundO = dieGlyph(FRANKFURTER_EXPO_PROFILE, 'O')!;
    expect(roundO.paths[0]).toContain('-0.1479');
    expect(roundO.advance).toBeCloseTo(749 / 676 * 100, 3);
    expect(render('events-expo86-souvenir')).toContain('data-fit="natural"');
  });
  it('keeps souvenir grammars unnumbered and other Expo designs separate', () => {
    for (const id of ['events-vancouver-100','events-expo86-souvenir']) {
      const format = BC_OFFICIAL_FORMATS.find(f => f.id === id)!;
      expect(format.validate?.({serial: ''})).toBeNull();
      expect(format.validate?.({serial: '123'})).not.toBeNull();
    }
    for (const id of ['events-expo86-booster','events-expo86-booster-aamva','events-expo86-prototype']) {
      expect(kitRecipe(id).legends.find(t => t.role === 'expo-wordmark')?.die).toBe('bc-frankfurter-expo');
      expect(render(id)).not.toContain('data-art="official-expo86"');
    }
    expect(kitRecipe('events-expo86').serial.die).not.toBe('bc-frankfurter-expo');
  });
  it('adjusts wordmark pairs without changing glyphs or distorting their proportions', () => {
    const legend = kitRecipe('events-expo86-souvenir').legends.find(t => t.role === 'expo-wordmark')!;
    const props = {text: legend.text, profile: FRANKFURTER_EXPO_PROFILE, x: legend.x, baseline: legend.baseline, capHeight: legend.cap, ink: '#000', role: legend.role};
    const natural = buildDieText(props), adjusted = buildDieText({...props, kerning: legend.kerning});
    expect(adjusted.width).toBeLessThan(natural.width);
    expect(adjusted.height).toBe(natural.height);
    const svg = serializeSvgNode(adjusted.node);
    for (const char of 'EXPO86') expect(svg).toContain(dieGlyph(FRANKFURTER_EXPO_PROFILE, char)!.paths[0]);
    expect(svg).toContain('translate(75.29 0)');
  });
  it('uses the shared NWT cut outline and independent border with four explicit mounting slots', () => {
    const recipe = kitRecipe('events-expo86-nwt'), svg = render('events-expo86-nwt');
    expect(recipe.cutOutline?.path).toBe(NWT_POLAR_BEAR_PATH);
    expect(recipe.holeGeometry).toHaveLength(4);
    expect(svg.match(/data-role="mounting-hole"/g)).toHaveLength(4);
    expect(svg).toContain(`d="${NWT_POLAR_BEAR_BORDER_PATH}"`);
    expect(svg).toContain('data-role="inset-border"');
    expect(svg).not.toContain('scale(0.965)');
  });
  it('uses the supplied coat of arms uniformly on the 1951 plate', () => {
    const svg = render('events-royal-1951');
    expect(svg).toContain('data-art="royal-canada-arms-supplied"');
    expect(svg).toContain('data-accuracy="supplied-image"');
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(svg).not.toContain('data-art="official-canada-arms"');
  });
  it('uses one Royal family throughout the documented 1987 number range', () => {
    expect(kitRecipe('events-royal-1987').serial.die).toBe('bc-royal-1987');
    const profile = dieProfile('bc-royal-1987');
    for (let n = 1; n <= 20; n++) expect(dieSupports(profile, `ROYAL${n}`)).toBe(true);
    expect(dieGlyph(profile, 'O')?.fill).toBeUndefined();
    expect(dieGlyph(profile, 'L')?.paths[0]).toContain('V85.5');
  });
  it('renders both Centennial years with rounded source-font numerals at the same row positions', () => {
    const years = kitRecipe('events-vancouver-100').legends;
    expect(years.map(t => t.text).join('')).toBe('18861986');
    expect(years.every(t => t.die === 'bc-frankfurter-centennial-years')).toBe(true);
    expect(years.slice(0,4).map(t => t.baseline)).toEqual([50,69,88,107]);
    expect(years.slice(4).map(t => t.baseline)).toEqual([50,69,88,107]);
  });
  it('uses supplied APEC vector paths in both the motorcade globe and military sticker', () => {
    for (const id of ['events-apec-1997','events-apec-military']) {
      const svg = render(id);
      expect(svg).toContain('user-supplied-apec-vector-kit');
      expect(svg).toContain('bc-apec-globe-clip');
      expect(svg).toContain('clip-path="url(#bc-apec-globe-clip)"');
      expect(svg).not.toMatch(/<(image|script|foreignObject)\b/);
    }
  });
});
