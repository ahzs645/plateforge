import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Region } from '../core/types';
import { buildTimeline, gapsFor, type CountryGroup } from '../core/timeline';
import { iran } from '../regions/asia/iran';
import { iraq } from '../regions/asia/iraq';
import { galleryCountryIsSimple, gallerySectionsFor, GalleryView } from './GalleryView';

// Gallery evidence visibility is independent from template registration and SVG outline rendering.
vi.mock('./PlateView', () => ({ PlateView: () => <svg aria-label="Plate thumbnail" /> }));
const groupFor = (region: Region): CountryGroup => ({ country: region.country ?? region.name, flag: region.flag, regions: [region] });

describe('Gallery coverage when no timeline exists', () => {
  it('shows the Iran 2017 geometry barrier without assigning dates to the other free-zone designs', () => {
    const before = iran.formats.filter(format => format.family === 'free-zone').map(format => ({ id: format.id, period: format.period }));
    expect(before.filter(format => format.period)).toEqual([{ id: 'free-zone-old-qeshm', period: [2010, 2010] }]);
    expect(buildTimeline(iran, 'free-zone')).toBeNull();
    const sections = gallerySectionsFor(groupFor(iran), '', 'free-zone');
    expect(sections.flatMap(section => section.cards.map(card => card.format.id))).toEqual(before.map(format => format.id));
    const gaps = sections.filter(section => section.gap);
    expect(gaps.map(section => section.gap?.id)).toEqual(gapsFor(iran, 'free-zone').map(gap => gap.id));
    expect(gaps.some(section => section.gap?.id === 'free-zone-2017')).toBe(true);
    expect(gaps.find(section => section.gap?.id === 'free-zone-2017')?.summary).toContain('generic placeholder');
    expect(iran.formats.filter(format => format.family === 'free-zone').map(format => ({ id: format.id, period: format.period }))).toEqual(before);
  });
  it('also keeps gaps for a single-family or no-family country without a timeline', () => {
    const region: Region = { ...iran, id: 'single-fixture', families: undefined, eras: undefined, formats: [{ ...iran.formats[0], family: undefined, period: undefined }], gaps: [{ id: 'unbuilt', label: 'Unbuilt source arrangement', period: [2017, 2017], note: 'Geometry remains unverified.', sources: [] }] };
    const sections = gallerySectionsFor(groupFor(region), '');
    expect(sections.filter(section => section.gap)).toHaveLength(1);
    expect(sections.flatMap(section => section.cards)).toHaveLength(1);
    expect(galleryCountryIsSimple(groupFor(region))).toBe(false);
    expect(galleryCountryIsSimple(groupFor({ ...region, gaps: [] }))).toBe(true);
  });
  it('retains search filtering and never duplicates gaps in already dated families', () => {
    expect(gallerySectionsFor(groupFor(iran), 'qeshm', 'free-zone').some(section => section.gap)).toBe(false);
    for (const region of [iran, iraq]) {
      const sections = gallerySectionsFor(groupFor(region), '');
      const gaps = sections.filter(section => section.gap).map(section => section.gap!.id);
      expect(new Set(gaps).size).toBe(gaps.length);
      expect(new Set(gaps)).toEqual(new Set((region.gaps ?? []).map(gap => gap.id)));
      expect(sections.flatMap(section => section.cards)).toHaveLength(region.formats.length);
    }
  });
  it('renders the ordinary Iran gallery barrier and source link', () => {
    const html = renderToStaticMarkup(<GalleryView regions={[iran]} region={iran} format={iran.formats.find(format => format.id === 'free-zone-old-qeshm')!} onOpen={() => {}} onSelectRegion={() => {}} />);
    expect(html).toContain('2017 common free-zone redesign · geometry barrier');
    expect(html).toContain('generic placeholder, not a plate');
    expect(html).toContain('href="https://www.sarpoosh.com/car-news/automobile/automobile960502629.html"');
    expect(html).toContain('Not reconstructed yet');
  });
});
