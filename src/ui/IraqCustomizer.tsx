import { useMemo, useReducer, useRef, useState } from 'react';
import { IRAQ_GOVERNORATES } from '../regions/asia/iraq-data';
import { IRAQ_FONT_PROFILES, IRAQ_WORDMARKS } from '../templates/iraq-custom-fonts';
import { IRAQ_CUSTOM_PRESETS, IRAQ_CUSTOM_PROVINCES, IRAQ_CUSTOM_CLASSES, IRAQ_CUSTOM_SOURCE_COVERAGE, applyIraqClass, customizerState, renderIraqCustom, type IraqCustomState } from '../templates/iraq-custom-scene';
import { download, fileSafe, svgToPngBlob } from './exporting';
import './iraq-customizer.css';

const policyLabel = { strict: 'Strict source coverage', fallback: 'Fallback explicitly enabled' };
const profileLabel = { observed: 'Observed source outlines', candidate: 'Candidate reconstruction', fallback: 'Fallback outlines', unsupported: 'Unsupported' };
const profiles = Object.values(IRAQ_FONT_PROFILES);
const families = [...new Set(IRAQ_CUSTOM_PRESETS.map((preset) => preset.family))];

export interface IraqEditorSession { current: IraqCustomState; saved: Record<string, IraqCustomState> }
export type IraqEditorAction =
  | { type: 'edit'; patch: Partial<Omit<IraqCustomState, 'presetId'>> }
  | { type: 'select'; presetId: string }
  | { type: 'class'; classId: string }
  | { type: 'reset' };
export function createIraqEditorSession(presetId = IRAQ_CUSTOM_PRESETS[0].id): IraqEditorSession {
  return { current: customizerState(presetId), saved: {} };
}
/** Pure session transitions make repeated edit, switch, and restore flows testable without a browser. */
export function iraqEditorReducer(session: IraqEditorSession, action: IraqEditorAction): IraqEditorSession {
  if (action.type === 'edit') return { ...session, current: { ...session.current, ...action.patch } };
  if (action.type === 'class') return { ...session, current: applyIraqClass(session.current, action.classId) };
  if (action.type === 'select') {
    if (action.presetId === session.current.presetId || !IRAQ_CUSTOM_PRESETS.some((item) => item.id === action.presetId)) return session;
    return { current: session.saved[action.presetId] ?? customizerState(action.presetId), saved: { ...session.saved, [session.current.presetId]: session.current } };
  }
  const saved = { ...session.saved };
  delete saved[session.current.presetId];
  return { current: customizerState(session.current.presetId), saved };
}

/** The app and the offline editor both mount this component and use the same live scene engine. */
export function IraqCustomizer({ initialState }: { initialState?: IraqCustomState } = {}) {
  const [{ current: state, saved: savedEdits }, dispatch] = useReducer(iraqEditorReducer, undefined, () => initialState
    ? { current: { ...initialState }, saved: {} } : createIraqEditorSession());
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const exportLock = useRef(false);
  const preset = IRAQ_CUSTOM_PRESETS.find((item) => item.id === state.presetId) ?? IRAQ_CUSTOM_PRESETS[0];
  const scene = useMemo(() => renderIraqCustom(state), [state]);
  const profile = profiles.find((item) => item.id === state.fontProfile) ?? profiles[0];
  const activeFields = new Set(preset.fields);
  if (['modern', 'modern-temporary'].includes(preset.kind)) { if (state.vehicleClass === 'temporary') activeFields.delete('letter'); else activeFields.add('letter'); }
  if (['divided', 'police', 'legacy-temporary'].includes(preset.kind)) { if (state.vehicleClass === 'temporary') activeFields.add('year'); else activeFields.delete('year'); }
  if (['modern', 'modern-temporary', 'international', 'icts', 'inspection-temporary'].includes(preset.kind)) activeFields.delete('province');
  if (['side', 'short-bilingual', 'inspection-temporary', 'police'].includes(preset.kind)) activeFields.delete('strip');
  if (['divided', 'legacy-temporary'].includes(preset.kind) && state.vehicleClass !== 'temporary') activeFields.delete('strip');
  if (preset.kind === 'bilingual') { if (['government', 'customs'].includes(state.vehicleClass)) activeFields.delete('province'); else activeFields.add('province'); }
  const hasField = (key: keyof IraqCustomState) => activeFields.has(key);
  const filteredPresets = useMemo(() => IRAQ_CUSTOM_PRESETS.filter((item) =>
    `${item.label} ${item.family} ${item.evidence}`.toLowerCase().includes(search.toLowerCase().trim())), [search]);
  const changed = JSON.stringify(state) !== JSON.stringify(customizerState(preset.id));
  const canExport = scene.errors.length === 0 && !!scene.svg;
  const warnings = [...new Set(scene.warnings)];
  const errors = [...new Set(scene.errors)];

  function change<K extends keyof IraqCustomState>(key: K, value: IraqCustomState[K]) {
    dispatch({ type: 'edit', patch: { [key]: value } });
    setMessage('');
  }
  function choosePreset(id: string) {
    if (id === state.presetId) return;
    dispatch({ type: 'select', presetId: id });
    setMessage('');
  }
  function reset() {
    dispatch({ type: 'reset' });
    setMessage('Preset restored.');
  }
  async function exportScene(kind: 'svg' | 'png') {
    if (!canExport || exportLock.current) return;
    exportLock.current = true;
    setExporting(true);
    setMessage('');
    // Capture the scene at the click, so later edits cannot change an in-flight PNG export.
    const snapshot = scene;
    const name = `iraq-${fileSafe(state.presetId)}-${fileSafe(state.serial)}`;
    try {
      if (kind === 'svg') download(new Blob([snapshot.svg], { type: 'image/svg+xml' }), `${name}.svg`);
      else download(await svgToPngBlob(snapshot.svg, snapshot.width, snapshot.height, 4), `${name}.png`);
      setMessage(`${kind.toUpperCase()} export ready${warnings.length ? ' with the displayed source-coverage warnings' : ''}.`);
    } catch (error) {
      setMessage(`Export failed: ${error instanceof Error ? error.message : 'unknown error'}. Try again or use SVG.`);
    } finally {
      exportLock.current = false;
      setExporting(false);
    }
  }

  return <div className="iraq-customizer">
    <header className="iqc-heading">
      <div><p className="iqc-eyebrow">PLATEFORGE · IRAQ WORKSHOP</p><h1>Flat plates. Real controls.</h1>
        <p className="iqc-intro">Edit the lettering, layout and palette. Every change rebuilds a rectangular SVG plate from vector shapes.</p></div>
      <span className="iqc-count"><strong>{IRAQ_CUSTOM_PRESETS.length}</strong> editable presets</span>
    </header>

    <div className="iqc-workbench">
      <section className="iqc-canvas-column" aria-label="Live plate preview">
        <div className="iqc-preview-shell">
          <div className="iqc-preview-top"><span className="iqc-eyebrow">LIVE VECTOR PREVIEW</span><span className="iqc-badge">{changed ? 'Customized' : 'Preset defaults'}</span></div>
          <div className="iqc-preview" ref={previewRef} data-testid="iraq-preview" dangerouslySetInnerHTML={{ __html: scene.svg }} />
          <div className="iqc-preview-bottom"><span>{scene.width} × {scene.height} drawing units</span><span>Flat geometry · transparent outer canvas</span></div>
        </div>
        <div className="iqc-export-row"><div><h2>{preset.label}</h2><p>{preset.family}</p></div>
          <div className="iqc-actions"><button type="button" onClick={() => exportScene('svg')} disabled={!canExport || exporting}>Save SVG</button><button type="button" className="iqc-primary" onClick={() => exportScene('png')} disabled={!canExport || exporting}>{exporting ? 'Preparing…' : 'Save PNG · 4×'}</button></div>
        </div>
        <div className="iqc-message" role="status" aria-live="polite">{message || (!canExport ? 'Export is blocked until the errors below are resolved.' : 'SVG and PNG use this exact live scene. No remote fonts are needed.')}</div>

        <section className={`iqc-coverage ${errors.length ? 'iqc-has-errors' : warnings.length ? 'iqc-has-warnings' : ''}`} aria-labelledby="iqc-coverage-title">
          <div className="iqc-section-heading"><h2 id="iqc-coverage-title">Source & font coverage</h2><span className={`iqc-policy iqc-policy-${state.missingPolicy}`}>{policyLabel[state.missingPolicy]}</span></div>
          <p className="iqc-evidence">{preset.evidence}</p>
          <div className="iqc-profile-summary"><strong>{profile.label}</strong><span className="iqc-badge">{profileLabel[profile.provenance]}</span></div>
          <p className="iqc-small">Available glyphs in this profile. Digit aliases retain the profile’s own numeral style.</p>
          <div className="iqc-glyphs" aria-label="Available glyphs">{Array.from(profile.coverage).filter((glyph) => glyph.trim()).map((glyph, index) => <span key={`${glyph}-${index}`}>{glyph}</span>)}</div>
          <details className="iqc-wordmarks"><summary>Whole-word coverage · {Object.keys(profile.wordmarks).length} supplied forms</summary>
            {Object.keys(profile.wordmarks).length ? <ul>{Object.entries(profile.wordmarks).map(([id, word]) => <li key={id}><span>{IRAQ_WORDMARKS[id]?.label ?? id}</span><span dir="rtl">{word.text}</span><span className="iqc-badge">{word.provenance}</span></li>)}</ul> : <p>This profile has no joined Arabic wordmarks. Strict mode marks missing words; fallback must be explicitly enabled.</p>}
          </details>
          {profile.notes.length > 0 && <ul className="iqc-notes">{profile.notes.map((note, index) => <li key={index}>{note}</li>)}</ul>}
          <div className="iqc-validation" aria-live="polite" aria-atomic="true">
            {errors.length > 0 && <div className="iqc-error"><h3>{errors.length} {errors.length === 1 ? 'issue blocks' : 'issues block'} export</h3><ul>{errors.map((error, index) => <li key={index}>{error}</li>)}</ul><p>Choose covered text or another font profile, or explicitly enable fallback in the controls.</p></div>}
            {warnings.length > 0 && <div className="iqc-warning"><h3>{warnings.length} source / rendering {warnings.length === 1 ? 'notice' : 'notices'}</h3><ul>{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}
            {!errors.length && !warnings.length && <p className="iqc-success">No missing glyphs reported for the current scene.</p>}
          </div>
          <p className="iqc-small iqc-rights"><strong>Use & provenance:</strong> {profile.rights}{profile.sourceUrl && <> <a href={profile.sourceUrl} target="_blank" rel="noreferrer">Profile source ↗</a></>}</p>
          <p className="iqc-small iqc-disclaimer">Coverage describes the available reference material. Candidate lettering and approximate palettes are not certified manufacturing dies or proof that a plate was issued.</p>
        </section>
      </section>

      <aside className="iqc-controls" aria-label="Customize Iraq plate">
        <div className="iqc-section-heading"><h2>Customize</h2><button type="button" className="iqc-reset" onClick={reset} disabled={!changed}>Restore preset</button></div>
        <label className="iqc-field"><span>Preset</span><select value={state.presetId} onChange={(event) => choosePreset(event.target.value)} aria-label="Preset">{families.map((family) => <optgroup key={family} label={family}>{IRAQ_CUSTOM_PRESETS.filter((item) => item.family === family).map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</optgroup>)}</select></label>
        <p className="iqc-help">Edits are kept while you switch presets. Restore preset resets only this design.</p>
        <fieldset><legend>Lettering</legend>
          <label className="iqc-field"><span>Serial</span><input aria-label="Serial" dir="ltr" autoComplete="off" spellCheck={false} maxLength={20} value={state.serial} onChange={(event) => change('serial', event.target.value)} /></label>
          <div className="iqc-two-fields">
            {hasField('province') && <label className="iqc-field"><span>Province / prefix</span><select aria-label="Province / prefix" value={state.province} onChange={(event) => change('province', event.target.value)}>{IRAQ_CUSTOM_PROVINCES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
            {hasField('letter') && <label className="iqc-field"><span>{preset.kind === 'international' ? 'Latin city suffix' : 'Letter'}</span><input aria-label="Letter" dir="auto" autoComplete="off" spellCheck={false} maxLength={8} value={state.letter} onChange={(event) => change('letter', event.target.value)} /></label>}
          </div>
          {hasField('governorate') && <label className="iqc-field"><span>Governorate code{state.vehicleClass === 'temporary' ? ' / range' : ''}</span><input aria-label="Governorate" dir="ltr" list="iqc-governorates" autoComplete="off" maxLength={5} value={state.governorate} onChange={(event) => change('governorate', event.target.value)} /><datalist id="iqc-governorates">{IRAQ_GOVERNORATES.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</datalist></label>}
          <div className="iqc-two-fields"><label className="iqc-field"><span>Vehicle class</span><select aria-label="Vehicle class" value={state.vehicleClass} onChange={(event) => { dispatch({ type: 'class', classId: event.target.value }); setMessage(''); }}>{IRAQ_CUSTOM_CLASSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            {hasField('year') && <label className="iqc-field"><span>Year / tag</span><input aria-label="Year / tag" dir="ltr" autoComplete="off" spellCheck={false} maxLength={12} value={state.year} onChange={(event) => change('year', event.target.value)} /></label>}</div>
          <p className="iqc-help">Fields appear only where the selected family has a place for them. Class selection also sets its suggested palette.</p>
        </fieldset>
        <fieldset><legend>Typography & layout</legend>
          <label className="iqc-field"><span>Font profile</span><select aria-label="Font profile" value={state.fontProfile} onChange={(event) => change('fontProfile', event.target.value as IraqCustomState['fontProfile'])}>{profiles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label className="iqc-field"><span>Missing glyph policy</span><select aria-label="Missing glyph policy" value={state.missingPolicy} onChange={(event) => change('missingPolicy', event.target.value as IraqCustomState['missingPolicy'])}><option value="strict">Strict · mark missing and block export</option><option value="fallback">Fallback · allow labeled substitution</option></select></label>
          <div className="iqc-help">Strict never silently fills gaps. Fallback is an explicit choice and remains disclosed in the notices.</div>
          <div className="iqc-layout" role="group" aria-label="Layout"><button type="button" aria-pressed={state.layout === 'long'} onClick={() => change('layout', 'long')}>Long</button><button type="button" aria-pressed={state.layout === 'compact'} onClick={() => change('layout', 'compact')}>Compact</button></div>
          <label className="iqc-field iqc-range"><span>Main lettering scale <output>{Math.round(state.mainScale * 100)}%</output></span><input aria-label="Main lettering scale" type="range" min="0.5" max="1.4" step="0.01" value={state.mainScale} onChange={(event) => change('mainScale', Number(event.target.value))} /></label>
          <label className="iqc-field iqc-range"><span>Letter spacing <output>{state.tracking.toFixed(1)}</output></span><input aria-label="Letter spacing" type="range" min="-2" max="12" step="0.5" value={state.tracking} onChange={(event) => change('tracking', Number(event.target.value))} /></label>
        </fieldset>
        <fieldset><legend>Palette</legend>
          <div className="iqc-colors">{([{ key: 'bg', label: 'Background' }, { key: 'ink', label: 'Lettering' }, { key: 'strip', label: 'Class strip' }] as const).filter(({ key }) => hasField(key)).map(({ key, label }) => <label key={key} className="iqc-color"><input type="color" aria-label={label} value={state[key]} onChange={(event) => change(key, event.target.value)} /><span>{label}</span><code>{state[key]}</code></label>)}</div>
          <label className="iqc-checkbox"><input type="checkbox" checked={state.border} onChange={(event) => change('border', event.target.checked)} /> Plate border</label>
        </fieldset>
      </aside>
    </div>

    <section className="iqc-preset-library" aria-labelledby="iqc-library-title">
      <div className="iqc-section-heading"><div><p className="iqc-eyebrow">EDITABLE DESIGNS</p><h2 id="iqc-library-title">Preset library</h2></div><label className="iqc-search"><span className="iqc-sr-only">Search presets</span><input type="search" placeholder="Search era, family or source…" aria-label="Search presets" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
      <p className="iqc-small">Choose a design to edit. Source-derived specimens and broader reconstruction recipes are labeled separately in their evidence notes.</p>
      <div className="iqc-preset-list">{filteredPresets.map((item) => <button type="button" className="iqc-preset-card" key={item.id} aria-pressed={state.presetId === item.id} onClick={() => { choosePreset(item.id); previewRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }}><span className="iqc-preset-family">{item.family}</span><strong>{item.label}</strong><span>{item.evidence}</span><span className="iqc-open">{state.presetId === item.id ? 'Currently editing' : savedEdits[item.id] ? 'Continue editing →' : 'Customize →'}</span></button>)}</div>
      {!filteredPresets.length && <p className="iqc-empty">No presets match “{search}”. Try another search.</p>}
    </section>
    <details className="iqc-source-catalogue">
      <summary>Source-artwork coverage <span>{IRAQ_CUSTOM_SOURCE_COVERAGE.length} mapped references</span></summary>
      <p className="iqc-small">Photographs and diagrams are evidence for the renderer. Evidence-only rows do not imply an implemented historical plate.</p>
      <div className="iqc-source-list">{IRAQ_CUSTOM_SOURCE_COVERAGE.map((source) => <article key={source.id} className="iqc-source-row">
        <div><strong>{source.label}</strong><span className="iqc-badge">{source.presetId ? source.status : 'Evidence only'}</span><p>{source.note}</p></div>
        <div className="iqc-source-actions">{source.sourceUrl && <a href={source.sourceUrl} target="_blank" rel="noreferrer">View source ↗</a>}{source.presetId && <button type="button" onClick={() => { choosePreset(source.presetId!); previewRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }}>Open linked preset</button>}</div>
      </article>)}</div>
    </details>
  </div>;
}
