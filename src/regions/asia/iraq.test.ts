import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRng } from '../../core/random';
import { buildTimeline, regionFamilies } from '../../core/timeline';
import { iqFlatTemplate } from '../../templates/iq-flat';
import { IRAQ_CUSTOM_PRESETS, customizerState, iraqCustomParts, iraqCustomStateFromParts, renderIraqCustom } from '../../templates/iraq-custom-scene';
import { IRAQ_TIMELINE_ENTRIES } from '../../templates/iraq-custom-timeline';
import { iraq } from './iraq';
import { iraqRecipes } from './iraq-recipes';

const render = (formatId: string, parts = iraq.formats.find((f) => f.id === formatId)!.generate(createRng(formatId))) => {
  const format = iraq.formats.find((f) => f.id === formatId)!;
  const design = { ...iraq.design, ...format.design };
  return { markup: renderToStaticMarkup(iqFlatTemplate.render({ design, parts, text: format.text!(parts) })), size: iqFlatTemplate.size(design, parts) };
};

describe('Iraq in the main editor', () => {
  it('has one format per flat-editor preset, under the preset id, drawn by the flat engine', () => {
    expect(iraq.template).toBe('iq-flat');
    expect(iraq.formats.map((f) => f.id)).toEqual(IRAQ_CUSTOM_PRESETS.map((p) => p.id));
    // Every original recipe link (#/iraq/<recipe>) still opens the same design.
    for (const recipe of iraqRecipes.formats) expect(iraq.formats.some((f) => f.id === recipe.id)).toBe(true);
  });

  it('places every preset on the dated timeline of its family, matching the chronology', () => {
    const families = regionFamilies(iraq);
    expect(families.map((f) => f.id)).toEqual(['federal', 'kurdistan']);
    const dated = families.flatMap((f) => buildTimeline(iraq, f.id)!.order.map((e) => e.format.id));
    expect(dated.sort()).toEqual(iraq.formats.map((f) => f.id).sort());
    for (const entry of IRAQ_TIMELINE_ENTRIES) {
      const format = iraq.formats.find((f) => f.id === entry.presetId)!;
      expect(format.family).toBe(entry.region);
      expect(iraq.eras!.find((era) => era.id === format.era)!.family).toBe(entry.region);
      expect(format.references!.length).toBeGreaterThan(0);
      expect(format.description).toContain(entry.period);
      expect(format.status === 'uncertain').toBe(entry.evidence === 'unsupported');
    }
    expect(iraq.gaps!.map((g) => g.period)).toEqual([[1930, 1961], [1970, 1980]]);
  });

  it('renders preset defaults exactly as the standalone editor does', () => {
    for (const preset of IRAQ_CUSTOM_PRESETS) {
      const parts = iraqCustomParts(preset.defaults);
      expect(iraqCustomStateFromParts(preset.id, parts)).toEqual(customizerState(preset.id));
      const { markup, size } = render(preset.id, parts);
      const scene = renderIraqCustom(customizerState(preset.id));
      expect(size).toEqual({ width: scene.width, height: scene.height });
      expect(markup).toContain(`viewBox="0 0 ${scene.width} ${scene.height}"`);
      expect(markup).toContain(scene.body);
      expect(markup).not.toContain('id="plateforge-iraq-settings"');
    }
  });

  it('keeps appearance edits through Generate and reports strict-mode gaps as invalid', () => {
    const format = iraq.formats.find((f) => f.id === 'flat-sulaymaniyah')!;
    const parts = format.generate(createRng('strict'));
    expect(format.validate!(parts)).toBeNull();
    expect(format.validate!({ ...parts, serial: '1458' })).toMatch(/unsupported/);
    expect(format.validate!({ ...parts, serial: '1458', missingPolicy: 'fallback' })).toBeNull();
    const appearance = format.fields.filter((f) => f.preserveOnGenerate).map((f) => f.key);
    expect(appearance).toEqual(expect.arrayContaining(['layout', 'fontProfile', 'missingPolicy', 'tracking', 'mainScale', 'bg', 'ink', 'border']));
    const { markup } = render('flat-sulaymaniyah', { ...parts, bg: '#123456', tracking: '6', border: 'off' });
    expect(markup).toContain('fill="#123456"');
    expect(markup).not.toContain('data-role="flat-border"');
  });
});
