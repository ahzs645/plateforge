import {describe, expect, it} from 'vitest';
import {createRng} from '../../core/random';
import type {PlateFormat} from '../../core/types';
import {buildKitScene} from '../../templates/bc/kit';
import {serializeSvgNode} from '../../templates/svg-scene';
import {kitRecipe} from './bc-kit';
import {britishColumbia} from './index';

describe('B.C. single-choice manufactured alphabets', () => {
  it.each(['commercial-flag-2008', 'farm-truck-2025', 'trailer-utility-flag-2000', 'trailer-utility-2016'])
    ('%s renders its sole allowed Waldale die even without a selector', id => {
      const format: PlateFormat = britishColumbia.formats.find(f => f.id === id)!;
      const parts = format.generate(createRng(id));
      expect(format.fields.some(f => f.key === 'die')).toBe(false);
      expect(parts.die).toBeUndefined();
      expect(format.validate?.({...parts, die: 'bc-astro-3'})).toBe('Choose one of the listed dies.');
      const recipe = kitRecipe(String(format.design!.kit));
      expect(recipe.serial.die).toBe('bc-waldale');
      const svg = serializeSvgNode(buildKitScene(recipe, parts));
      expect(svg).toContain('data-die="bc-waldale"');
      expect(svg).not.toContain('data-die="bc-astro-3"');
      expect(svg).not.toContain('data-die="bc-astro-4"');
    });
});
