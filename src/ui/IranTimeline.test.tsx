import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_SOURCE_COVERAGE } from '../templates/iran-custom-data';
import { filterIranTimeline, IRAN_TIMELINE_COUNTS, IRAN_TIMELINE_ENTRIES, IRAN_TIMELINE_ERAS, IranTimeline, namespaceIranSvg } from './IranTimeline';

describe('Iran chronological catalogue', () => {
  it('is exactly derived from every implemented preset without a second inventory', () => {
    expect(new Set(IRAN_TIMELINE_ENTRIES.map(entry => entry.id))).toEqual(new Set(IRAN_CUSTOM_PRESETS.map(preset => preset.id)));
    expect(IRAN_TIMELINE_COUNTS.presets).toBe(IRAN_CUSTOM_PRESETS.length);
    expect(IRAN_TIMELINE_COUNTS.sourceArtworks).toBe(IRAN_CUSTOM_SOURCE_COVERAGE.length);
    expect(IRAN_TIMELINE_COUNTS.coverageBarriers).toBe(IRAN_CUSTOM_SOURCE_COVERAGE.filter(source => !source.presetId).length);
    expect(IRAN_TIMELINE_ENTRIES.map(entry => entry.sortYear)).toEqual([...IRAN_TIMELINE_ENTRIES.map(entry => entry.sortYear)].sort((a, b) => a - b));
    for (const entry of IRAN_TIMELINE_ENTRIES) {
      expect(IRAN_TIMELINE_ERAS.some(era => era.id === entry.family)).toBe(true);
      expect(entry.dateNote.length).toBeGreaterThan(10);
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const source of entry.sources) expect(['https:', 'http:']).toContain(new URL(source.url).protocol);
    }
  });
  it('intersects era, class, confidence and trimmed case-insensitive query', () => {
    const sample = IRAN_TIMELINE_ENTRIES[0];
    const matches = filterIranTimeline({ era: sample.family, vehicleClass: sample.defaults.vehicleClass, confidence: sample.confidence, query: `  ${sample.label.toUpperCase()}  ` });
    expect(matches.map(entry => entry.id)).toContain(sample.id);
    for (const entry of matches) expect(entry).toMatchObject({ family: sample.family, confidence: sample.confidence, defaults: { vehicleClass: sample.defaults.vehicleClass } });
    expect(filterIranTimeline({ query: 'no matching design anywhere' })).toEqual([]);
    expect(filterIranTimeline({ query: ' ' })).toHaveLength(IRAN_CUSTOM_PRESETS.length);
  });
  it('links all supported source entries to actual presets and excludes known fake evidence', () => {
    for (const source of IRAN_CUSTOM_SOURCE_COVERAGE) if (source.presetId) expect(IRAN_CUSTOM_PRESETS.some(preset => preset.id === source.presetId)).toBe(true);
    const fake = IRAN_CUSTOM_SOURCE_COVERAGE.find(source => /fake/i.test(source.id + source.label))!;
    expect(fake).toBeDefined(); expect(fake.presetId).toBeNull(); expect(fake.status).toMatch(/excluded|rejected/i);
  });
});

describe('Iran timeline SSR interface', () => {
  it('renders every live thumbnail, labeled filters, date note, source and coverage barrier', () => {
    const html = renderToStaticMarkup(<IranTimeline onOpenPreset={() => {}} />);
    expect(html.match(/data-canonical="true"/g)).toHaveLength(IRAN_CUSTOM_PRESETS.length);
    expect(html.match(/class="int-open"/g)).toHaveLength(IRAN_CUSTOM_PRESETS.length);
    expect(html.match(/data-source-id=/g)).toHaveLength(IRAN_CUSTOM_SOURCE_COVERAGE.length);
    expect(html.match(/data-coverage-barrier="true"/g)).toHaveLength(IRAN_TIMELINE_COUNTS.coverageBarriers);
    expect(html).toContain('Era / family'); expect(html).toContain('Vehicle class'); expect(html).toContain('Evidence confidence');
    expect(html).toContain('Observation dates are not introduction dates.'); expect(html).toContain('Solar Hijri (SH)');
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('keeps unbuilt barriers visible in the filtered empty state', () => {
    const html = renderToStaticMarkup(<IranTimeline onOpenPreset={() => {}} initialFilters={{ query: 'no matching design anywhere' }} />);
    expect(html).toContain('No matching presets');
    expect(html).toContain(`Show all ${IRAN_CUSTOM_PRESETS.length} presets`);
    expect(html).not.toContain('data-canonical="true"');
    expect(html).toContain('data-coverage-barrier="true"');
  });
  it('namespaces shared SVG IDs and references without changing paths', () => {
    const svg = '<svg><defs><clipPath id="clip"><path d="M1 1"/></clipPath></defs><g clip-path="url(#clip)"><use href="#clip"/></g></svg>';
    expect(namespaceIranSvg(svg, 'card')).toBe('<svg><defs><clipPath id="card-clip"><path d="M1 1"/></clipPath></defs><g clip-path="url(#card-clip)"><use href="#card-clip"/></g></svg>');
  });
});
