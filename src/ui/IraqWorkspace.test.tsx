import { describe, expect, it } from 'vitest';
import { readIraqRoute } from './IraqWorkspace';
import { IRAQ_CUSTOM_PRESETS } from '../templates/iraq-custom-data';
describe('Iraq website routes', () => {
  it('links every timeline preset to the actual editor state', () => {
    for (const preset of IRAQ_CUSTOM_PRESETS) expect(readIraqRoute(`#/iraq-customizer/${preset.id}`)).toEqual({ timeline: false, presetId: preset.id });
  });
  it('recognizes history and safely handles malformed or unknown routes', () => {
    expect(readIraqRoute('#/iraq-timeline').timeline).toBe(true);
    for (const hash of ['#/iraq-customizer/unknown', '#/%ZZ', '']) expect(readIraqRoute(hash).presetId).toBe(IRAQ_CUSTOM_PRESETS[0].id);
  });
});

// Integration wiring is checked independently of browser-only history and font loading.
import { readFileSync } from 'node:fs';
import { iraq } from '../regions/asia/iraq';
it('keeps a matching editor destination for all original website recipes', () => {
  expect(iraq.formats).toHaveLength(27);
  for (const format of iraq.formats) expect(IRAQ_CUSTOM_PRESETS.some(preset => preset.id === format.id)).toBe(true);
  const app = readFileSync('src/ui/App.tsx', 'utf8');
  expect(app).toContain('href="#/iraq-timeline"');
  expect(app).toContain('href={`#/iraq-customizer/${format.id}`}');
  expect(app).toContain("import('./IraqWorkspace')");
  expect(iraq.notes).toContain('not proven introduction/withdrawal');
});
