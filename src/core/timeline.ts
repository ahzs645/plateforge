/**
 * Region organisation helpers: country/continent grouping and the
 * chronological timeline built from format periods and region eras.
 */
import type { PlateEra, PlateFamily, PlateFormat, PlateGap, Region } from './types';

export const countryOf = (region: Region): string => region.country ?? region.name;

/** A country's regions, e.g. every U.S. state, or a single national region. */
export interface CountryGroup {
  country: string;
  flag: string;
  regions: Region[];
}
export interface ContinentGroup {
  continent: string;
  countries: CountryGroup[];
}

/** Continent → country → regions, preserving registration order within a country. */
export function groupByCountry(regions: readonly Region[]): ContinentGroup[] {
  const continents = new Map<string, Map<string, CountryGroup>>();
  for (const region of regions) {
    const countries = continents.get(region.group) ?? new Map<string, CountryGroup>();
    continents.set(region.group, countries);
    const name = countryOf(region);
    const entry = countries.get(name) ?? { country: name, flag: region.countryFlag ?? region.flag, regions: [] };
    entry.regions.push(region);
    countries.set(name, entry);
  }
  return [...continents].map(([continent, countries]) => ({
    continent,
    countries: [...countries.values()].sort((a, b) => a.country.localeCompare(b.country)),
  }));
}

export const regionsInCountry = (regions: readonly Region[], region: Region): Region[] =>
  regions.filter((r) => countryOf(r) === countryOf(region));

/** Family a format belongs to; undefined when the region declares no families. */
export const familyOf = (region: Region, format: PlateFormat): string | undefined => format.family ?? region.families?.[0]?.id;
const inFamily = (region: Region, family: string | undefined, own: string | undefined) =>
  family === undefined || (own ?? region.families?.[0]?.id) === family;

export interface FamilySummary extends PlateFamily { formats: PlateFormat[] }
/** Declared families that have at least one format, in declaration order. */
export function regionFamilies(region: Region): FamilySummary[] {
  return (region.families ?? []).map((f) => ({ ...f, formats: region.formats.filter((fmt) => familyOf(region, fmt) === f.id) }))
    .filter((f) => f.formats.length);
}
export const gapsFor = (region: Region, family?: string): PlateGap[] => (region.gaps ?? []).filter((g) => inFamily(region, family, g.family));

export interface TimelineEntry {
  format: PlateFormat;
  period: readonly [number, number];
}
export interface TimelineEra extends PlateEra {
  entries: TimelineEntry[];
}
export interface Timeline {
  family?: string;
  span: readonly [number, number];
  eras: TimelineEra[];
  /** Every dated format in chronological order, across eras. */
  order: TimelineEntry[];
}

export const formatPeriod = ([start, end]: readonly [number, number]): string => (start === end ? String(start) : `${start}–${end}`);

const byPeriod = (a: TimelineEntry, b: TimelineEntry) => a.period[0] - b.period[0] || a.period[1] - b.period[1];

/**
 * Builds a timeline when at least two formats carry a `period`. Formats are
 * assigned to their declared era, else the era whose range contains their
 * start year; anything left over lands in a synthetic per-decade era.
 */
export function buildTimeline(region: Region, family?: string): Timeline | null {
  const dated = region.formats.filter((f): f is PlateFormat & { period: readonly [number, number] } => !!f.period && inFamily(region, family, f.family));
  if (dated.length < 2) return null;
  const eras = new Map<string, TimelineEra>((region.eras ?? []).filter((era) => inFamily(region, family, era.family)).map((era) => [era.id, { ...era, entries: [] }]));
  for (const format of dated) {
    const entry = { format, period: format.period };
    const era = (format.era && eras.get(format.era))
      ?? [...eras.values()].find((e) => entry.period[0] >= e.period[0] && entry.period[0] <= e.period[1]);
    if (era) { era.entries.push(entry); continue; }
    const decade = Math.floor(entry.period[0] / 10) * 10;
    const id = `${decade}s`;
    const fallback = eras.get(id) ?? { id, label: `${decade}s`, period: [decade, decade + 9] as const, entries: [] };
    fallback.entries.push(entry);
    eras.set(id, fallback);
  }
  const list = [...eras.values()].filter((e) => e.entries.length)
    .map((e) => ({ ...e, entries: e.entries.sort(byPeriod) }))
    .sort((a, b) => a.period[0] - b.period[0]);
  const order = list.flatMap((e) => e.entries);
  const span = [Math.min(...order.map((e) => e.period[0])), Math.max(...order.map((e) => e.period[1]))] as const;
  return { family, span, eras: list, order };
}

/** The next/previous dated format in chronological order, or undefined at either end. */
export function stepTimeline(timeline: Timeline, formatId: string, delta: 1 | -1): PlateFormat | undefined {
  const i = timeline.order.findIndex((e) => e.format.id === formatId);
  if (i < 0) return timeline.order[delta > 0 ? 0 : timeline.order.length - 1]?.format;
  return timeline.order[i + delta]?.format;
}

const STATUS_LABELS: Record<string, string> = {
  'official-sample': 'Sample', prototype: 'Prototype', proposal: 'Proposal', souvenir: 'Souvenir',
  prop: 'Prop', reproduction: 'Reproduction', uncertain: 'Uncertain',
};
/** Short badge text for anything other than an issued plate. */
export const statusBadge = (format: PlateFormat): string | null => (format.status && format.status !== 'issued' ? STATUS_LABELS[format.status] ?? format.status : null);
