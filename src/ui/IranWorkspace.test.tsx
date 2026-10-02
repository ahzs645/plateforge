import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_PRESET_ALIASES } from '../templates/iran-custom-data';
import { iran } from '../regions/asia/iran';
import { readIranRoute, IranWorkspace } from './IranWorkspace';
import { readAppRoute } from './App';

describe('Iran website and standalone routes', () => {
  it('resolves every preset to its actual editor state', () => {
    for (const preset of IRAN_CUSTOM_PRESETS) expect(readIranRoute(`#/iran-customizer/${encodeURIComponent(preset.id)}`)).toEqual({ timeline: false, presetId: preset.id });
  });
  it('resolves legacy recipes and source aliases without generic fallback', () => {
    for (const format of iran.formats) {
      const expected = IRAN_CUSTOM_PRESET_ALIASES[format.id] ?? format.id;
      expect(IRAN_CUSTOM_PRESETS.some(preset => preset.id === expected), format.id).toBe(true);
      expect(readIranRoute(`#/iran-customizer/${format.id}`).presetId).toBe(expected);
    }
  });
  it('handles history, malformed encoding, unknown IDs and other country routes safely', () => {
    expect(readIranRoute('#/iran-timeline').timeline).toBe(true);
    for (const hash of ['#/iran-customizer/unknown', '#/%ZZ', '', '#/iraq-customizer/private']) expect(readIranRoute(hash).presetId).toBe(IRAN_CUSTOM_PRESETS[0].id);
    // In the app, the old editor and history links open the region's own editor and gallery.
    expect(readAppRoute('#/iran-customizer/national-private')).toEqual({ region: 'iran', format: 'national-private', view: 'single' });
    expect(readAppRoute('#/iran-timeline')).toEqual({ region: 'iran', view: 'gallery' });
    expect(readAppRoute('#/iraq-timeline')).toEqual({ region: 'iraq', view: 'gallery' });
    expect(readAppRoute('#/iraq-customizer/private-2001')).toEqual({ region: 'iraq', format: 'private-2001', view: 'single' });
  });
  it('mounts the standalone workspace; the app has no separate Iran or Iraq pages', () => {
    const html = renderToStaticMarkup(<IranWorkspace />);
    expect(html).toContain('aria-label="Iran workspace"'); expect(html).toContain('href="#/iran-timeline"');
    const app = readFileSync('src/ui/App.tsx', 'utf8');
    expect(app).not.toContain('IranWorkspace');
    expect(app).not.toContain('IraqWorkspace');
    const standalone = readFileSync('src/ui/iran-customizer-main.tsx', 'utf8');
    expect(standalone).toContain('<IranWorkspace />');
    const builder = readFileSync('scripts/build-iran-customizer.mjs', 'utf8');
    expect(builder).toContain('15 * 1024 * 1024'); expect(builder).toContain('Unexpected restricted or external font dependency');
  });
});
