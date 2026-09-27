import { describe, expect, it } from 'vitest';
import { BUILT_IN_REGIONS } from '../regions';
import { buildTimeline, countryOf, groupByCountry, regionsInCountry, stepTimeline } from './timeline';

const bc = BUILT_IN_REGIONS.find((r) => r.id === 'ca-bc')!;

describe('country grouping', () => {
  const groups = groupByCountry(BUILT_IN_REGIONS);
  const country = (name: string) => groups.flatMap((c) => c.countries).find((g) => g.country === name);

  it('places every region in exactly one country', () => {
    expect(groups.flatMap((c) => c.countries.flatMap((g) => g.regions))).toHaveLength(BUILT_IN_REGIONS.length);
  });
  it('groups U.S. states and Canadian provinces under their countries in North America', () => {
    expect(country('United States')?.regions).toHaveLength(51);
    expect(country('Canada')?.regions.map((r) => r.id)).toEqual(['ca-bc']);
    expect(groups.find((c) => c.continent === 'North America')?.countries.map((g) => g.country)).toEqual(['Canada', 'United States']);
  });
  it('treats national regions as their own country', () => {
    expect(countryOf(BUILT_IN_REGIONS.find((r) => r.id === 'eu-de')!)).toBe('Germany');
    expect(regionsInCountry(BUILT_IN_REGIONS, bc)).toEqual([bc]);
  });
});

describe('timeline', () => {
  const timeline = buildTimeline(bc)!;

  it('places every B.C. preset in a chronological era', () => {
    expect(timeline.order).toHaveLength(bc.formats.length);
    expect(timeline.span).toEqual([1940, 1985]);
    expect(timeline.eras.map((e) => e.id)).toEqual(['annual-1940', 'bases-1949', 'totem-1952', 'annual-1955', 'beautiful-1964', 'decal-1970', 'blue-1979']);
    const starts = timeline.order.map((e) => e.period[0]);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    for (const era of timeline.eras) for (const e of era.entries) {
      expect(e.period[0]).toBeGreaterThanOrEqual(era.period[0]);
      expect(e.period[0]).toBeLessThanOrEqual(era.period[1]);
    }
  });
  it('steps through designs and stops at either end', () => {
    expect(stepTimeline(timeline, '1940', -1)).toBeUndefined();
    expect(stepTimeline(timeline, '1940', 1)?.id).toBe('1941');
    expect(stepTimeline(timeline, '1969', 1)?.id).toBe('1970-1972');
    expect(stepTimeline(timeline, '1985-fourth', 1)).toBeUndefined();
  });
  it('is absent for regions without dated formats', () => {
    expect(buildTimeline(BUILT_IN_REGIONS.find((r) => r.id === 'us-ca')!)).toBeNull();
    expect(buildTimeline(BUILT_IN_REGIONS.find((r) => r.id === 'cn')!)).toBeNull();
  });
  it('falls back to decade eras when a region declares none', () => {
    const t = buildTimeline({ ...bc, eras: undefined })!;
    expect(t.eras[0].id).toBe('1940s');
    expect(t.order).toHaveLength(bc.formats.length);
  });
});
