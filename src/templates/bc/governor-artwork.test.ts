import {describe, expect, it} from 'vitest';
import {BC_OFFICIAL_FORMATS} from '../../regions/canada/bc-official';
import {kitRecipe} from '../../regions/canada/bc-kit';
import {buildKitScene} from './kit';
import {serializeSvgNode} from '../svg-scene';

describe('Lieutenant Governor and royal artwork', () => {
  const render = (recipe: string) => serializeSvgNode(buildKitScene(kitRecipe(recipe), {serial: ''}));

  it('keeps the supplied crest colours while replacing yellow, and puts its circle against both plate edges', () => {
    const recipe = kitRecipe('official-lg-crest');
    const box = recipe.art!.find(a => a.art === 'official-lg-crest-supplied')!;
    expect(box.y).toBe(0);
    expect(box.height).toBe(recipe.height);
    const svg = render(recipe.id);
    expect(svg).toContain('user-supplied-lieutenant-governor-flag-vector');
    expect(svg).toContain('gold-rimmed-crest-plaque');
    expect(svg).toContain('#c5a34a');
    expect(svg).toContain('#cf142b');
    expect(svg).not.toContain('#f7e017');
    expect(svg).not.toContain('<use');
    expect(svg).not.toContain('id="a"');
  });

  it('uses a filled arms body separately from the historical line artwork and records the photographed overlap', () => {
    const svg = render('official-lg-arms');
    expect(svg).toContain('solid-gold-arms-body');
    expect(svg).toContain('arms-relief-detail');
    expect(svg).not.toContain('data-art="bc-arms"');
    expect(BC_OFFICIAL_FORMATS.find(f => f.id === 'official-lt-governor-arms')!.period![1]).toBe(2016);
  });

  it('uses the uploaded Edward crown geometry on the royal crown plate', () => {
    const svg = render('events-royal-crown');
    expect(svg).toContain('user-supplied-edward-crown-goldenrod');
    expect(svg).toContain('data-art="official-edward-crown-supplied"');
    expect(svg).not.toContain('data-art="official-crown"');
    expect(svg).not.toMatch(/NaN|Infinity/);
  });
});
