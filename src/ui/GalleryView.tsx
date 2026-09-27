import { useMemo, useState } from 'react';
import { buildTimeline, countryOf, formatPeriod, groupByCountry, type CountryGroup } from '../core/timeline';
import type { PlateFormat, Region } from '../core/types';
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
interface Section { id: string; heading: string; period?: string; summary?: string; cards: Card[] }

function sectionsFor(group: CountryGroup, query: string): Section[] {
  const q = query.trim().toLowerCase();
  const keep = (c: Card) => !q || `${c.title} ${c.meta} ${c.region.name} ${c.region.code} ${c.format.id}`.toLowerCase().includes(q);
  const multi = group.regions.length > 1;
  const sections: Section[] = [];
  const loose: Card[] = [];
  for (const region of group.regions) {
    const timeline = buildTimeline(region);
    if (timeline) {
      for (const era of timeline.eras) {
        const cards = era.entries.map(({ format, period }) => ({ region, format, title: format.label, meta: multi ? `${region.name} · ${formatPeriod(period)}` : formatPeriod(period) })).filter(keep);
        if (cards.length) sections.push({ id: `${region.id}/${era.id}`, heading: multi ? `${region.name} · ${era.label}` : era.label, period: formatPeriod(era.period), summary: era.summary, cards });
      }
      const undated = region.formats.filter((f) => !f.period);
      loose.push(...undated.map((format) => ({ region, format, title: format.label, meta: region.name })).filter(keep));
    } else {
      loose.push(...region.formats.map((format) => multi
        ? { region, format, title: region.name, meta: region.formats.length > 1 ? format.label : region.code }
        : { region, format, title: format.label, meta: format.pattern ?? region.code }).filter(keep));
    }
  }
  if (loose.length) sections.push({ id: `${group.country}/designs`, heading: sections.length ? 'Other designs' : multi ? 'All regions' : 'Designs', cards: loose });
  return sections;
}

/** Every design for the current country (or continent), with dated regions laid out as a timeline. */
export function GalleryView({ regions, region, format, onOpen }: Props) {
  const [scope, setScope] = useState<Scope>('country');
  const [query, setQuery] = useState('');
  const continent = useMemo(() => groupByCountry(regions).find((c) => c.continent === region.group), [regions, region.group]);
  const countries = useMemo(() => (continent?.countries ?? []).filter((g) => scope === 'continent' || g.country === countryOf(region)), [continent, scope, region]);
  const blocks = useMemo(() => {
    // Across a continent, single-region undated countries share one grid instead of a section each.
    const simple = (g: CountryGroup) => scope === 'continent' && g.regions.length === 1 && !buildTimeline(g.regions[0]);
    const q = query.trim().toLowerCase();
    const national: Card[] = countries.filter(simple).flatMap((g) => g.regions[0].formats.map((f) => ({ region: g.regions[0], format: f, title: g.country, meta: f.label })))
      .filter((c) => !q || `${c.title} ${c.meta} ${c.region.code}`.toLowerCase().includes(q));
    const list = countries.filter((g) => !simple(g)).map((g) => ({ key: g.country, group: g as CountryGroup | undefined, sections: sectionsFor(g, query) }));
    if (national.length) list.push({ key: 'national', group: undefined, sections: [{ id: 'national', heading: 'National designs', summary: 'Countries with a single national plate system.', cards: national }] });
    return list.filter((b) => b.sections.length);
  }, [countries, query, scope]);
  const countryCount = new Set(blocks.flatMap((b) => b.sections.flatMap((s) => s.cards.map((c) => countryOf(c.region))))).size;
  const current = countries.find((g) => g.country === countryOf(region));
  const total = blocks.reduce((n, b) => n + b.sections.reduce((m, s) => m + s.cards.length, 0), 0);
  const timeline = buildTimeline(region);

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
          <input className="gallery-search" aria-label="Filter designs" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by name, year or code…" spellCheck={false} autoComplete="off" />
        </div>
      </header>

      {blocks.map(({ key, group, sections }) => (
        <div key={key} className="gallery-country">
          {scope === 'continent' && group && <h2 className="gallery-country-title"><span aria-hidden="true">{group.flag}</span> {group.country}<span>{group.regions.length > 1 ? `${group.regions.length} regions` : ''}</span></h2>}
          {sections.map((s) => (
            <section key={s.id} className={`gallery-section ${s.period ? 'dated' : ''}`}>
              <div className="gallery-era">
                {s.period && <span className="gallery-era-period mono">{s.period}</span>}
                <h3>{s.heading}</h3>
                {s.summary && <p>{s.summary}</p>}
                <span className="gallery-era-count">{s.cards.length} {s.cards.length === 1 ? 'design' : 'designs'}</span>
              </div>
              <ul className="gallery-grid">
                {s.cards.map((c) => (
                  <li key={`${c.region.id}/${c.format.id}`}>
                    <button className="gallery-card" aria-current={c.region.id === region.id && c.format.id === format.id} onClick={() => onOpen(c.region.id, c.format.id)}>
                      <PlateView plate={samplePlate(c.region, c.format)} className="thumb" />
                      <span className="gallery-card-title">{s.id === 'national' ? <><span aria-hidden="true">{c.region.flag}</span> </> : null}{c.title}</span>
                      {c.meta !== c.title && <span className="batch-meta">{c.meta}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ))}
      {!blocks.length && <p className="gallery-empty" role="status">No designs match “{query}”.</p>}
    </section>
  );
}
