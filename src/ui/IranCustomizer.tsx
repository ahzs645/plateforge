import { useMemo, useReducer, useRef, useState, type Dispatch } from 'react';
import { IRAN_FONT_PROFILES } from '../templates/iran-custom-fonts';
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_CLASSES, IRAN_CUSTOM_CITIES, IRAN_CUSTOM_ZONES, IRAN_CUSTOM_SOURCE_COVERAGE, applyIranClass, iranCustomizerState, renderIranCustom } from '../templates/iran-custom-scene';
import { asciiDigits, normalizeLetter } from '../regions/asia/plate-script';
import { generateIranNumber, iranNumberFormat, IRAN_NUMBER_BOUNDARY } from '../templates/iran-number-generation';
import type { IranCustomState, IranCustomResult } from '../templates/iran-custom-types';
import { IranFontCoverage } from './IranFontCoverage';
import { iranActiveFields, iranAvailableFontProfiles } from '../templates/iran-region-bridge';
export { iranActiveFields, iranAvailableFontProfiles };
import { download, fileSafe, svgToPngBlob } from './exporting';
import './iran-customizer.css';

const policyLabels = { strict: 'Strict selected-profile coverage', fallback: 'Fallback explicitly enabled' };
const provenanceLabels = { observed: 'Observed source forms', inferred: 'Inferred numeral completion', candidate: 'Typography candidate', fallback: 'Fallback outlines', unsupported: 'Unsupported' };
const profiles = Object.values(IRAN_FONT_PROFILES);
const families = [...new Set(IRAN_CUSTOM_PRESETS.map(preset => preset.family))];

export interface IranEditorSession { current: IranCustomState; saved: Record<string, IranCustomState> }
export type IranEditorAction =
  | { type: 'edit'; patch: Partial<Omit<IranCustomState, 'presetId'>> }
  | { type: 'select'; presetId: string }
  | { type: 'class'; classId: string }
  | { type: 'generate'; seed: string | number }
  | { type: 'reset' };
export function createIranEditorSession(presetId = IRAN_CUSTOM_PRESETS[0].id): IranEditorSession {
  return { current: iranCustomizerState(presetId), saved: {} };
}
/** One immutable session spans preset selections and history/editor navigation. */
export function iranEditorReducer(session: IranEditorSession, action: IranEditorAction): IranEditorSession {
  if (action.type === 'edit') return { ...session, current: { ...session.current, ...action.patch } };
  if (action.type === 'generate') return { ...session, current: generateIranNumber(session.current, action.seed) };
  if (action.type === 'class') return { ...session, current: applyIranClass(session.current, action.classId) };
  if (action.type === 'select') {
    if (action.presetId === session.current.presetId || !IRAN_CUSTOM_PRESETS.some(preset => preset.id === action.presetId)) return session;
    return { current: session.saved[action.presetId] ?? iranCustomizerState(action.presetId), saved: { ...session.saved, [session.current.presetId]: session.current } };
  }
  const saved = { ...session.saved };
  delete saved[session.current.presetId];
  return { current: iranCustomizerState(session.current.presetId), saved };
}
export function iranAvailableClasses(state: IranCustomState) {
  const preset = IRAN_CUSTOM_PRESETS.find(item => item.id === state.presetId) ?? IRAN_CUSTOM_PRESETS[0];
  const nationalClasses = new Set(IRAN_CUSTOM_PRESETS.filter(item => item.kind === 'national').map(item => item.defaults.vehicleClass));
  return IRAN_CUSTOM_CLASSES.filter(item => preset.kind !== 'national' || nationalClasses.has(item.id));
}
export interface IranExportSnapshot { svg: string; width: number; height: number; filename: string; warnings: string[]; errors: string[] }
export function captureIranExport(state: IranCustomState, scene: IranCustomResult): IranExportSnapshot {
  return { svg: scene.svg, width: scene.width, height: scene.height, filename: `iran-${fileSafe(state.presetId)}-${fileSafe(state.serial)}`, warnings: [...scene.warnings], errors: [...scene.errors] };
}
/** Lock and copy before awaiting rasterization: a rapid second click or later edit cannot alter the download. */
export function createIranExporter(save = download, encode = svgToPngBlob) {
  let busy = false;
  return {
    isBusy: () => busy,
    async run(kind: 'svg' | 'png', input: IranExportSnapshot): Promise<{ status: 'blocked' | 'busy' | 'saved' | 'failed'; message: string }> {
      if (busy) return { status: 'busy', message: 'An export is already being prepared.' };
      if (input.errors.length || !input.svg) return { status: 'blocked', message: 'Export is blocked until the errors below are resolved.' };
      const snapshot = { ...input, warnings: [...input.warnings], errors: [...input.errors] };
      busy = true;
      try {
        const blob = kind === 'svg' ? new Blob([snapshot.svg], { type: 'image/svg+xml' }) : await encode(snapshot.svg, snapshot.width, snapshot.height, 4);
        save(blob, `${snapshot.filename}.${kind}`);
        return { status: 'saved', message: `${kind.toUpperCase()} export ready: ${snapshot.filename}.${kind}${snapshot.warnings.length ? '. Review the displayed source / lettering notices' : ''}.` };
      } catch (error) {
        return { status: 'failed', message: `Export failed: ${error instanceof Error ? error.message : 'unknown error'}. Try again or use SVG.` };
      } finally { busy = false; }
    },
  };
}
export interface IranCustomizerProps {
  initialState?: IranCustomState;
  session?: IranEditorSession;
  dispatch?: Dispatch<IranEditorAction>;
  onSelectPreset?(presetId: string): void;
}
/** The website and standalone offline file share this component and the same scene/font modules. */
export function IranCustomizer({ initialState, session: controlledSession, dispatch: controlledDispatch, onSelectPreset }: IranCustomizerProps = {}) {
  const [localSession, localDispatch] = useReducer(iranEditorReducer, undefined, () => initialState ? { current: { ...initialState }, saved: {} } : createIranEditorSession());
  const session = controlledSession ?? localSession;
  const dispatch = controlledDispatch ?? localDispatch;
  const state = session.current;
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const exporter = useRef(createIranExporter());
  const preset = IRAN_CUSTOM_PRESETS.find(item => item.id === state.presetId) ?? IRAN_CUSTOM_PRESETS[0];
  const scene = useMemo(() => renderIranCustom(state), [state]);
  const profile = profiles.find(item => item.id === state.fontProfile) ?? profiles[0];
  const activeFields = iranActiveFields(state);
  const numberFormat = iranNumberFormat(state);
  const codeOptions = numberFormat.numeric.find(rule => rule.field === 'code')?.values;
  const hasField = (key: keyof IranCustomState) => activeFields.has(key);
  const filteredPresets = useMemo(() => IRAN_CUSTOM_PRESETS.filter(item => `${item.label} ${item.family} ${item.period} ${item.evidence}`.toLowerCase().includes(search.toLowerCase().trim())), [search]);
  const changed = JSON.stringify(state) !== JSON.stringify(iranCustomizerState(preset.id));
  const canExport = scene.errors.length === 0 && !!scene.svg;
  const warnings = [...new Set(scene.warnings)];
  const errors = [...new Set(scene.errors)];
  function change<K extends keyof IranCustomState>(key: K, value: IranCustomState[K]) { dispatch({ type: 'edit', patch: { [key]: value } }); setMessage(''); }
  function choosePreset(id: string) {
    if (id === state.presetId) return;
    dispatch({ type: 'select', presetId: id }); onSelectPreset?.(id); setMessage('');
  }
  function showPreset(id: string) {
    choosePreset(id);
    previewRef.current?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function generateNumber() {
    dispatch({ type: 'generate', seed: `${Date.now()}-${Math.random()}` });
    setMessage('Generated a format-valid example. Valid codes, dates and mission IDs are preserved; issuance is not verified.');
  }
  async function exportScene(kind: 'svg' | 'png') {
    if (exporter.current.isBusy()) return;
    const operation = exporter.current.run(kind, captureIranExport(state, scene));
    setExporting(exporter.current.isBusy()); setMessage('');
    const result = await operation;
    setMessage(result.message); setExporting(exporter.current.isBusy());
  }
  const textField = (key: 'serial' | 'prefix' | 'letter' | 'code' | 'year' | 'expiry', label: string, maxLength = 20) => hasField(key) && <label className="inc-field" key={key}><span>{label}</span><input aria-label={label} dir={key === 'letter' ? 'auto' : 'ltr'} autoComplete="off" spellCheck={false} maxLength={maxLength} value={state[key]} onChange={event => change(key, event.target.value)} /></label>;
  return <div className="iran-customizer">
    <header className="inc-heading"><div><p className="inc-eyebrow">PLATEFORGE · IRAN WORKSHOP</p><h1>Iranian plates. Made editable.</h1><p className="inc-intro">Explore historical and modern arrangements, then rebuild a flat plate with vector lettering, live controls and visible evidence limits.</p></div><span className="inc-count"><strong>{IRAN_CUSTOM_PRESETS.length}</strong> editable presets</span></header>
    <div className="inc-workbench">
      <section className="inc-canvas-column" aria-label="Live Iran plate preview">
        <div className="inc-preview-shell"><div className="inc-preview-top"><span className="inc-eyebrow">LIVE VECTOR PREVIEW</span><span className="inc-badge">{changed ? 'Customized' : 'Preset defaults'}</span></div><div className="inc-preview" ref={previewRef} data-testid="iran-preview" dangerouslySetInnerHTML={{ __html: scene.svg }} /><div className="inc-preview-bottom"><span>{scene.width} × {scene.height} drawing units</span><span>Flat vector geometry · no photograph layer</span></div></div>
        <div className="inc-export-row"><div><h2>{preset.label}</h2><p>{preset.family} · {preset.period}</p></div><div className="inc-actions"><button type="button" onClick={() => exportScene('svg')} disabled={!canExport || exporting}>Save SVG</button><button type="button" className="inc-primary" onClick={() => exportScene('png')} disabled={!canExport || exporting}>{exporting ? 'Preparing…' : 'Save PNG · 4×'}</button></div></div>
        <div className="inc-message" role="status" aria-live="polite">{message || (!canExport ? 'Export is blocked until the errors below are resolved.' : 'SVG and PNG use this exact live scene. No remote fonts are needed.')}</div>
        <section className="inc-coverage" aria-labelledby="inc-coverage-title"><div className="inc-section-heading"><h2 id="inc-coverage-title">Source &amp; font coverage</h2><span className={`inc-policy inc-policy-${state.missingPolicy}`}>{policyLabels[state.missingPolicy]}</span></div>
          <p className="inc-small"><strong>Actual lettering roles:</strong> {(scene.letteringUsage ?? []).some(item => item.provenance.includes('inferred')) && 'This plate includes stylistically inferred numerals that are not observed in the cited specimen. '} {(scene.letteringUsage ?? []).some(item => item.provenance.includes('candidate')) ? ((scene.letteringUsage ?? []).some(item => item.provenance.includes('observed')) ? 'This plate combines source-guided masters with licensed candidate lettering.' : 'This plate uses licensed candidate lettering.') : 'The listed lettering roles use source-guided masters and their explicitly labelled completions.'} {(scene.letteringUsage ?? []).some(item => item.provenance.includes('fallback')) && ' Explicit fallback substitutions are also present.'} Source-guided does not mean a certified manufacturing die.</p>
          <details className="inc-role-use"><summary>Which lettering is observed, inferred, candidate or fallback?</summary><ul>{[...new Map((scene.letteringUsage ?? []).map(item => [item.role + item.profileId, item])).values()].map(item => <li key={item.role + item.profileId}><strong>{item.role.replaceAll('-', ' ')}</strong> · {item.provenance.map(value => provenanceLabels[value]).join(' + ')} · {item.profileLabel}</li>)}</ul></details>
          <p className="inc-evidence">{preset.evidence}</p><p className="inc-small"><strong>Dating:</strong> {preset.dateNote}</p><div className="inc-profile-summary"><strong>{profile.label}</strong><span className="inc-badge">{provenanceLabels[profile.provenance]}</span></div>
          <IranFontCoverage profile={profile} />
          <ul className="inc-notes">{[...profile.notes, ...preset.notes].map((note, index) => <li key={index}>{note}</li>)}</ul>
          <div className="inc-validation" aria-live="polite" aria-atomic="true">{errors.length > 0 && <div className="inc-error"><h3>{errors.length} {errors.length === 1 ? 'issue blocks' : 'issues block'} export</h3><ul>{errors.map((error, index) => <li key={index}>{error}</li>)}</ul><p>Choose covered content or a suitable font profile. Missing-outline substitutions require explicit fallback; structural errors still block export.</p></div>}{warnings.length > 0 && <div className="inc-warning"><h3>{warnings.length} source / lettering {warnings.length === 1 ? 'notice' : 'notices'}</h3><ul>{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}{!errors.length && !warnings.length && <p className="inc-success">No missing outlines reported for the current scene.</p>}</div>
          <p className="inc-small inc-rights"><strong>Use &amp; provenance:</strong> {profile.rights}{profile.sourceUrl && <> <a href={profile.sourceUrl} target="_blank" rel="noreferrer">Font-profile source ↗</a></>}</p><ul className="inc-source-links">{preset.sources.map(source => <li key={source.url + source.label}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}</ul>
          <p className="inc-small inc-disclaimer">This is a source-bounded reconstruction tool. A date, photograph or illustrated format is not proof of a manufacturing die, exact palette, valid registration or current issuance.</p>
        </section>
      </section>
      <aside className="inc-controls" aria-label="Customize Iran plate"><div className="inc-section-heading"><h2>Customize</h2><button type="button" className="inc-reset" disabled={!changed} onClick={() => { dispatch({ type: 'reset' }); setMessage('Preset restored. Other saved designs are unchanged.'); }}>Restore preset</button></div>
        <label className="inc-field"><span>Preset</span><select aria-label="Preset" value={state.presetId} onChange={event => choosePreset(event.target.value)}>{families.map(family => <optgroup key={family} label={family}>{IRAN_CUSTOM_PRESETS.filter(item => item.family === family).map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</optgroup>)}</select></label><p className="inc-help">Edits stay in this session when you switch designs or open the timeline. Restore preset resets only the current design.</p>
        <fieldset><legend>Plate content</legend><div className="inc-actions"><button type="button" className="inc-primary" onClick={generateNumber}>Generate valid number</button></div><p className="inc-help">{IRAN_NUMBER_BOUNDARY} Generation uses the full permitted digit repertoire, including historical zeroes. Existing valid allocation codes, dates and mission identifiers are kept.</p>
          {textField('serial', 'Serial', numberFormat.numeric.find(rule => rule.field === 'serial')!.maxLength)}<div className="inc-two-fields">{textField('prefix', 'Number prefix', numberFormat.numeric.find(rule => rule.field === 'prefix')?.maxLength)}
          {hasField('letter') && <label className="inc-field"><span>Series letter</span><select aria-label="Series letter" value={normalizeLetter(state.letter)} onChange={event => change('letter', event.target.value)}>{numberFormat.letters.map(letter => <option key={letter} value={letter}>{letter}</option>)}</select></label>}
          {hasField('code') && (codeOptions ? <label className="inc-field"><span>Allocation code</span><select aria-label="Allocation code" value={asciiDigits(state.code)} onChange={event => change('code', event.target.value)}>{codeOptions.map(code => <option key={code} value={code}>{code}</option>)}</select></label> : textField('code', 'Allocation code', numberFormat.numeric.find(rule => rule.field === 'code')?.maxLength))}</div>
          {hasField('letter') && <p className="inc-help">{numberFormat.letterBoundary}</p>}
          <p className="inc-help">{numberFormat.numeric.map(rule => `${rule.field}: ${rule.minLength === rule.maxLength ? rule.maxLength : `${rule.minLength}–${rule.maxLength}`} digits${rule.digits === '123456789' ? ', no zero' : ', zero allowed'}`).join(' · ')}</p>
          {hasField('city') && <label className="inc-field"><span>City · whole-word form</span><select aria-label="City · whole-word form" value={state.city} onChange={event => change('city', event.target.value)}>{IRAN_CUSTOM_CITIES.map(item => <option key={item.id} value={item.id}>{item.label} · {item.text}{!profile.wordmarks[item.id] ? ' · requires fallback or another profile' : ''}</option>)}</select></label>}
          {hasField('city') && <p className="inc-help">City wordforms are source-specific. A city marked “requires fallback or another profile” blocks strict export with this profile; choose a covered profile or explicitly enable labelled fallback.</p>}
          <div className="inc-two-fields">{textField('year', 'Year · Solar Hijri (SH)', 8)}{textField('expiry', 'Expiry · Solar Hijri (SH) year/month', 20)}</div>{(hasField('year') || hasField('expiry')) && <p className="inc-help">Enter the printed Solar Hijri year. No Gregorian conversion or issue-date inference is applied.</p>}
          {hasField('zone') && <label className="inc-field"><span>Free zone</span><select aria-label="Free zone" value={state.zone} onChange={event => change('zone', event.target.value)}>{IRAN_CUSTOM_ZONES.map(item => <option key={item.id} value={item.id}>{item.label} · {item.text}</option>)}</select></label>}
          {hasField('vehicleClass') && <label className="inc-field"><span>Vehicle class</span><select aria-label="Vehicle class" value={state.vehicleClass} onChange={event => { dispatch({ type: 'class', classId: event.target.value }); setMessage(''); }}>{iranAvailableClasses(state).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
          <p className="inc-help">Only fields used by this design appear. Class selection applies a suggested palette and class letter where supported; it does not establish that the combination was issued.</p>
        </fieldset>
        <fieldset><legend>Typography &amp; layout</legend><label className="inc-field"><span>Main glyph profile</span><select aria-label="Font profile" value={state.fontProfile} onChange={event => change('fontProfile', event.target.value)}>{iranAvailableFontProfiles(state).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><p className="inc-help">Changes the main serial lettering. Fixed city legends, year tabs, allocation headers and Latin labels can use separate documented role masters; inspect the coverage and scene notices.</p><label className="inc-field"><span>Missing glyph policy</span><select aria-label="Missing glyph policy" value={state.missingPolicy} onChange={event => change('missingPolicy', event.target.value as IranCustomState['missingPolicy'])}><option value="strict">Strict · mark missing and block export</option><option value="fallback">Fallback · allow labeled substitution</option></select></label><p className="inc-help">Strict permits labelled inferred numerals already supplied by the profile, but never silently fills missing outlines. Fallback remains a disclosed typography substitution.</p>
          {preset.kind === 'national' && ['private','public'].includes(state.vehicleClass) && <label className="inc-field"><span>National reference arrangement</span><select aria-label="National reference arrangement" value={state.nationalVariant ?? 'diagram'} onChange={event => change('nationalVariant', event.target.value as IranCustomState['nationalVariant'])}><option value="diagram">Class diagram arrangement</option><option value="early-photo">Early photographed private/public arrangement</option></select><small>Separate source layout, not an inferred redesign date. Numbering stays editable.</small></label>}
          <div className="inc-layout" role="group" aria-label="Layout">{(['source', 'long', 'compact'] as const).map(layout => <button type="button" key={layout} aria-pressed={state.layout === layout} onClick={() => change('layout', layout)}>{layout === 'source' ? 'Source layout' : layout === 'long' ? 'Long' : 'Compact'}</button>)}</div>
          <label className="inc-field"><span>Width / height ratio · 0 uses preset</span><input aria-label="Width / height ratio" type="number" min="0" max="6" step="0.001" value={state.aspectRatio ?? 0} onChange={event => change('aspectRatio', Number(event.target.value))} /><small>Preset source estimates are approximate where physical dimensions are unknown. Changes keep the plate flat and preserve glyph aspect.</small></label>
          <label className="inc-field inc-range"><span>Main lettering scale <output>{Math.round(state.mainScale * 100)}%</output></span><input aria-label="Main lettering scale" type="range" min="0.5" max="1.4" step="0.01" value={state.mainScale} onChange={event => change('mainScale', Number(event.target.value))} /></label><label className="inc-field inc-range"><span>Letter spacing <output>{state.tracking.toFixed(1)}</output></span><input aria-label="Letter spacing" type="range" min="-2" max="60" step="0.5" value={state.tracking} onChange={event => change('tracking', Number(event.target.value))} /></label>
        </fieldset>
        <fieldset><legend>Palette</legend><div className="inc-colors">{([{ key: 'bg', label: 'Background' }, { key: 'ink', label: 'Lettering' }, { key: 'strip', label: 'Side / class band' }] as const).filter(({ key }) => hasField(key)).map(({ key, label }) => <label key={key} className="inc-color"><input type="color" aria-label={label} value={state[key]} onChange={event => change(key, event.target.value)} /><span>{label}</span><code>{state[key]}</code></label>)}</div><label className="inc-checkbox"><input type="checkbox" checked={state.border} onChange={event => change('border', event.target.checked)} /> Plate border</label></fieldset>
      </aside>
    </div>
    <section className="inc-preset-library" aria-labelledby="inc-library-title"><div className="inc-section-heading"><div><p className="inc-eyebrow">EDITABLE DESIGNS</p><h2 id="inc-library-title">Preset library</h2></div><label className="inc-search"><span className="inc-sr-only">Search presets</span><input type="search" aria-label="Search presets" placeholder="Search period, family or evidence…" value={search} onChange={event => setSearch(event.target.value)} /></label></div><p className="inc-small">Research dates, observed specimens and illustrated reconstructions are described separately for every preset.</p><div className="inc-preset-list">{filteredPresets.map(item => <button type="button" className="inc-preset-card" key={item.id} aria-pressed={state.presetId === item.id} onClick={() => showPreset(item.id)}><span className="inc-preset-family">{item.family} · {item.period}</span><strong>{item.label}</strong><span>{item.evidence}</span><span className="inc-open">{state.presetId === item.id ? 'Currently editing' : session.saved[item.id] ? 'Continue editing →' : 'Customize →'}</span></button>)}</div>{!filteredPresets.length && <p className="inc-empty">No presets match “{search}”. Try another search.</p>}</section>
    <details className="inc-source-catalogue"><summary>Source-artwork coverage <span>{IRAN_CUSTOM_SOURCE_COVERAGE.length} mapped references</span></summary><p className="inc-small">Unbuilt and rejected evidence stays visible. Those rows are not editable or claims of real issued designs.</p><div className="inc-source-list">{IRAN_CUSTOM_SOURCE_COVERAGE.map(source => <article key={source.id} className="inc-source-row"><div><strong>{source.label}</strong><span className="inc-badge">{source.status}</span><p>{source.note}</p></div><div className="inc-source-actions">{source.sourceUrl && <a href={source.sourceUrl} target="_blank" rel="noreferrer">View source ↗</a>}{source.presetId && <button type="button" onClick={() => showPreset(source.presetId!)}>Open linked preset</button>}</div></article>)}</div></details>
  </div>;
}
