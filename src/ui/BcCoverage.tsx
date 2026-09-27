import { useEffect, useMemo, useState } from 'react';
import { safeWebUrl } from '../library/catalogue';
import { coverageMatches, parseCoverageManifest, STATUS_LABELS, type CoverageManifest, type ImplementationStatus } from '../library/coverage';

const URL_ = `${import.meta.env.BASE_URL}data/reference-library/bc-coverage.json`;
const host = (url: string) => { try { return new URL(url).pathname.replace(/^\//, '') || new URL(url).hostname; } catch { return url; } };
function Link({ url, children }: { url: string; children: React.ReactNode }) {
  return safeWebUrl(url) ? <a href={url} target="_blank" rel="noreferrer">{children}</a> : <span>{children}</span>;
}

/** The B.C. family inventory: what BCpl8s documents vs. what PlateForge can render. */
export function BcCoverage({ builtPresets }: { builtPresets: number }) {
  const [manifest, setManifest] = useState<CoverageManifest>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    fetch(URL_, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(`Coverage request failed (${r.status}).`); return r.json(); })
      .then(parseCoverageManifest).then(setManifest)
      .catch((e) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load the coverage audit.'); });
    return () => controller.abort();
  }, [retry]);
  const groups = useMemo(() => [...new Set(manifest?.records.map((r) => r.group))].sort(), [manifest]);
  const matches = useMemo(() => manifest?.records.filter((r) => coverageMatches(r, query, group, status)) ?? [], [manifest, query, group, status]);
  if (error) return <div role="alert" className="reference-notice">{error} <button className="btn" onClick={() => setRetry((n) => n + 1)}>Retry</button></div>;
  if (!manifest) return <p role="status">Loading the B.C. coverage audit…</p>;
  const tally = (s: ImplementationStatus) => manifest.records.filter((r) => r.implementationStatus === s).length;
  const open = manifest.repositoryEvidence.filter((e) => !e.resolved);
  const serials = manifest.officialSerialConfigurationReference;

  return <div className="coverage">
    <div className="reference-notice">
      <strong>Family-level audit of BCpl8s, reviewed {manifest.reviewDate}.</strong> {manifest.records.length} research topics — not {manifest.records.length} distinct plate designs, and not a verification of every photograph. Source links open BCpl8s; nothing is mirrored.
      <details><summary>Limitations</summary><ul>{manifest.limitations.map((l) => <li key={l}>{l}</li>)}</ul></details>
    </div>
    <div className="reference-stats" aria-label="Coverage summary">
      <span><strong>{builtPresets}</strong> editable B.C. designs</span>
      <span><strong>{tally('implemented') + tally('partial')}</strong> topics built or partly built</span>
      <span><strong>{tally('missing-renderer')}</strong> topics with no renderer yet</span>
      <span><strong>{tally('research-not-template') + tally('not-a-plate')}</strong> research or non-plate topics</span>
    </div>
    {!!manifest.repositoryUpdates?.length && <section className="coverage-block"><h2>Fixed since the review</h2>
      <ul className="coverage-list">{manifest.repositoryUpdates.map((u) => <li key={u.id}>{u.summary}</li>)}</ul></section>}

    <section className="coverage-block">
      <h2>Why the lettering still looks unlike the sources</h2>
      <ul className="coverage-list">{open.map((e) => <li key={e.id}><strong>{e.title}.</strong> {e.finding}</li>)}</ul>
      <h3>Proposed die profiles</h3>
      <p className="reference-muted">Reconstruction groups to draw from straight-on original specimens. None are drawn yet; boundaries need glyph review.</p>
      <div className="reference-grid">{manifest.proposedDieProfiles.map((p) => <article key={p.id} className="reference-page-card">
        <span className="reference-badge">{p.status.replace(/-/g, ' ')}</span><h2>{p.label}</h2>
        <p className="reference-muted">{p.scope}</p><p>{p.task}</p>
        <Link url={p.sourceUrl}>Reference specimens ↗</Link>
      </article>)}</div>
    </section>

    <section className="coverage-block">
      <h2>Announced 2025 serial configurations</h2>
      <p className="reference-muted">ICBC bulletin, {serials.publicationDate}. {serials.note} {serials.notation}</p>
      <div className="coverage-table-wrap"><table className="coverage-table">
        <thead><tr><th>Family</th><th>Pattern</th><th>Example</th></tr></thead>
        <tbody>{serials.configurations.map((c) => <tr key={c.family}><td>{c.family}</td><td className="mono">{c.pattern}</td><td className="mono">{c.example}</td></tr>)}</tbody>
      </table></div>
      <Link url={serials.sourceUrl}>ICBC bulletin (PDF) ↗</Link>
    </section>

    <section className="coverage-block">
      <h2>Plate families and topics</h2>
      <div className="reference-filters">
        <label>Find a family<input aria-label="Search B.C. plate families" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Parks, Olympics, motorcycle, consular…" /></label>
        <label>Collection<select aria-label="Filter coverage collection" value={group} onChange={(e) => setGroup(e.target.value)}><option value="">All collections</option>{groups.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>Status<select aria-label="Filter coverage status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Any status</option>{Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      </div>
      <p role="status">{matches.length} of {manifest.records.length} topics</p>
      <div className="reference-grid">{matches.map((r) => <article key={r.id} className="reference-page-card coverage-card" data-status={r.implementationStatus}>
        <div className="coverage-badges"><span className="reference-badge">{r.group}</span><span className="reference-badge coverage-status">{STATUS_LABELS[r.implementationStatus]}</span></div>
        <h2>{r.name}</h2>
        <ul className="coverage-list">{r.distinctions.map((d) => <li key={d}>{d}</li>)}</ul>
        {r.formats?.length ? <p className="coverage-formats"><strong>In PlateForge:</strong> {r.formats.slice(0, 6).map((id, i) => <span key={id}>{i ? ', ' : ''}{id.startsWith('(') ? id : <a href={`#/ca-bc/${id}`}>{id}</a>}</span>)}{r.formats.length > 6 ? ` and ${r.formats.length - 6} more` : ''}</p>
          : <p><strong>Next:</strong> {r.nextAction}</p>}
        {r.caution && <p className="reference-muted"><strong>Caution:</strong> {r.caution}</p>}
        <div className="coverage-links"><Link url={r.sourceUrl}>BCpl8s page ↗</Link>{r.additionalSources.map((u) => <Link key={u} url={u}>{host(u)} ↗</Link>)}</div>
      </article>)}</div>
      {!matches.length && <p role="status">No topics match these filters.</p>}
    </section>
  </div>;
}
