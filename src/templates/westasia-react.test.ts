import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { iraqRecipes as iraq } from '../regions/asia/iraq-recipes';
import { iran } from '../regions/asia/iran';
import { createRng } from '../core/random';
import { iqTemplate } from './iq';
import { irTemplate } from './ir';

describe('West Asian templates in React', () => {
  it('renders every recipe through the actual PlateTemplate contract', () => {
    for (const [region, template] of [[iraq, iqTemplate], [iran, irTemplate]] as const) {
      for (const format of region.formats) {
        const parts = format.generate(createRng(format.id));
        const design = { ...region.design, ...format.design };
        const text = format.text?.(parts) ?? '';
        const result = renderToStaticMarkup(template.render({ parts, design, text }));
        const { width, height } = template.size(design, parts);
        expect(result).toContain(`viewBox="0 0 ${width} ${height}"`);
        expect(result).toContain('<path'); expect(result).not.toContain('&lt;path');
        expect(result).not.toMatch(/NaN|undefined|<script/);
      }
    }
  });
});
