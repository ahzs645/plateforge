import { useId, useMemo, useState } from 'react';
import { customizerState, renderIraqCustom } from '../templates/iraq-custom-scene';
import {
  filterIraqTimeline, IRAQ_TIMELINE_CLASS_LABELS, IRAQ_TIMELINE_CONFIDENCE_LABELS,
  IRAQ_TIMELINE_COUNTS, IRAQ_TIMELINE_DEFAULT_FILTERS, IRAQ_TIMELINE_ERAS,
  IRAQ_TIMELINE_EVIDENCE_LABELS, IRAQ_TIMELINE_GAPS, IRAQ_TIMELINE_REGION_LABELS,
  type IraqTimelineEntry, type IraqTimelineFilters, type IraqTimelineSource,
} from '../templates/iraq-custom-timeline';
import './iraq-timeline.css';

export interface IraqTimelineProps {
  onOpenPreset(presetId: string): void;
  /** Optional initial filtering for embedded views. Does not alter the catalogue. */
  initialFilters?: Partial<IraqTimelineFilters>;
}
function SourceLinks({ sources }: { sources: IraqTimelineSource[] }) {
  return <ul className="iqt-sources">{sources.map(source => <li key={source.id}>
    <a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>
    <span>{source.dateLabel}</span><p>{source.note}</p>
  </li>)}</ul>;
}
function PresetCard({ entry, onOpenPreset }: { entry: IraqTimelineEntry; onOpenPreset(presetId: string): void }) {
  const id = useId();
  const scene = useMemo(() => renderIraqCustom(customizerState(entry.presetId)), [entry.presetId]);
  // Each scene includes settings metadata; namespace its id when many scenes share one page.
  const svg = scene.svg.replace('id="plateforge-iraq-settings"', `id="iqt-settings-${id}"`);
  return <article className="iqt-card" aria-labelledby={`${id}-title`} data-preset-id={entry.presetId}>
    <div className="iqt-preview" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
    <div className="iqt-card-body">
      <p className="iqt-region">{IRAQ_TIMELINE_REGION_LABELS[entry.region]} · {IRAQ_TIMELINE_CLASS_LABELS[entry.vehicleClass] ?? entry.vehicleClass}</p>
      <h3 id={`${id}-title`}>{entry.label}</h3><p className="iqt-period">{entry.period}</p>
      <span className={`iqt-badge iqt-evidence-${entry.evidence}`}>{IRAQ_TIMELINE_EVIDENCE_LABELS[entry.evidence]}</span>
      <p className="iqt-evidence-note">{entry.evidenceNote}</p>
      <details className="iqt-card-sources"><summary>Source evidence · {entry.sourceArtworks.length} {entry.sourceArtworks.length === 1 ? 'artwork' : 'artworks'}</summary>
        {entry.sources.length ? <SourceLinks sources={entry.sources} /> : <p>No matching artwork. Read the era’s chronology sources below; they do not verify this arrangement.</p>}
        <p className="iqt-small">Family dates and specimen observation dates are separate. The preview uses the live editable renderer, with its default candidate/fallback policy.</p>
        {scene.warnings.length > 0 && <p className="iqt-small">Renderer: {scene.warnings.length} source / lettering {scene.warnings.length === 1 ? 'notice' : 'notices'}. Open the editor to inspect these before export.</p>}
      </details>
      <button type="button" className="iqt-open" onClick={() => onOpenPreset(entry.presetId)} aria-label={`Open ${entry.label} in editor`}>Open in editor <span aria-hidden="true">↗</span></button>
    </div>
  </article>;
}

/** Six chronological families, all editor presets, and explicit unbuilt historical gaps. */
export function IraqTimeline({ onOpenPreset, initialFilters }: IraqTimelineProps) {
  const [filters, setFilters] = useState<IraqTimelineFilters>(() => ({ ...IRAQ_TIMELINE_DEFAULT_FILTERS, ...initialFilters }));
  const id = useId();
  const entries = useMemo(() => filterIraqTimeline(filters), [filters]);
  const eras = IRAQ_TIMELINE_ERAS.filter(era => entries.some(entry => entry.eraId === era.id));
  const change = (key: keyof IraqTimelineFilters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const active = Object.entries(filters).some(([key, value]) => value !== IRAQ_TIMELINE_DEFAULT_FILTERS[key as keyof IraqTimelineFilters]);
  return <section className="iraq-timeline" aria-labelledby={`${id}-heading`}>
    <header className="iqt-heading"><p className="iqt-eyebrow">PLATEFORGE · IRAQ REFERENCE ATLAS</p>
      <h1 id={`${id}-heading`}>A history in plates.</h1>
      <p className="iqt-intro">Explore the Iraqi and Kurdistan plate families, then open any design in the flat editor. Dates, source strength and research gaps stay visible.</p>
      <dl className="iqt-counts"><div><dt>Editable presets</dt><dd>{IRAQ_TIMELINE_COUNTS.presets}</dd></div><div><dt>Source artworks</dt><dd>{IRAQ_TIMELINE_COUNTS.sourceArtworks}</dd></div><div><dt>Original recipes</dt><dd>{IRAQ_TIMELINE_COUNTS.originalRecipes}</dd></div></dl>
      <p className="iqt-small">The {IRAQ_TIMELINE_COUNTS.sourceArtworks} artworks comprise {IRAQ_TIMELINE_COUNTS.photographs} photographs and {IRAQ_TIMELINE_COUNTS.illustrations} illustrations. Artworks can support several presets. The {IRAQ_TIMELINE_COUNTS.originalRecipes} original recipes are included in the {IRAQ_TIMELINE_COUNTS.presets} editable presets; these are different inventories, not competing totals.</p>
    </header>
    <aside className="iqt-caution" aria-label="Chronology and evidence limits"><strong>A dated family is not a certified die.</strong> Legacy introduction is disputed (1982 / 1988), as is bilingual rollout (2008 / 2010). Photographs dated 2009, 2015 or 2024 document use, not introduction. “Onward” means open-ended in this review, not confirmed current issuance. Research reviewed 2 October 2026.</aside>
    <section className="iqt-filter-panel" aria-labelledby={`${id}-filter-title`}>
      <div className="iqt-filter-heading"><h2 id={`${id}-filter-title`}>Explore the collection</h2><button type="button" className="iqt-reset" disabled={!active} onClick={() => setFilters({ ...IRAQ_TIMELINE_DEFAULT_FILTERS })}>Clear filters</button></div>
      <div className="iqt-filters">
        <label><span>Country / region</span><select value={filters.region} onChange={event => change('region', event.target.value)}><option value="all">Iraq · all regions</option>{Object.entries(IRAQ_TIMELINE_REGION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>Era</span><select value={filters.era} onChange={event => change('era', event.target.value)}><option value="all">All eras</option>{IRAQ_TIMELINE_ERAS.map(era => <option value={era.id} key={era.id}>{era.label}</option>)}</select></label>
        <label><span>Vehicle class</span><select value={filters.vehicleClass} onChange={event => change('vehicleClass', event.target.value)}><option value="all">All classes</option>{Object.entries(IRAQ_TIMELINE_CLASS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>Evidence</span><select value={filters.evidence} onChange={event => change('evidence', event.target.value)}><option value="all">All evidence</option>{Object.entries(IRAQ_TIMELINE_EVIDENCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="iqt-search"><span>Search designs</span><input type="search" value={filters.query} onChange={event => change('query', event.target.value)} placeholder="Try Erbil, taxi or 2024" /></label>
      </div>
      <p className="iqt-results" role="status" aria-live="polite">{entries.length} of {IRAQ_TIMELINE_COUNTS.presets} presets · {eras.length} of {IRAQ_TIMELINE_ERAS.length} eras</p>
    </section>
    {eras.length > 0 && <nav className="iqt-era-nav" aria-label="Jump to era">{eras.map(era => <a key={era.id} href={`#${id}-${era.id}`} onClick={event => { event.preventDefault(); document.getElementById(`${id}-${era.id}`)?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }}>{era.sortYear}{era.confidence === 'disputed' ? '*' : ''}<span>{era.label}</span></a>)}</nav>}
    {entries.length === 0 && <div className="iqt-empty"><h2>No matching presets</h2><p>Try a broader era, region or evidence filter.</p><button type="button" onClick={() => setFilters({ ...IRAQ_TIMELINE_DEFAULT_FILTERS })}>Show all 38 presets</button></div>}
    <div className="iqt-era-list">{eras.map(era => <section className="iqt-era" id={`${id}-${era.id}`} key={era.id} aria-labelledby={`${id}-${era.id}-title`}>
      <header className="iqt-era-heading"><div className="iqt-era-date"><span>{era.sortYear}{era.confidence === 'disputed' ? '*' : ''}</span><span className="iqt-badge">{IRAQ_TIMELINE_CONFIDENCE_LABELS[era.confidence]}</span></div>
        <div><p className="iqt-period">{era.period}</p><h2 id={`${id}-${era.id}-title`}>{era.label}</h2><p>{era.summary}</p><p className="iqt-date-note">{era.dateNote}</p></div>
      </header>
      <div className="iqt-grid">{entries.filter(entry => entry.eraId === era.id).map(entry => <PresetCard key={entry.presetId} entry={entry} onOpenPreset={onOpenPreset} />)}</div>
      <details className="iqt-era-sources"><summary>Chronology sources · {era.label}</summary><SourceLinks sources={era.sources} /></details>
    </section>)}</div>
    <section className="iqt-gaps" aria-labelledby={`${id}-gaps-title`}><p className="iqt-eyebrow">BEFORE THE EDITABLE COLLECTION</p><h2 id={`${id}-gaps-title`}>Earlier history still needs evidence</h2><p>These leads remain separate from the built presets. This is a bounded source catalogue, not every plate ever issued in Iraq.</p>
      <div>{IRAQ_TIMELINE_GAPS.map(gap => <article key={gap.period}><strong>{gap.period} · {gap.label}</strong><p>{gap.note}</p><a href={gap.source.url} target="_blank" rel="noreferrer">{gap.source.label} ↗</a></article>)}</div>
      <p className="iqt-small">WorldLicensePlates could not be inspected in the source audit because of a certificate error; it is not used as verified evidence.</p>
    </section>
  </section>;
}
