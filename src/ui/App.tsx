import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getFormat, getRegion, getRegions, getTemplate, makePlate } from '../core/registry';
import { createRng } from '../core/random';
import { regenerateParts } from '../core/lettering';
import { buildTimeline, countryOf, stepTimeline } from '../core/timeline';
import type { Parts, Plate } from '../core/types';
import { BatchView } from './BatchView';
import { download, fileSafe, serializeSvg, svgToPngBlob } from './exporting';
import { FormatTimeline } from './FormatTimeline';
import { GalleryView } from './GalleryView';
import { ChevronDown, CopyIcon, DownloadIcon, Logo, MonitorIcon, MoonIcon, RefreshIcon, SunIcon } from './icons';
import { Inspector } from './Inspector';
import { PlateView } from './PlateView';
import { RegionPicker } from './RegionPicker';
import { useTheme } from './useTheme';

const ReferenceLibrary = lazy(() => import('./ReferenceLibrary').then((module) => ({ default: module.ReferenceLibrary })));
const DEFAULT_REGION = 'us-ca';
type View = 'single' | 'gallery' | 'batch' | 'library';
const VIEWS: View[] = ['single', 'gallery', 'batch', 'library'];
const VIEW_LABELS: Record<View, string> = { single: 'Single', gallery: 'Gallery', batch: 'Batch', library: 'Library' };
function readHash(): { region: string; format?: string; view: View } {
  let hash = '';
  try { hash = decodeURIComponent(location.hash.replace(/^#\/?/, '')); } catch { /* malformed shared URL */ }
  const [region, format] = hash.split('/');
  if (region === 'library') return { region: DEFAULT_REGION, view: 'library' };
  if (region === 'gallery') return { region: getRegion(format) ? format : DEFAULT_REGION, view: 'gallery' };
  return getRegion(region) ? { region, format, view: 'single' } : { region: DEFAULT_REGION, view: 'single' };
}
function useFontsVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const specs = ['86px EuroPlate', '84px UKNumberPlate', '600 100px "Barlow Condensed"', '700 46px "Barlow Condensed"'];
    Promise.allSettled(specs.map((s) => document.fonts.load(s))).then(() => setVersion((v) => v + 1));
  }, []);
  return version;
}
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export function App() {
  const regions = useMemo(() => getRegions(), []);
  const initial = useMemo(readHash, []);
  const [regionId, setRegionId] = useState(initial.region);
  const region = getRegion(regionId)!;
  const [formatId, setFormatId] = useState(getFormat(region, initial.format).id);
  const format = getFormat(region, formatId);
  const [parts, setParts] = useState<Parts>(() => format.generate(createRng()));
  const [view, setView] = useState<View>(initial.view);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [spin, setSpin] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number>(undefined);
  const fontsVersion = useFontsVersion();
  const { theme, cycle } = useTheme();
  const plate: Plate = makePlate(region, format, parts);
  const timeline = useMemo(() => buildTimeline(region), [region]);
  const country = countryOf(region);
  const select = useCallback((nextRegion: string, nextFormat?: string, nextParts?: Parts) => {
    const r = getRegion(nextRegion);
    if (!r) return;
    const f = getFormat(r, nextFormat);
    setRegionId(r.id); setFormatId(f.id); setParts(nextParts ?? f.generate(createRng()));
  }, []);
  const openEditor = useCallback((nextRegion: string, nextFormat: string) => {
    select(nextRegion, nextFormat); setView('single'); window.scrollTo({ top: 0 });
  }, [select]);
  const regenerate = useCallback(() => {
    setParts((previous) => regenerateParts(format, previous, createRng()));
    setSpin((n) => n + 1);
  }, [format]);
  const step = useCallback((delta: 1 | -1) => {
    const next = timeline && stepTimeline(timeline, format.id, delta);
    if (next) select(region.id, next.id);
  }, [timeline, format.id, region.id, select]);
  useEffect(() => {
    history.replaceState(null, '', view === 'library' ? '#/library' : view === 'gallery' ? `#/gallery/${region.id}` : `#/${region.id}/${format.id}`);
  }, [region.id, format.id, view]);
  useEffect(() => {
    const onHash = () => {
      const next = readHash();
      if (next.view !== 'library') select(next.region, next.format);
      setView(next.view);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [select]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPickerOpen(true); return; }
      const el = e.target as HTMLElement;
      if (pickerOpen || el.closest('input, select, textarea, button') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); setPickerOpen(true); }
      else if (view === 'single' && (e.key === ' ' || e.key.toLowerCase() === 'r')) { e.preventDefault(); regenerate(); }
      else if (view === 'single' && timeline && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [regenerate, step, timeline, pickerOpen, view]);
  useEffect(() => {
    if (!saveOpen) return;
    const close = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest('.save-menu, .save-trigger')) setSaveOpen(false); };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [saveOpen]);
  const flash = (msg: string) => {
    setToast(msg); window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 1800);
  };
  const exportAs = async (kind: 'svg' | 'png') => {
    setSaveOpen(false);
    const svg = previewRef.current?.querySelector('svg');
    if (!svg) return;
    try {
      const text = await serializeSvg(svg, getTemplate(region.template).fonts);
      const name = `${region.code}-${fileSafe(plate.text)}`;
      if (kind === 'svg') download(new Blob([text], { type: 'image/svg+xml' }), `${name}.svg`);
      else { const { width, height } = svg.viewBox.baseVal; download(await svgToPngBlob(text, width, height, 4), `${name}.png`); }
      flash(`Saved ${name}.${kind}`);
    } catch (e) { flash(e instanceof Error ? `Export failed: ${e.message}` : 'Export failed.'); }
  };
  const copy = async (value: string, label: string) => {
    setSaveOpen(false);
    try { await navigator.clipboard.writeText(value); flash(label); } catch { flash('Clipboard unavailable'); }
  };
  const copyText = () => copy(plate.text, `Copied ${plate.text}`);
  const copyLink = () => copy(location.href, 'Link copied');
  const ThemeIcon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : MonitorIcon;
  return <div className={`app view-${view}`}>
    <header className="topbar">
      <a className="brand" href="#/" onClick={(e) => e.preventDefault()} aria-label="PlateForge"><Logo /><span>PlateForge</span></a>
      <button className="region-trigger" onClick={() => setPickerOpen(true)} aria-haspopup="dialog">
        <span className="flag" aria-hidden="true">{region.flag}</span>
        <span className="region-trigger-text"><span className="region-trigger-name">{region.name}</span><span className="region-trigger-group">{country === region.name ? region.group : country}</span></span>
        <ChevronDown /><kbd className="hide-mobile">{isMac ? '⌘' : 'Ctrl'} K</kbd>
      </button>
      <div className="topbar-end">
        <div className="tabs hide-mobile" role="tablist" aria-label="Mode">{VIEWS.map((v) => <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>{VIEW_LABELS[v]}</button>)}</div>
        <button className="icon-btn" onClick={cycle} aria-label={`Theme: ${theme}`} title={`Theme: ${theme}`}><ThemeIcon /></button>
      </div>
    </header>
    <div className="mobile-tabs tabs" role="tablist" aria-label="Mode">{VIEWS.map((v) => <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>{v === 'single' ? 'Plate' : VIEW_LABELS[v]}</button>)}</div>
    <main className="workspace" key={fontsVersion}>
      {view === 'library' ? <Suspense fallback={<p role="status">Loading reference library…</p>}><ReferenceLibrary regions={regions} onOpenFormat={openEditor} /></Suspense>
        : view === 'gallery' ? <GalleryView regions={regions} region={region} format={format} onOpen={openEditor} />
        : view === 'single' ? <>
          <section className="stage-col">
            {timeline ? <FormatTimeline region={region} timeline={timeline} format={format} onSelect={(id) => select(region.id, id)} onOpenGallery={() => { setView('gallery'); window.scrollTo({ top: 0 }); }} />
              : region.formats.length > 1 && <nav className="chips" aria-label="Plate format">{region.formats.map((f) => <button key={f.id} className="chip" aria-pressed={f.id === format.id} onClick={() => select(region.id, f.id)}>{f.label}</button>)}</nav>}
            <div className="stage"><PlateView key={spin} ref={previewRef} plate={plate} className="plate-preview" /></div>
            <div className="readout">
              <button className="readout-text mono" onClick={copyText} title="Copy serial"><span>{plate.text}</span><CopyIcon /></button>
              <button className="btn primary hide-mobile" onClick={regenerate}><RefreshIcon /> Generate<kbd className="kbd-inverse">Space</kbd></button>
            </div>
          </section>
          <Inspector region={region} format={format} parts={parts} onChange={setParts} onExport={exportAs} onCopyLink={copyLink} />
        </> : <BatchView region={region} format={format} onPick={(p) => { select(p.region.id, p.format.id, p.parts); setView('single'); window.scrollTo({ top: 0 }); }} />}
    </main>
    {view === 'single' && <div className="action-bar" role="toolbar" aria-label="Plate actions">
      <button className="btn" onClick={copyText} aria-label="Copy serial"><CopyIcon /></button>
      <button className="btn primary grow" onClick={regenerate}><RefreshIcon /> Generate</button>
      <div className="save-wrap">
        <button className="btn save-trigger" onClick={() => setSaveOpen((o) => !o)} aria-expanded={saveOpen} aria-label="Save"><DownloadIcon /></button>
        {saveOpen && <div className="save-menu" role="menu"><button role="menuitem" onClick={() => exportAs('png')}>Save PNG</button><button role="menuitem" onClick={() => exportAs('svg')}>Save SVG</button><button role="menuitem" onClick={copyLink}>Copy link</button></div>}
      </div>
    </div>}
    <RegionPicker open={pickerOpen} regions={regions} selected={region.id} onSelect={(id) => { select(id); setView((v) => v === 'gallery' ? 'gallery' : 'single'); }} onClose={() => setPickerOpen(false)} />
    <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">{toast}</div>
  </div>;
}
