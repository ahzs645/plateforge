import { useId, useMemo, useState } from 'react';
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_CLASSES, IRAN_CUSTOM_SOURCE_COVERAGE, iranCustomizerState, renderIranCustom } from '../templates/iran-custom-scene';
import type { IranCustomPreset } from '../templates/iran-custom-types';
import './iran-timeline.css';

export interface IranTimelineFilters { query: string; era: string; vehicleClass: string; confidence: string }
export const IRAN_TIMELINE_DEFAULT_FILTERS: IranTimelineFilters = { query: '', era: 'all', vehicleClass: 'all', confidence: 'all' };
export const IRAN_TIMELINE_CONFIDENCE_LABELS = { observed: 'Observed specimen', illustrated: 'Illustrated format', provisional: 'Provisional reconstruction', disputed: 'Disputed evidence' };
export const IRAN_TIMELINE_ENTRIES = [...IRAN_CUSTOM_PRESETS].sort((a, b) => a.sortYear - b.sortYear || a.label.localeCompare(b.label));
/** Era labels come from the researched catalogue; no introduction date is inferred from a photo. */
export const IRAN_TIMELINE_ERAS = [...new Set(IRAN_TIMELINE_ENTRIES.map(entry => entry.family))].map(family => ({ id: family, label: family, sortYear: Math.min(...IRAN_TIMELINE_ENTRIES.filter(entry => entry.family === family).map(entry => entry.sortYear)) }));
export const IRAN_TIMELINE_COUNTS = { presets: IRAN_CUSTOM_PRESETS.length, sourceArtworks: IRAN_CUSTOM_SOURCE_COVERAGE.length, coverageBarriers: IRAN_CUSTOM_SOURCE_COVERAGE.filter(source => !source.presetId).length };
export function filterIranTimeline(input: Partial<IranTimelineFilters> = {}): IranCustomPreset[] {
  const filters = { ...IRAN_TIMELINE_DEFAULT_FILTERS, ...input };
  const query = filters.query.trim().toLocaleLowerCase();
  return IRAN_TIMELINE_ENTRIES.filter(entry => (filters.era === 'all' || entry.family === filters.era)
    && (filters.vehicleClass === 'all' || entry.defaults.vehicleClass === filters.vehicleClass)
    && (filters.confidence === 'all' || entry.confidence === filters.confidence)
    && (!query || `${entry.label} ${entry.family} ${entry.period} ${entry.evidence} ${entry.dateNote} ${entry.defaults.vehicleClass} ${entry.notes.join(' ')} ${entry.sources.map(source => source.label).join(' ')}`.toLocaleLowerCase().includes(query)));
}
export function namespaceIranSvg(svg: string, prefix: string): string {
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  for (const id of ids) {
    svg = svg.replaceAll(`id="${id}"`, `id="${prefix}-${id}"`).replaceAll(`url(#${id})`, `url(#${prefix}-${id})`).replaceAll(`href="#${id}"`, `href="#${prefix}-${id}"`);
  }
  return svg;
}
export interface IranTimelineProps { onOpenPreset(presetId: string): void; initialFilters?: Partial<IranTimelineFilters> }
function PresetCard({ preset, onOpenPreset }: { preset: IranCustomPreset; onOpenPreset(presetId: string): void }) {
  const id = useId();
  const scene = useMemo(() => renderIranCustom(iranCustomizerState(preset.id)), [preset.id]);
  const svg = namespaceIranSvg(scene.svg, `int-${id}`);
  return <article className="int-card" aria-labelledby={`${id}-title`} data-preset-id={preset.id}>
    <div className="int-preview" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
    <div className="int-card-body"><p className="int-region">{IRAN_CUSTOM_CLASSES.find(item => item.id === preset.defaults.vehicleClass)?.label ?? preset.defaults.vehicleClass}</p><h3 id={`${id}-title`}>{preset.label}</h3><p className="int-period">{preset.period}</p><span className={`int-badge int-evidence-${preset.confidence}`}>{IRAN_TIMELINE_CONFIDENCE_LABELS[preset.confidence]}</span><p className="int-evidence-note">{preset.evidence}</p><p className="int-date-note"><strong>Dating:</strong> {preset.dateNote}</p>
      <details className="int-card-sources"><summary>Sources &amp; limits · {preset.sourceArtworks.length} linked artworks</summary><ul className="int-sources">{preset.sources.map(source => <li key={source.url + source.label}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}</ul>{preset.notes.map((note, index) => <p className="int-small" key={index}>{note}</p>)}<p className="int-small">This thumbnail uses the editable vector scene and its default font policy. Source lettering, licensed font candidates and fallback are identified in the editor.</p>{scene.errors.length > 0 && <p className="int-validation">{scene.errors.length} unresolved {scene.errors.length === 1 ? 'issue' : 'issues'} currently block export. Open the editor for details.</p>}{scene.warnings.length > 0 && <p className="int-small">{scene.warnings.length} source / lettering notices. Review them before exporting.</p>}</details>
      <button type="button" className="int-open" onClick={() => onOpenPreset(preset.id)} aria-label={`Open ${preset.label} in editor`}>Open in editor <span aria-hidden="true">↗</span></button>
    </div>
  </article>;
}
/** Every implemented preset is derived from the editor catalogue; rejected and unbuilt sources remain separate. */
export function IranTimeline({ onOpenPreset, initialFilters }: IranTimelineProps) {
  const [filters, setFilters] = useState<IranTimelineFilters>(() => ({ ...IRAN_TIMELINE_DEFAULT_FILTERS, ...initialFilters }));
  const id = useId();
  const entries = useMemo(() => filterIranTimeline(filters), [filters]);
  const eras = IRAN_TIMELINE_ERAS.filter(era => entries.some(entry => entry.family === era.id));
  const classIds = [...new Set(IRAN_TIMELINE_ENTRIES.map(entry => entry.defaults.vehicleClass))];
  const active = Object.entries(filters).some(([key, value]) => value !== IRAN_TIMELINE_DEFAULT_FILTERS[key as keyof IranTimelineFilters]);
  const change = (key: keyof IranTimelineFilters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  return <section className="iran-timeline" aria-labelledby={`${id}-heading`}>
    <header className="int-heading"><p className="int-eyebrow">PLATEFORGE · IRAN REFERENCE ATLAS</p><h1 id={`${id}-heading`}>A history in plates.</h1><p className="int-intro">From city-name specimens to national formats and free-zone arrangements. Explore the sources, see where dating is uncertain, and open each implemented design in the editor.</p><dl className="int-counts"><div><dt>Editable presets</dt><dd>{IRAN_TIMELINE_COUNTS.presets}</dd></div><div><dt>Mapped source references</dt><dd>{IRAN_TIMELINE_COUNTS.sourceArtworks}</dd></div><div><dt>Unbuilt / rejected sources</dt><dd>{IRAN_TIMELINE_COUNTS.coverageBarriers}</dd></div></dl><p className="int-small">These are separate inventories. One source can support multiple designs; a source entry does not establish that a format is editable or historically genuine.</p></header>
    <aside className="int-caution" aria-label="Chronology and evidence limits"><strong>Observation dates are not introduction dates.</strong> Gregorian chronology and printed Solar Hijri (SH) years are distinguished in the source notes. Provisional and disputed arrangements remain labeled; the catalogue does not claim every plate ever issued in Iran or a complete set of manufacturing fonts.</aside>
    <section className="int-filter-panel" aria-labelledby={`${id}-filter-title`}><div className="int-filter-heading"><h2 id={`${id}-filter-title`}>Explore the collection</h2><button type="button" className="int-reset" disabled={!active} onClick={() => setFilters({ ...IRAN_TIMELINE_DEFAULT_FILTERS })}>Clear filters</button></div><div className="int-filters">
      <label><span>Era / family</span><select aria-label="Era / family" value={filters.era} onChange={event => change('era', event.target.value)}><option value="all">All eras and families</option>{IRAN_TIMELINE_ERAS.map(era => <option key={era.id} value={era.id}>{era.label}</option>)}</select></label>
      <label><span>Vehicle class</span><select aria-label="Vehicle class" value={filters.vehicleClass} onChange={event => change('vehicleClass', event.target.value)}><option value="all">All classes</option>{classIds.map(classId => <option key={classId} value={classId}>{IRAN_CUSTOM_CLASSES.find(item => item.id === classId)?.label ?? classId}</option>)}</select></label>
      <label><span>Evidence confidence</span><select aria-label="Evidence confidence" value={filters.confidence} onChange={event => change('confidence', event.target.value)}><option value="all">All evidence levels</option>{Object.entries(IRAN_TIMELINE_CONFIDENCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="int-search"><span>Search designs</span><input aria-label="Search designs" type="search" placeholder="Try Tehran, diplomatic or a year" value={filters.query} onChange={event => change('query', event.target.value)} /></label>
    </div><p className="int-results" role="status" aria-live="polite">{entries.length} of {IRAN_TIMELINE_COUNTS.presets} presets · {eras.length} of {IRAN_TIMELINE_ERAS.length} families</p></section>
    {eras.length > 0 && <nav className="int-era-nav" aria-label="Jump to era">{eras.map((era, index) => <a key={era.id} href={`#${id}-era-${index}`} onClick={event => { event.preventDefault(); document.getElementById(`${id}-era-${index}`)?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }}>{era.label}</a>)}</nav>}
    {!entries.length && <div className="int-empty"><h2>No matching presets</h2><p>Try a broader era, class or evidence filter. Coverage barriers below remain visible.</p><button type="button" onClick={() => setFilters({ ...IRAN_TIMELINE_DEFAULT_FILTERS })}>Show all {IRAN_TIMELINE_COUNTS.presets} presets</button></div>}
    <div className="int-era-list">{eras.map((era, index) => <section className="int-era" id={`${id}-era-${index}`} key={era.id} aria-labelledby={`${id}-era-${index}-title`}><header className="int-era-heading"><div><p className="int-eyebrow">RESEARCHED FAMILY</p><h2 id={`${id}-era-${index}-title`}>{era.label}</h2><p className="int-date-note">Dates and confidence are stated for each design. Family ordering is an aid to browsing, not an independently verified rollout chronology.</p></div></header><div className="int-grid">{entries.filter(entry => entry.family === era.id).map(preset => <PresetCard key={preset.id} preset={preset} onOpenPreset={onOpenPreset} />)}</div></section>)}</div>
    <section className="int-gaps" aria-labelledby={`${id}-gaps-title`}><p className="int-eyebrow">SOURCE COVERAGE &amp; BARRIERS</p><h2 id={`${id}-gaps-title`}>What the sources do and don’t support</h2><p>Every audited source entry stays visible here, including unbuilt arrangements and rejected evidence. Those entries are not silently turned into real plate designs.</p><div>{IRAN_CUSTOM_SOURCE_COVERAGE.map(source => <article key={source.id} data-source-id={source.id} data-coverage-barrier={source.presetId ? undefined : 'true'}><strong>{source.label}</strong><span className="int-badge">{source.status}</span><p>{source.note}</p><div className="int-coverage-actions">{source.sourceUrl && <a href={source.sourceUrl} target="_blank" rel="noreferrer">Inspect source ↗</a>}{source.presetId && <button type="button" onClick={() => onOpenPreset(source.presetId!)}>Open linked design</button>}</div></article>)}</div></section>
  </section>;
}
