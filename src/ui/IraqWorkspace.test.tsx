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
