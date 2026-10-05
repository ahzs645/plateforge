import {describe, expect, it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRng} from '../../core/random';
import type {PlateFormat} from '../../core/types';
import {groupByCountry} from '../../core/timeline';
import {BUILT_IN_REGIONS} from '../index';
import {bcTemplate} from '../../templates/bc';
import {britishColumbia} from './index';
import {canadaFederal} from './federal';

describe('Canadian federal plates', () => {
  it('lists national designs alongside the provinces without taking over provincial N plates', () => {
    const canada = groupByCountry(BUILT_IN_REGIONS).flatMap(c => c.countries).find(c => c.country === 'Canada')!;
    expect(canada.regions).toContain(canadaFederal);
    expect(canada.regions).toHaveLength(14);
    expect(canadaFederal.formats.map(f => f.id)).toEqual(['standard', 'apec-1997']);
    expect(britishColumbia.formats.some(f => f.id === 'official-defence-1968')).toBe(true);
    expect(canadaFederal.formats.some(f => f.period?.[0] === 1968)).toBe(false);
  });

  it.each(canadaFederal.formats)('$id preserves its source recipe and exports the national jurisdiction', format => {
    const source: PlateFormat = britishColumbia.formats.find(f => f.id === format.design!.formatId)!;
    expect(format.design!.kit).toBe(source.design!.kit);
    expect(format.references).toEqual(source.references);
    const parts = format.generate(createRng(`federal:${format.id}`));
    expect(format.validate?.(parts)).toBeNull();
    const markup = renderToStaticMarkup(createElement(bcTemplate.render, {parts, design: {...canadaFederal.design, ...format.design} as Parameters<typeof bcTemplate.render>[0]['design'], text: format.text?.(parts) ?? parts.serial}));
    expect(markup).toContain('&quot;jurisdiction&quot;:&quot;CA&quot;');
    expect(markup).toContain('aria-label="Canada ·');
    expect(markup).not.toContain('aria-label="British Columbia ·');
  });
});
