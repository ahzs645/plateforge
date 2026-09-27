import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getFormat, getRegion, getRegions, getTemplate, makePlate } from '../core/registry';
import { createRng } from '../core/random';
import type { Parts, Plate } from '../core/types';
import { BatchView } from './BatchView';
import { download, fileSafe, serializeSvg, svgToPngBlob } from './exporting';
import { ChevronDown, CopyIcon, DownloadIcon, Logo, MonitorIcon, MoonIcon, RefreshIcon, SunIcon } from './icons';
import { Inspector } from './Inspector';
import { PlateView } from './PlateView';
import { RegionPicker } from './RegionPicker';
import { useTheme } from './useTheme';

const DEFAULT_REGION = 'us-ca';
type View = 'single' | 'batch';

function readHash(): { region: string; format?: string } {
  const [region, format] = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
  return getRegion(region) ? { region, format } : { region: DEFAULT_REGION };
}

/** Re-render once plate fonts are available so measured layouts use real metrics. */
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
  const [view, setView] = useState<View>('single');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [spin, setSpin] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number>(undefined);
  const fontsVersion = useFontsVersion();
  const { theme, cycle } = useTheme();

  const plate: Plate = makePlate(region, format, parts);

  const select = useCallback((nextRegion: string, nextFormat?: string, nextParts?: Parts) => {
    const r = getRegion(nextRegion)!;
    const f = getFormat(r, nextFormat);
    setRegionId(r.id);
    setFormatId(f.id);
    setParts(nextParts ?? f.generate(createRng()));
  }, []);

  const regenerate = useCallback(() => {
    setParts(format.generate(createRng()));
    setSpin((n) => n + 1);
  }, [format]);

  useEffect(() => {
    history.replaceState(null, '', `#/${region.id}/${format.id}`);
  }, [region.id, format.id]);

  // Pasted / shared links like #/eu-de/standard.
  useEffect(() => {
    const onHash = () => {
      const next = readHash();
      select(next.region, next.format);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [select]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPickerOpen(true);
        return;
      }
      const el = e.target as HTMLElement;
      if (pickerOpen || el.closest('input, select, textarea, button') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        setPickerOpen(true);
      } else if (view === 'single' && (e.key === ' ' || e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        regenerate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [regenerate, pickerOpen, view]);

  useEffect(() => {
    if (!saveOpen) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('.save-menu, .save-trigger')) setSaveOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [saveOpen]);

  const flash = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 1800);
  };

  const exportAs = async (kind: 'svg' | 'png') => {
    setSaveOpen(false);
    const svg = previewRef.current?.querySelector('svg');
    if (!svg) return;
    const text = await serializeSvg(svg, getTemplate(region.template).fonts);
    const name = `${region.code}-${fileSafe(plate.text)}`;
    if (kind === 'svg') {
      download(new Blob([text], { type: 'image/svg+xml' }), `${name}.svg`);
    } else {
      const { width, height } = svg.viewBox.baseVal;
      download(await svgToPngBlob(text, width, height, 4), `${name}.png`);
    }
    flash(`Saved ${name}.${kind}`);
  };

  const copy = async (value: string, label: string) => {
    setSaveOpen(false);
    try {
      await navigator.clipboard.writeText(value);
      flash(label);
    } catch {
      flash('Clipboard unavailable');
    }
  };
  const copyText = () => copy(plate.text, `Copied ${plate.text}`);
  const copyLink = () => copy(location.href, 'Link copied');

  const ThemeIcon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : MonitorIcon;

  return (
    <div className={`app view-${view}`}>
      <header className="topbar">
        <a className="brand" href="#/" onClick={(e) => e.preventDefault()} aria-label="PlateForge">
          <Logo />
          <span>PlateForge</span>
        </a>

        <button className="region-trigger" onClick={() => setPickerOpen(true)} aria-haspopup="dialog">
          <span className="flag" aria-hidden="true">{region.flag}</span>
          <span className="region-trigger-text">
            <span className="region-trigger-name">{region.name}</span>
            <span className="region-trigger-group">{region.group}</span>
          </span>
          <ChevronDown />
          <kbd className="hide-mobile">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>

        <div className="topbar-end">
          <div className="tabs hide-mobile" role="tablist" aria-label="Mode">
            {(['single', 'batch'] as View[]).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>
                {v === 'single' ? 'Single' : 'Batch'}
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={cycle} aria-label={`Theme: ${theme}`} title={`Theme: ${theme}`}>
            <ThemeIcon />
          </button>
        </div>
      </header>

      <div className="mobile-tabs tabs" role="tablist" aria-label="Mode">
        {(['single', 'batch'] as View[]).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>
            {v === 'single' ? 'Single plate' : 'Batch'}
          </button>
        ))}
      </div>

      <main className="workspace" key={fontsVersion}>
        {view === 'single' ? (
          <>
            <section className="stage-col">
              {region.formats.length > 1 && (
                <nav className="chips" aria-label="Plate format">
                  {region.formats.map((f) => (
                    <button key={f.id} className="chip" aria-pressed={f.id === format.id} onClick={() => select(region.id, f.id)}>
                      {f.label}
                    </button>
                  ))}
                </nav>
              )}

              <div className="stage">
                <PlateView key={spin} ref={previewRef} plate={plate} className="plate-preview" />
              </div>

              <div className="readout">
                <button className="readout-text mono" onClick={copyText} title="Copy serial">
                  <span>{plate.text}</span>
                  <CopyIcon />
                </button>
                <button className="btn primary hide-mobile" onClick={regenerate}>
                  <RefreshIcon /> Generate
                  <kbd className="kbd-inverse">Space</kbd>
                </button>
              </div>
            </section>

            <Inspector region={region} format={format} parts={parts} onChange={setParts} onExport={exportAs} onCopyLink={copyLink} />
          </>
        ) : (
          <BatchView
            region={region}
            format={format}
            onPick={(p) => {
              select(p.region.id, p.format.id, p.parts);
              setView('single');
              window.scrollTo({ top: 0 });
            }}
          />
        )}
      </main>

      {view === 'single' && (
        <div className="action-bar" role="toolbar" aria-label="Plate actions">
          <button className="btn" onClick={copyText} aria-label="Copy serial">
            <CopyIcon />
          </button>
          <button className="btn primary grow" onClick={regenerate}>
            <RefreshIcon /> Generate
          </button>
          <div className="save-wrap">
            <button className="btn save-trigger" onClick={() => setSaveOpen((o) => !o)} aria-expanded={saveOpen} aria-label="Save">
              <DownloadIcon />
            </button>
            {saveOpen && (
              <div className="save-menu" role="menu">
                <button role="menuitem" onClick={() => exportAs('png')}>Save PNG</button>
                <button role="menuitem" onClick={() => exportAs('svg')}>Save SVG</button>
                <button role="menuitem" onClick={copyLink}>Copy link</button>
              </div>
            )}
          </div>
        </div>
      )}

      <RegionPicker
        open={pickerOpen}
        regions={regions}
        selected={region.id}
        onSelect={(id) => select(id)}
        onClose={() => setPickerOpen(false)}
      />

      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}

