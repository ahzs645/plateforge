import { useEffect, useMemo, useState } from 'react';
import type { Region } from '../core/types';
import { LETTERING_TYPES, isLetteringType } from '../core/lettering';
import { editorsForPage, pageMatches, pageSlice, parseReferenceIndex, parseReferencePage, safePreviewUrl, safeWebUrl,
  type ReferenceImage, type ReferenceIndex, type ReferencePage } from '../library/catalogue';
import { LEEWARD_DATE_SOURCE, LEEWARD_JURISDICTIONS } from '../library/leeward';
import { buildLettering } from '../templates/lettering';
import { SvgScene } from '../templates/SvgScene';
import { BcCoverage } from './BcCoverage';
import './reference-library.css';

interface Props { regions: Region[]; onOpenFormat(regionId: string, formatId: string): void }
type Mode = 'sources' | 'lettering' | 'coverage';
const MODES: readonly Mode[] = ['sources', 'lettering', 'coverage'];
const modeFromHash = (): Mode => MODES.find((m) => location.hash === `#/library/${m}`) ?? 'sources';
const DATA = `${import.meta.env.BASE_URL}data/reference-library/`;
const PAGE_SIZE = 24;
const REVIEW_NOTES: Record<string, string> = {
  'browser-verified-link-only': 'Browser-verified article link; contents not imported.',
  'catalogue-link-only': 'Catalogue link only; artwork stays on the source site.',
  'detail-captured-link-only': 'Detail page reviewed; link only, artwork stays on the source site.',
};
const errorText = (e: unknown) => e instanceof Error ? e.message : 'Unable to load reference metadata.';
async function readJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Reference metadata request failed (${response.status}).`);
  return response.json();
}
function ExternalLink({ url, children }: { url: string; children: React.ReactNode }) {
  return safeWebUrl(url) ? <a href={url} target="_blank" rel="noreferrer">{children}</a> : <span>{children}</span>;
}
function Pager({ page, count, onChange }: { page: number; count: number; onChange(value: number): void }) {
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  return <nav className="reference-pager" aria-label="Reference pagination">
    <button className="btn" disabled={page === 0} onClick={() => onChange(page - 1)}>Previous</button>
    <span>Page {page + 1} of {pages} · {count.toLocaleString()} results</span>
    <button className="btn" disabled={page + 1 >= pages} onClick={() => onChange(page + 1)}>Next</button>
  </nav>;
}
function ImageReference({ image, enabled }: { image: ReferenceImage; enabled: boolean }) {
  const [failed, setFailed] = useState(false);
  const preview = safePreviewUrl(image.thumbnailUrl) ? image.thumbnailUrl : undefined;
  useEffect(() => setFailed(false), [image.thumbnailUrl]);
  return <article className="reference-image-card">
    <div className="reference-image-stage">
      {enabled && preview && !failed
        ? <img src={preview} alt={image.label || 'Source reference image'} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
        : <p>{failed ? 'Preview unavailable. Open the source image instead.' : !preview ? 'External image link — inline preview unavailable.' : 'External previews are off.'}</p>}
    </div>
    <h3>{image.label || 'Unlabelled reference'}</h3>
    <span className="reference-badge">{image.kind === 'layout' ? 'Possible page decoration' : 'Unclassified source image'}</span>
    <ExternalLink url={image.url}>Open original image ↗</ExternalLink>
  </article>;
}

export function ReferenceLibrary({ regions, onOpenFormat }: Props) {
  const [index, setIndex] = useState<ReferenceIndex>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [mode, setMode] = useState<Mode>(modeFromHash);
  useEffect(() => { history.replaceState(null, '', mode === 'sources' ? '#/library' : `#/library/${mode}`); }, [mode]);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('Passenger bases');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState<ReferencePage>();
  const [detailError, setDetailError] = useState('');
  const [imageQuery, setImageQuery] = useState('');
  const [imagePage, setImagePage] = useState(0);
  const [showLayout, setShowLayout] = useState(false);
  const [previews, setPreviews] = useState(false);
  const [fontQuery, setFontQuery] = useState('');
  const [fontCategory, setFontCategory] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    readJson(`${DATA}index.json`, controller.signal).then(parseReferenceIndex).then(setIndex)
      .catch((e) => { if (!controller.signal.aborted) setError(errorText(e)); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    setDetail(undefined); setDetailError(''); setImageQuery(''); setImagePage(0);
    if (!selected) return;
    const controller = new AbortController();
    readJson(`${DATA}pages/${selected}.json`, controller.signal).then((value) => parseReferencePage(value, selected)).then(setDetail)
      .catch((e) => { if (!controller.signal.aborted) setDetailError(errorText(e)); });
    return () => controller.abort();
  }, [selected, retry]);
  const categories = useMemo(() => [...new Set(index?.pages.map((p) => p.category) ?? [])].sort(), [index]);
  const matches = useMemo(() => index?.pages.filter((p) => pageMatches(p, query, source, category, year)) ?? [], [index, query, source, category, year]);
  const images = useMemo(() => detail?.images.filter((i) => (showLayout || i.kind !== 'layout') && `${i.label} ${i.url}`.toLowerCase().includes(imageQuery.trim().toLowerCase())) ?? [], [detail, imageQuery, showLayout]);
  const fontMatches = useMemo(() => LEEWARD_JURISDICTIONS.filter((r) => (!fontCategory || r.category === fontCategory)
    && `${r.name} ${r.id} ${r.group}`.toLowerCase().includes(fontQuery.trim().toLowerCase())), [fontQuery, fontCategory]);
  const linkedEditors = detail ? editorsForPage(detail.url, regions) : [];
  const resetPage = (setter: (value: string) => void, value: string) => { setter(value); setPage(0); };
  const retryButton = <button className="btn" onClick={() => setRetry((n) => n + 1)}>Retry metadata request</button>;

  return <section className="reference-library" aria-label="Plate reference library">
    <header className="reference-header">
      <p className="reference-eyebrow">PLATEFORGE / REFERENCE LIBRARY</p>
      <h1>Plate designs, specimens and lettering</h1>
      <p>Browse the source collections alongside the editable generators. A reference image is not a finished SVG reconstruction.</p>
      {index && <div className="reference-stats" aria-label="Catalogue coverage">
        <span><strong>{index.totals.pages.toLocaleString()}</strong> source-page records</span>
        <span><strong>{index.totals.uniqueImageReferences.toLocaleString()}</strong> unique image URLs</span>
        <span><strong>{LEEWARD_JURISDICTIONS.length}</strong> historical font classifications</span>
        <span><strong>{regions.find((r) => r.id === 'ca-bc')?.formats.length ?? 0}</strong> editable B.C. presets</span>
      </div>}
    </header>
    <nav className="reference-modes" aria-label="Library section">
      <button className="btn" aria-pressed={mode === 'sources'} onClick={() => setMode('sources')}>Source collections</button>
      <button className="btn" aria-pressed={mode === 'lettering'} onClick={() => setMode('lettering')}>Lettering catalogue ({LEEWARD_JURISDICTIONS.length})</button>
      <button className="btn" aria-pressed={mode === 'coverage'} onClick={() => setMode('coverage')}>B.C. coverage &amp; gaps</button>
      <a className="btn" href={`${import.meta.env.BASE_URL}bc-font-comparisons/die-grouping/`}>B.C. die families across plate types ↗</a>
      <a className="btn" href={`${import.meta.env.BASE_URL}bc-font-comparisons/die-grouping/?view=timeline`}>B.C. die and lettering periods ↗</a>
    </nav>
    {mode === 'coverage' ? <BcCoverage builtPresets={regions.find((r) => r.id === 'ca-bc')?.formats.length ?? 0} />
    : mode === 'lettering' ? <>
      <div className="reference-notice"><strong>Historical survey · February 2011.</strong> These are Leeward’s classifications, not verified present-day assignments or exact die fonts. <ExternalLink url={LEEWARD_DATE_SOURCE}>Survey date and introduction ↗</ExternalLink></div>
      <div className="reference-filters">
        <label>Find a jurisdiction<input aria-label="Find a lettering jurisdiction" value={fontQuery} onChange={(e) => setFontQuery(e.target.value)} placeholder="British Columbia, California, Mexico…" /></label>
        <label>Construction<select aria-label="Filter lettering category" value={fontCategory} onChange={(e) => setFontCategory(e.target.value)}><option value="">All categories</option>{LETTERING_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}<option value="serif">Serif exception</option></select></label>
      </div>
      <p role="status">{fontMatches.length} of {LEEWARD_JURISDICTIONS.length} survey entries</p>
      <div className="reference-grid">
        {fontMatches.map((ref) => {
          const region = regions.find((r) => r.id === ref.regionId);
          return <article key={ref.id} className="reference-font-card" data-jurisdiction={ref.id}>
            <span className="reference-badge">{ref.group} · {ref.sourceDate}</span><h2>{ref.name}</h2>
            <div className="reference-font-specimen">
              {isLetteringType(ref.category) ? <svg viewBox="0 0 320 70" aria-label={`${ref.category} category illustration`}><SvgScene node={buildLettering({ text: 'B8G6R9', type: ref.category, centerX: 160, baseline: 64, height: 60, maxWidth: 300, ink: 'currentColor', role: 'category-specimen' })} /></svg>
                : <span className="reference-serif">B8G6R9</span>}
            </div>
            <p><strong>{LETTERING_TYPES.find((t) => t.id === ref.category)?.label ?? 'Serif exception'}</strong> · illustrative specimen, not the jurisdiction’s exact dies.</p>
            {ref.note && <p>{ref.note}</p>}
            <ExternalLink url={ref.source}>Read the classification ↗</ExternalLink>
            {region ? <button className="btn" onClick={() => onOpenFormat(region.id, region.formats[0].id)}>Open existing region editor</button> : <span className="reference-muted">Reference only · no matching region renderer yet</span>}
          </article>;
        })}
      </div>
      <p className="reference-muted">Opening an existing editor keeps its own period and defaults. The 2011 survey is not automatically applied to historical B.C. years or current U.S. designs.</p>
    </> : <>
      {error && <div role="alert" className="reference-notice">{error} {retryButton}</div>}
      {!index && !error && <p role="status">Loading the reference index…</p>}
      {index && <>
        <details className="reference-coverage">
          <summary>Coverage, provenance and unavailable links</summary>
          <p>Snapshot: {index.importedAt.slice(0, 10)}. Counts describe URLs, not unique plate designs. Images may also show documents or other supporting material. External galleries, unlinked pages and PDF contents are not included in the crawl.</p>
          {index.reports.map((r) => <section key={r.source}><h3>{r.source} · {r.complete ? 'Configured crawl finished' : 'Partial / gaps recorded'}</h3><p>{r.indexed ?? 0} indexed pages{r.manualReferences ? `; ${r.manualReferences} manually verified article links` : ''}. {r.scope}</p>
            {r.failures.map((f) => <p key={f.url}><ExternalLink url={f.url}>{f.url}</ExternalLink> — {f.reason}</p>)}
            {r.remaining.length > 0 && <p>{r.remaining.length} discovered pages remain unvisited.</p>}
          </section>)}
          <a href={`${DATA}coverage-report.json`} target="_blank" rel="noreferrer">Open machine-readable coverage report</a>
        </details>
        {!selected ? <>
          <div className="reference-filters">
            <label>Search source pages<input aria-label="Search source pages" value={query} onChange={(e) => resetPage(setQuery, e.target.value)} placeholder="Passenger, motorcycle, dealer, 1953…" /></label>
            <label>Source<select aria-label="Filter reference source" value={source} onChange={(e) => { resetPage(setSource, e.target.value); setCategory(''); }}><option value="">All sources</option>{index.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label>Collection<select aria-label="Filter reference collection" value={category} onChange={(e) => resetPage(setCategory, e.target.value)}><option value="">All source material</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Page period<input aria-label="Filter page period" inputMode="numeric" maxLength={4} value={year} onChange={(e) => resetPage(setYear, e.target.value)} placeholder="e.g. 1975" /></label>
          </div>
          <p className="reference-muted">Page-period filtering uses dates in page titles and URLs, not verified dates for each photograph. Collection labels are inferred from source-page names.</p>
          <Pager page={page} count={matches.length} onChange={setPage} />
          <div className="reference-grid">
            {pageSlice(matches, page).map((p) => <article className="reference-page-card" key={p.id}>
              <span className="reference-badge">{p.source} · {p.category}</span><h2>{p.title}</h2>
              <p>{p.imageCount.toLocaleString()} image references · {p.documentCount} document links</p>
              <p className="reference-muted">{REVIEW_NOTES[p.reviewStatus] ?? 'Indexed reference material; individual images not yet curated.'}</p>
              <button className="btn primary" onClick={() => setSelected(p.id)}>Browse references</button>
              <ExternalLink url={p.url}>Source page ↗</ExternalLink>
            </article>)}
          </div>
          {!matches.length && <p role="status">No source pages match these filters. Clear the page period or select all collections.</p>}
          <Pager page={page} count={matches.length} onChange={setPage} />
        </> : <>
          <button className="btn" onClick={() => setSelected('')}>← Back to collections</button>
          {detailError && <div className="reference-notice" role="alert">{detailError} {retryButton}</div>}
          {!detail && !detailError && <p role="status">Loading this collection’s metadata…</p>}
          {detail && <div className="reference-detail">
            <header><span className="reference-badge">{detail.source} · {detail.category}</span><h2>{detail.title}</h2><ExternalLink url={detail.url}>Read the full source page ↗</ExternalLink></header>
            <p className="reference-muted">{index.sites.find((s) => s.id === detail.source)?.credit}</p>
            {linkedEditors.length > 0 && <section className="reference-editor-links"><h3>Supported base reconstructions using this source</h3><p>These are approximate editable presets, not reproductions of every photograph below.</p><div>{linkedEditors.map((f) => <button className="btn" key={`${f.regionId}/${f.formatId}`} onClick={() => onOpenFormat(f.regionId, f.formatId)}>{f.label}</button>)}</div></section>}
            <div className="reference-filters"><label>Search image labels or filenames<input aria-label="Search collection images" value={imageQuery} onChange={(e) => { setImageQuery(e.target.value); setImagePage(0); }} /></label>
              <label className="reference-checkbox"><input type="checkbox" checked={showLayout} onChange={(e) => { setShowLayout(e.target.checked); setImagePage(0); }} />Include possible page decorations</label>
              <label className="reference-checkbox"><input type="checkbox" checked={previews} onChange={(e) => setPreviews(e.target.checked)} />Show externally hosted images</label></div>
            <p className="reference-muted">Previews contact the original site only after you enable them, and only for the visible page. Their availability and image contents have not all been checked. No photos are mirrored in PlateForge.</p>
            <Pager page={imagePage} count={images.length} onChange={setImagePage} />
            <div className="reference-grid">{pageSlice(images, imagePage).map((image) => <ImageReference key={image.url} image={image} enabled={previews} />)}</div>
            {!images.length && <p role="status">No matching imported image references. The complete article remains available at the source link.</p>}
            <Pager page={imagePage} count={images.length} onChange={setImagePage} />
            {[['Linked specimen galleries (not imported)', detail.galleries], ['Source documents (contents not imported)', detail.documents]].map(([heading, links]) => <section key={String(heading)}><h3>{String(heading)}</h3>{(links as ReferencePage['documents']).map((l) => <p key={l.url}><ExternalLink url={l.url}>{l.label || l.url}</ExternalLink></p>)}</section>)}
          </div>}
        </>}
      </>}
    </>}
  </section>;
}
