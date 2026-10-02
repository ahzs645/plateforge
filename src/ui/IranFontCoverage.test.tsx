import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { IRAN_FONT_PROFILES, type IranFontProfile, type IranGlyph } from '../templates/iran-custom-fonts';
import { IranFontCoverage, iranProfileCoverage, iranRoleOnlyProfiles } from './IranFontCoverage';
import { iranAvailableFontProfiles } from './IranCustomizer';
import { IRAN_CUSTOM_PRESETS, iranCustomizerState } from '../templates/iran-custom-scene';

const glyph = (character: string, sourceId: string, note?: string): IranGlyph => ({ character, path: 'M0 -100H25V0H0Z', advance: 35, bounds: { x: 0, y: -100, width: 25, height: 100 }, provenance: 'observed', sourceId, fillRule: 'nonzero', ...(note ? { note } : {}) });
const fixture: IranFontProfile = {
  id: 'role-fixture', label: 'Limited source study', script: 'persian', provenance: 'observed',
  // Deliberately includes role characters: UI must derive each set from its glyph map, not this string.
  coverage: '۷هـ۴۳', capHeight: 100, baseline: 0,
  glyphs: { '۷': glyph('۷', 'main-seven'), 'هـ': glyph('هـ', 'atomic-series') },
  roles: {
    year: { label: 'Printed year tab', capHeight: 100, baseline: 0, glyphs: { '۴': glyph('۴', 'year-only-four', 'Year-tab shape only.'), '۳': glyph('۳', 'year-only-three') } },
    'city-initial': { capHeight: 100, baseline: 0, glyphs: { 'ط': glyph('ط', 'city-initial-only') } },
  },
  wordmarks: { tehran: { ...glyph('تهران', 'joined-city'), wordmarkId: 'tehran', text: 'تهران' } },
  notes: [], rights: 'Private critical study only', sourceUrl: 'https://example.com/source', sourceIds: ['specimen'], license: 'Unverified source-photo rights',
};

describe('Iran main, role and whole-word coverage inventories', () => {
  it('preserves atomic main tokens and never merges role characters into the main alphabet', () => {
    const coverage = iranProfileCoverage(fixture);
    expect(coverage.main.map(([token]) => token)).toEqual(['۷', 'هـ']);
    expect(coverage.roles.find(role => role.id === 'year')?.glyphs.map(([token]) => token)).toEqual(['۴', '۳']);
    expect(coverage.roles.find(role => role.id === 'year')).toMatchObject({ label: 'Printed year tab', provenance: ['observed'], sources: ['year-only-four', 'year-only-three'], notes: ['Year-tab shape only.'] });
    expect(coverage.roles.find(role => role.id === 'city-initial')?.label).toBe('city initial');
    expect(coverage.wordmarks.map(([id]) => id)).toEqual(['tehran']);
  });
  it('renders actual embedded paths in separately labeled main/role sections with source notices', () => {
    const html = renderToStaticMarkup(<IranFontCoverage profile={fixture} />);
    const main = html.slice(html.indexOf('aria-label="Main profile glyph coverage"'), html.indexOf('aria-label="Layout-role coverage"'));
    expect(main).toContain('Main-profile coverage · 2 tokens');
    expect(main).toContain('data-coverage-token="هـ"');
    expect(main).not.toContain('data-coverage-token="ـ"');
    expect(main).not.toContain('data-coverage-token="۴"');
    expect(main).not.toContain('data-coverage-token="ط"');
    expect(html).toContain('Layout-role coverage · 2 separate sets');
    expect(html).toContain('data-coverage-role="year"');
    expect(html).toContain('Year-tab shape only.');
    expect(html).toContain('year-only-four');
    expect(html).toContain('Observed source form');
    expect(html).toContain('<path d="M0 -100H25V0H0Z"');
    expect(html).toContain('Whole-word coverage · 1 supplied form');
    expect(html).toContain('not additional isolated-letter alphabet coverage');
  });
  it('shows honest empty role and wordmark states for a main-only profile', () => {
    const html = renderToStaticMarkup(<IranFontCoverage profile={{ ...fixture, roles: undefined, wordmarks: {} }} />);
    expect(html).toContain('This selected profile has no separate layout-role sets.');
    expect(html).toContain('No complete joined wordmarks are supplied in this profile.');
  });
  it('reads every real role inventory without treating main coverage as role coverage', () => {
    for (const profile of Object.values(IRAN_FONT_PROFILES)) {
      const coverage = iranProfileCoverage(profile);
      expect(coverage.main.map(([token]) => token)).toEqual(Object.keys(profile.glyphs));
      expect(coverage.roles.map(role => role.id)).toEqual(Object.keys(profile.roles ?? {}));
      for (const role of coverage.roles) expect(role.glyphs.map(([token]) => token)).toEqual(Object.keys(profile.roles![role.id].glyphs));
      const html = renderToStaticMarkup(<IranFontCoverage profile={profile} roleOnlyProfiles={[]} />);
      expect((html.match(/data-coverage-role=/g) ?? []).length, profile.id).toBe(coverage.roles.length);
      expect(html).toContain(`Main-profile coverage · ${coverage.main.length}`);
    }
  });
  it('allows incoming Latin candidate and source profiles by script, without hardcoded IDs', () => {
    const latinPreset = IRAN_CUSTOM_PRESETS.find(preset => preset.kind === 'international')!;
    const choices = iranAvailableFontProfiles(iranCustomizerState(latinPreset.id)).map(profile => profile.id);
    expect(choices).toEqual(Object.values(IRAN_FONT_PROFILES).filter(profile => profile.script === 'latin' && Object.keys(profile.glyphs).length > 0).map(profile => profile.id));
  });
  it('keeps role-only masters out of the main selector but preserves their source metadata', () => {
    const roleOnly: IranFontProfile = { ...fixture, id: 'role-only-fixture', label: 'Fixed source master', glyphs: {}, coverage: '' };
    const ordinary = IRAN_CUSTOM_PRESETS.find(preset => preset.kind === 'historical')!;
    expect(iranAvailableFontProfiles(iranCustomizerState(ordinary.id), [fixture, roleOnly]).map(profile => profile.id)).toEqual([fixture.id]);
    expect(iranRoleOnlyProfiles([fixture, roleOnly]).map(profile => profile.id)).toEqual([roleOnly.id]);
    const html = renderToStaticMarkup(<IranFontCoverage profile={fixture} roleOnlyProfiles={[roleOnly]} />);
    expect(html).toContain('Role-only master library · 1 profile');
    expect(html).toContain('data-role-only-profile="role-only-fixture"');
    expect(html).toContain('not main-font choices');
    expect(html).toContain('joined-city');
    expect(html).toContain('Private critical study only');
    expect(html).toContain('href="https://example.com/source"');
  });
  it('bundles complete role-font copyright/OFL notices and the coverage UI source hash', () => {
    const builder = readFileSync('scripts/build-iran-customizer.mjs', 'utf8');
    expect(builder).toContain("filename: 'Liberation-COPYRIGHT.txt'");
    expect(builder).toContain("filename: 'NotoSans-COPYRIGHT.txt'");
    expect(builder).toContain("url: 'https://github.com/notofonts/noto-fonts'");
    expect(builder).toContain("url: 'https://github.com/liberationfonts/liberation-fonts'");
    expect(builder).toContain("'src/ui/IranFontCoverage.tsx'");
    expect(builder).toContain('...fontLicenses.map(license => license.file)');
    const license = readFileSync('docs/research/iran-customizer/fonts/source/Liberation-COPYRIGHT.txt', 'utf8');
    expect(license).toContain('SIL OPEN FONT LICENSE');
    expect(license).toContain('Copyright');
    const notoLicense = readFileSync('docs/research/iran-customizer/fonts/source/NotoSans-COPYRIGHT.txt', 'utf8');
    expect(notoLicense).toMatch(/SIL Open Font License/i);
    expect(notoLicense).toContain('Google');
  });
});
