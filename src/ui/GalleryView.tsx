import { useMemo, useState } from 'react';
import { buildTimeline, countryOf, familyOf, formatPeriod, gapsFor, groupByCountry, regionFamilies, statusBadge, type CountryGroup } from '../core/timeline';
import type { PlateFormat, PlateGap, Region } from '../core/types';
import { PlateView } from './PlateView';
import { samplePlate } from './samples';
import './timeline.css';

type Scope = 'country' | 'continent';

interface Props {
  regions: Region[];
  region: Region;
  format: PlateFormat;
  onOpen(regionId: string, formatId: string): void;
}

interface Card { region: Region; format: PlateFormat; title: string; meta: string }
interface Section { id: string; heading: string; period?: string; start?: number; summary?: string; cards: Card[]; gap?: PlateGap; coverageRoute?: string }

function sectionsFor(group: CountryGroup, query: string, familyFilter = ''): Section[] {
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
          if (cards.length) dated.push({ id: `${region.id}/${era.id}`, heading: head(era.label), period: formatPeriod(era.period), start: era.period[0], summary: era.summary, cards });
        }
        // Unbuilt periods stay visible (unless filtering) so the history reads without silent holes.
        if (!q) for (const gap of gapsFor(region, family?.id)) dated.push({ id: `${region.id}/${gap.id}`, heading: head(gap.label), period: formatPeriod(gap.period), start: gap.period[0], summary: gap.note, cards: [], gap, coverageRoute: region.coverageRoute });
        sections.push(...dated.sort((x, y) => x.start! - y.start!));
        loose.push(...formats.filter((f) => !f.period).map((format) => ({ region, format, title: format.label, meta: prefix || region.name })).filter(keep));
      } else if (family && families.length > 1) {
        const cards = formats.map((format) => ({ region, format, title: format.label, meta: format.period ? formatPeriod(format.period) : format.pattern ?? '' })).filter(keep);
        if (cards.length) sections.push({ id: `${region.id}/${family.id}`, heading: head('Designs'), summary: family.summary, cards });
      } else {
        loose.push(...formats.map((format) => multi
          ? { region, format, title: region.name, meta: region.formats.length > 1 ? format.label : region.code }
          : { region, format, title: format.label, meta: format.pattern ?? region.code }).filter(keep));
      }
    }
  }
  if (loose.length) sections.push({ id: `${group.country}/designs`, heading: sections.length ? 'Other designs' : multi ? 'All regions' : 'Designs', cards: loose });
  return sections;
}

/** Every design for the current country (or continent), with dated regions laid out as a timeline. */
export function GalleryView({ regions, region, format, onOpen }: Props) {
  const [scope, setScope] = useState<Scope>('country');
  const [query, setQuery] = useState('');
  const families = useMemo(() => regionFamilies(region), [region]);
  const [familyFilter, setFamilyFilter] = useState('');
  const activeFamily = scope === 'country' && families.some((f) => f.id === familyFilter) ? familyFilter : '';
  const continent = useMemo(() => groupByCountry(regions).find((c) => c.continent === region.group), [regions, region.group]);
  const countries = useMemo(() => (continent?.countries ?? []).filter((g) => scope === 'continent' || g.country === countryOf(region)), [continent, scope, region]);
  const blocks = useMemo(() => {
    // Across a continent, single-region undated countries share one grid instead of a section each.
    const simple = (g: CountryGroup) => scope === 'continent' && g.regions.length === 1 && !buildTimeline(g.regions[0]);
    const q = query.trim().toLowerCase();
    const national: Card[] = countries.filter(simple).flatMap((g) => g.regions[0].formats.map((f) => ({ region: g.regions[0], format: f, title: g.country, meta: f.label })))
      .filter((c) => !q || `${c.title} ${c.meta} ${c.region.code}`.toLowerCase().includes(q));
    const list = countries.filter((g) => !simple(g)).map((g) => ({ key: g.country, group: g as CountryGroup | undefined, sections: sectionsFor(g, query, g.regions.includes(region) ? activeFamily : '') }));
    if (national.length) list.push({ key: 'national', group: undefined, sections: [{ id: 'national', heading: 'National designs', summary: 'Countries with a single national plate system.', cards: national }] });
    return list.filter((b) => b.sections.length);
  }, [countries, query, scope, region, activeFamily]);
  const countryCount = new Set(blocks.flatMap((b) => b.sections.flatMap((s) => s.cards.map((c) => countryOf(c.region))))).size;
  const current = countries.find((g) => g.country === countryOf(region));
  const total = blocks.reduce((n, b) => n + b.sections.reduce((m, s) => m + s.cards.length, 0), 0);
  const timeline = buildTimeline(region, familyOf(region, format));

  return (
    <section className="gallery" aria-label="Plate gallery">
      <header className="gallery-head">
        <div>
          <p className="gallery-eyebrow">{region.group}{scope === 'country' && current ? ` / ${current.country}` : ''}</p>
          <h1>
            {scope === 'country' && current ? <><span aria-hidden="true">{current.flag}</span> {current.country}</> : region.group}
          </h1>
          <p className="gallery-sub">
            {total} {total === 1 ? 'design' : 'designs'}
            {scope === 'continent' ? ` across ${countryCount} ${countryCount === 1 ? 'country' : 'countries'}` : current && current.regions.length > 1 ? ` across ${current.regions.length} regions` : ''}
            {scope === 'country' && timeline ? ` · ${formatPeriod(timeline.span)} timeline` : ''}
          </p>
        </div>
        <div className="gallery-controls">
          <div className="tabs" role="tablist" aria-label="Gallery scope">
            <button role="tab" aria-selected={scope === 'country'} onClick={() => setScope('country')}>{current?.country ?? 'Country'}</button>
            <button role="tab" aria-selected={scope === 'continent'} onClick={() => setScope('continent')}>All of {region.group}</button>
          </div>
          {scope === 'country' && families.length > 1 && <div className="select gallery-family"><select aria-label="Plate family" value={activeFamily} onChange={(e) => setFamilyFilter(e.target.value)}>
            <option value="">All families ({families.reduce((n, f) => n + f.formats.length, 0)})</option>
            {families.map((f) => <option key={f.id} value={f.id}>{f.label} ({f.formats.length})</option>)}
          </select></div>}
          <input className="gallery-search" aria-label="Filter designs" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by name, year or code…" spellCheck={false} autoComplete="off" />
        </div>
      </header>

      {blocks.map(({ key, group, sections }) => (
        <div key={key} className="gallery-country">
          {scope === 'continent' && group && <h2 className="gallery-country-title"><span aria-hidden="true">{group.flag}</span> {group.country}<span>{group.regions.length > 1 ? `${group.regions.length} regions` : ''}</span></h2>}
          {sections.map((s) => (
            <section key={s.id} className={`gallery-section ${s.period ? 'dated' : ''} ${s.gap ? 'gap' : ''}`}>
              <div className="gallery-era">
                {s.period && <span className="gallery-era-period mono">{s.period}</span>}
                <h3>{s.heading}</h3>
                {s.summary && <p>{s.summary}</p>}
                <span className="gallery-era-count">{s.gap ? 'Not reconstructed yet' : `${s.cards.length} ${s.cards.length === 1 ? 'design' : 'designs'}`}</span>
              </div>
              {s.gap ? <div className="gallery-gap">
                <p>Documented by the source, with no editable preset yet.</p>
                <div className="gallery-gap-links">{s.gap.sources.map((src) => <a key={src.url} href={src.url} target="_blank" rel="noreferrer">{src.title} ↗</a>)}</div>
                {s.coverageRoute && <a className="btn" href={s.coverageRoute}>See coverage &amp; gaps</a>}
              </div> : <ul className="gallery-grid">
                {s.cards.map((c) => (
                  <li key={`${c.region.id}/${c.format.id}`}>
                    <button className="gallery-card" aria-current={c.region.id === region.id && c.format.id === format.id} onClick={() => onOpen(c.region.id, c.format.id)}>
                      <PlateView plate={samplePlate(c.region, c.format)} className="thumb" />
                      {statusBadge(c.format) && <span className="status-badge gallery-status">{statusBadge(c.format)}</span>}
                      <span className="gallery-card-title">{s.id === 'national' ? <><span aria-hidden="true">{c.region.flag}</span> </> : null}{c.title}</span>
                      {c.meta !== c.title && <span className="batch-meta">{c.meta}</span>}
                    </button>
                  </li>
                ))}
              </ul>}
            </section>
          ))}
        </div>
      ))}
      {!blocks.length && <p className="gallery-empty" role="status">No designs match “{query}”.</p>}
    </section>
  );
}
