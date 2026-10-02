import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { IRAQ_CUSTOM_PRESETS, IRAQ_CUSTOM_SOURCE_COVERAGE } from '../templates/iraq-custom-data';
import { filterIraqTimeline, IRAQ_TIMELINE_COUNTS, IRAQ_TIMELINE_ENTRIES, IRAQ_TIMELINE_ERAS } from '../templates/iraq-custom-timeline';
import { IraqTimeline } from './IraqTimeline';

describe('Iraq chronological catalogue', () => {
  it('covers exactly 38 presets, 39 artworks and 27 original recipes without conflating them', () => {
    expect(IRAQ_TIMELINE_COUNTS).toEqual({ presets: 38, sourceArtworks: 39, originalRecipes: 27, photographs: 7, illustrations: 32 });
    expect(new Set(IRAQ_TIMELINE_ENTRIES.map(entry => entry.presetId))).toEqual(new Set(IRAQ_CUSTOM_PRESETS.map(preset => preset.id)));
    expect(new Set(IRAQ_TIMELINE_ENTRIES.flatMap(entry => entry.sourceArtworks))).toEqual(new Set(IRAQ_CUSTOM_SOURCE_COVERAGE.map(source => source.id)));
    for (const entry of IRAQ_TIMELINE_ENTRIES) {
      expect(IRAQ_TIMELINE_ERAS.some(era => era.id === entry.eraId)).toBe(true);
      expect(entry.sources.length).toBe(entry.sourceArtworks.length);
      for (const source of entry.sources) expect(new URL(source.url).protocol).toBe('https:');
    }
  });
  it('orders entries by family chronology and separates observation dates', () => {
    const positions = IRAQ_TIMELINE_ENTRIES.map(entry => IRAQ_TIMELINE_ERAS.findIndex(era => era.id === entry.eraId));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(IRAQ_TIMELINE_ERAS.find(era => era.id === 'legacy')!.dateNote).toMatch(/1982.*1988/);
    expect(IRAQ_TIMELINE_ERAS.find(era => era.id === 'bilingual')!.dateNote).toMatch(/2008.*2010/);
    expect(IRAQ_TIMELINE_ENTRIES.find(entry => entry.presetId === 'flat-erbil-truck')!.eraId).toBe('legacy');
    expect(IRAQ_TIMELINE_ENTRIES.find(entry => entry.presetId === 'flat-modern-long')!.eraId).toBe('krg-modern');
    expect(IRAQ_TIMELINE_ENTRIES.find(entry => entry.presetId === 'flat-anbar-taxi')!.sources[0].dateLabel).toContain('2009');
  });
  it('keeps unsupported and textual classes distinct from diagrams and photos', () => {
    const find = (id: string) => IRAQ_TIMELINE_ENTRIES.find(entry => entry.presetId === id)!;
    expect(find('kr-legacy-military').evidence).toBe('text');
    expect(find('federal-modern-temporary').evidence).toBe('unsupported');
    expect(find('kr-modern-temporary').evidence).toBe('illustration');
    expect(find('kr-modern-private').evidence).toBe('photograph');
    expect(find('private-2001').sourceArtworks).toContain('wiki-diagram-27');
  });
  it('uses actual geography for the Anbar taxi and international Erbil', () => {
    expect(filterIraqTimeline({ region: 'federal' }).some(entry => entry.presetId === 'flat-anbar-taxi')).toBe(true);
    expect(filterIraqTimeline({ region: 'kurdistan' }).some(entry => entry.presetId === 'flat-anbar-taxi')).toBe(false);
    expect(filterIraqTimeline({ region: 'kurdistan' }).some(entry => entry.presetId === 'illustration-international-erbil')).toBe(true);
  });
  it('intersects region, era, class, evidence and case-insensitive trimmed search', () => {
    expect(filterIraqTimeline({ region: 'federal', era: 'side-2001', vehicleClass: 'hire', evidence: 'photograph', query: '  ANBAR  ' }).map(entry => entry.presetId)).toEqual(['flat-anbar-taxi']);
    expect(filterIraqTimeline({ region: 'federal', era: 'krg-modern' })).toEqual([]);
    expect(filterIraqTimeline({ query: 'not-a-real-plate' })).toEqual([]);
    expect(filterIraqTimeline({})).toHaveLength(38);
    expect(filterIraqTimeline({ region: 'all', era: 'all', vehicleClass: 'all', evidence: 'all', query: ' ' })).toHaveLength(38);
  });
});

describe('Iraq timeline server-rendered interface', () => {
  it('renders all 38 live renderer thumbnails, editor actions and labelled controls', () => {
    const html = renderToStaticMarkup(<IraqTimeline onOpenPreset={() => {}} />);
    expect(html.match(/data-canonical="true"/g)).toHaveLength(38);
    expect(html.match(/class="iqt-open"/g)).toHaveLength(38);
    expect(html.match(/<select/g)).toHaveLength(4);
    expect(html).toContain('Country / region');
    expect(html).toContain('Vehicle class');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('A history in plates.');
    expect(html).toContain('1982 / 1988');
    expect(html).toContain('2008 / 2010');
    expect(html).toContain('Earlier history still needs evidence');
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('renders filtered results and a usable empty/reset state', () => {
    const single = renderToStaticMarkup(<IraqTimeline initialFilters={{ region: 'federal', evidence: 'photograph' }} onOpenPreset={() => {}} />);
    expect(single.match(/data-canonical="true"/g)).toHaveLength(1);
    expect(single).toContain('Flat Anbar');
    const empty = renderToStaticMarkup(<IraqTimeline initialFilters={{ query: 'no match anywhere' }} onOpenPreset={() => {}} />);
    expect(empty).toContain('No matching presets');
    expect(empty).toContain('Show all 38 presets');
    expect(empty).not.toContain('data-canonical="true"');
  });
});
