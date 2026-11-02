/**
 * Gallery sections: a country's (or one region's) designs grouped by family and era, in date order,
 * with documented-but-unbuilt periods kept in place. Framework-free, so PlateForge's gallery and the
 * embed (src/embed/, used by PofBC's Plates view) lay plates out from the same data.
 */
import { buildTimeline, formatPeriod, gapsFor, regionFamilies, type CountryGroup } from './timeline';
import type { PlateFormat, PlateGap, Region } from './types';

export interface Card { region: Region; format: PlateFormat; title: string; meta: string }
export interface Section {
  id: string;
  /** The section's title, prefixed with its region and family where several share a gallery. */
  heading: string;
  /** The same title without that prefix (the era or gap's own name), for hosts that group by family themselves. */
  label: string;
  /** The family the section belongs to, when its region declares families. */
  family?: string;
  period?: string; start?: number; summary?: string; cards: Card[]; gap?: PlateGap; coverageRoute?: string;
}

export function gallerySectionsFor(group: CountryGroup, query: string, familyFilter = ''): Section[] {
  const q = query.trim().toLowerCase();
  const keep = (c: Card) => !q || `${c.title} ${c.meta} ${c.region.name} ${c.region.code} ${c.format.id}`.toLowerCase().includes(q);
  const multi = group.regions.length > 1;
  const sections: Section[] = [];
  const loose: Card[] = [];
  for (const region of group.regions) {
    const families = regionFamilies(region);
    const scopes = families.length ? families.filter((f) => !familyFilter || f.id === familyFilter) : [undefined];
    for (const family of scopes) {
      // Prefix headings when a region has several families or a country has several regions.
      const prefix = [multi ? region.name : '', families.length > 1 && family ? family.label : ''].filter(Boolean).join(' · ');
      const head = (label: string) => prefix ? `${prefix} · ${label}` : label;
      const formats = family ? family.formats : region.formats;
      const timeline = buildTimeline(region, family?.id);
      if (timeline) {
        const dated: Section[] = [];
        for (const era of timeline.eras) {
          const cards = era.entries.map(({ format, period }) => ({ region, format, title: format.label, meta: multi ? `${region.name} · ${formatPeriod(period)}` : formatPeriod(period) })).filter(keep);
          if (cards.length) dated.push({ id: `${region.id}/${era.id}`, heading: head(era.label), label: era.label, family: family?.id, period: formatPeriod(era.period), start: era.period[0], summary: era.summary, cards });
        }
        // Unbuilt periods stay visible (unless filtering) so the history reads without silent holes.
        if (!q) for (const gap of gapsFor(region, family?.id)) dated.push({ id: `${region.id}/${gap.id}`, heading: head(gap.label), label: gap.label, family: family?.id, period: formatPeriod(gap.period), start: gap.period[0], summary: gap.note, cards: [], gap, coverageRoute: region.coverageRoute });
        sections.push(...dated.sort((x, y) => x.start! - y.start!));
        loose.push(...formats.filter((f) => !f.period).map((format) => ({ region, format, title: format.label, meta: prefix || region.name })).filter(keep));
      } else if (family && families.length > 1) {
        const cards = formats.map((format) => ({ region, format, title: format.label, meta: format.period ? formatPeriod(format.period) : format.pattern ?? '' })).filter(keep);
        if (cards.length) sections.push({ id: `${region.id}/${family.id}`, heading: head('Designs'), label: 'Designs', family: family.id, summary: family.summary, cards });
      } else {
        loose.push(...formats.map((format) => multi
          ? { region, format, title: region.name, meta: region.formats.length > 1 ? format.label : region.code }
          : { region, format, title: format.label, meta: format.pattern ?? region.code }).filter(keep));
      }
      // A family can have too few dated designs for a timeline and still have documented gaps.
      // Keep its existing source periods; never manufacture another dated format just to show them.
      if (!timeline && !q) for (const gap of gapsFor(region, family?.id)) sections.push({
        id: `${region.id}/${gap.id}`, heading: head(gap.label), label: gap.label, family: family?.id, period: formatPeriod(gap.period),
        start: gap.period[0], summary: gap.note, cards: [], gap, coverageRoute: region.coverageRoute,
      });
    }
  }
  if (loose.length) {
    const heading = sections.length ? 'Other designs' : multi ? 'All regions' : 'Designs';
    sections.push({ id: `${group.country}/designs`, heading, label: heading, cards: loose });
  }
  return sections;
}

/** Gap-bearing countries need their own sections even when their formats do not form a timeline. */
export const galleryCountryIsSimple = (group: CountryGroup): boolean => group.regions.length === 1
  && !buildTimeline(group.regions[0]) && !(group.regions[0].gaps?.length);
