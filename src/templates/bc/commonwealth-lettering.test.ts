import {describe, expect, it} from 'vitest';
import {BC_OFFICIAL_FORMATS} from '../../regions/canada/bc-official';
import {kitRecipe} from '../../regions/canada/bc-kit';
import {dieProfile} from '../dies/profiles';
import {dieSupports} from '../dies/engine';
import {buildKitScene} from './kit';
import {serializeSvgNode} from '../svg-scene';

describe('supplied Commonwealth Games lettering', () => {
  it.each(['events-royal-1994', 'events-royal-1994-prototype'])('%s exports the supplied italic outlines', id => {
    const format = BC_OFFICIAL_FORMATS.find(f => f.id === id)!;
    const recipe = kitRecipe(format.design!.kit as string);
    const heading = recipe.legends.find(t => t.role === 'slogan')!;
    const profile = dieProfile(heading.die);
    expect(profile.allowResearchReplacement).toBe(false);
    expect(profile.allowConstructedFallback).toBe(false);
    expect(dieSupports(profile, heading.text)).toBe(true);
    expect(dieSupports(profile, '123')).toBe(false);
    expect(recipe.fontLegends).toEqual([]);
    expect(recipe.serial.die).toBe('bc-astro-4');
    const city = recipe.panels!.find(p => p.role === 'games-city-decal')!.texts!.find(t => t.role === 'city')!;
    expect(city.die).toBe('bc-commonwealth-helvetica-compressed');
    expect(city.screened).toBe(true);
    expect(dieProfile(city.die).allowResearchReplacement).toBe(false);
    expect(dieSupports(dieProfile(city.die), city.text)).toBe(true);
    const svg = serializeSvgNode(buildKitScene(recipe, {serial: id.endsWith('prototype') ? '94' : 'R1'}));
    expect(svg).toContain('data-die="bc-commonwealth-times-bolditalic"');
    expect(svg).toContain('data-die="bc-commonwealth-helvetica-compressed"');
    expect(svg).not.toContain('font-family=');
    expect(svg).not.toMatch(/NaN|Infinity/);
  });
});
