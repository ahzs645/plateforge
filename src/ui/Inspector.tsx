import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { LetteringPicker } from './LetteringPicker';
import { TypefaceReview } from './TypefaceReview';
import type { FieldDef, Parts, PlateFormat, Region } from '../core/types';
import { statusBadge } from '../core/timeline';
import { AlertIcon, CheckIcon, ChevronDown, DownloadIcon } from './icons';
import { TESLA_HINT, type ExportKind } from './exporting';

interface Props {
  region: Region;
  format: PlateFormat;
  parts: Parts;
  onChange(parts: Parts): void;
  onExport(kind: ExportKind): void;
  onCopyLink(): void;
}

/** Long research notes start clamped; most people only need the first lines. */
function Note({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 200;
  return (
    <div className="insp-about">
      <p className="insp-note" data-clamped={long && !open}>{text}</p>
      {long && <button type="button" className="link-btn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Show less' : 'Show more'}</button>}
    </div>
  );
}

/** Right-hand panel on desktop; a bottom sheet on phones that peeks with the serial and expands for the rest.
 *  Editable parts are generated from the format's fields: typed parts under Serial, choices under Style. */
export function Inspector({ region, format, parts, onChange, onExport, onCopyLink }: Props) {
  const error = format.validate?.(parts) ?? null;
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ y: number; moved: boolean } | null>(null);
  const typed = format.fields.filter((f) => !f.options && f.key !== 'lettering');
  const choices = format.fields.filter((f) => f.options || f.key === 'lettering');
  const badge = statusBadge(format);

  // Tell the page how much of the screen the collapsed sheet covers, so the plate can scroll clear of it.
  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      const sheet = getComputedStyle(el).position === 'fixed';
      if (sheet) root.style.setProperty('--sheet-peek', `${Math.ceil(el.getBoundingClientRect().height)}px`);
      else root.style.removeProperty('--sheet-peek');
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded]);
  useEffect(() => () => { document.documentElement.style.removeProperty('--sheet-peek'); }, []);

  // Swipe the handle up to expand, down to collapse; a tap toggles.
  const onPointerDown = (e: ReactPointerEvent) => { drag.current = { y: e.clientY, moved: false }; e.currentTarget.setPointerCapture(e.pointerId); };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || d.moved || Math.abs(e.clientY - d.y) < 24) return;
    d.moved = true;
    setExpanded(e.clientY < d.y);
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) setExpanded((x) => !x);
  };

  const input = (field: FieldDef) => {
    const id = `field-${field.key}`;
    const wide = typed.length === 1 || (field.maxLength ?? 12) > 6;
    return (
      <div key={field.key} className={`field ${wide ? 'wide' : ''}`}>
        <label htmlFor={id}>{field.label}</label>
        <input
          id={id}
          className="mono"
          value={parts[field.key] ?? ''}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={!!error}
          onChange={(e) =>
            onChange({ ...parts, [field.key]: field.uppercase === false ? e.target.value : e.target.value.toUpperCase() })
          }
        />
      </div>
    );
  };
  const choice = (field: FieldDef) => {
    if (field.key === 'lettering') return (
      <LetteringPicker key={field.key} field={field} value={parts.lettering ?? 'default'}
        onChange={(lettering) => onChange({ ...parts, lettering })} />
    );
    const id = `field-${field.key}`;
    return (
      <div key={field.key} className="field wide">
        <label htmlFor={id}>{field.label}</label>
        <div className="select">
          <select id={id} value={parts[field.key] ?? ''} onChange={(e) => onChange({ ...parts, [field.key]: e.target.value })}>
            {field.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
    );
  };

  return (
    <>
      {expanded && <div className="sheet-backdrop" aria-hidden="true" onClick={() => setExpanded(false)} />}
      <aside ref={ref} className="inspector" aria-label="Plate details" data-expanded={expanded}
        onKeyDown={(e) => { if (e.key === 'Escape' && expanded) { e.stopPropagation(); setExpanded(false); } }}>
        <button type="button" className="sheet-handle" aria-expanded={expanded} aria-controls="insp-more"
          aria-label={expanded ? 'Hide plate details' : 'Show plate details'}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { drag.current = null; }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((x) => !x); } }}>
          <span className="sheet-grabber" />
        </button>
        <div className="insp-body">
          <section className="insp-section insp-serial">
            <header className="insp-head">
              <h2>Serial</h2>
              <span className={`status ${error ? 'bad' : 'ok'}`} role="status">
                {error ? <AlertIcon /> : <CheckIcon />}
                {error ? 'Invalid' : 'Valid'}
              </span>
              <button type="button" className="sheet-more" aria-expanded={expanded} aria-controls="insp-more" onClick={() => setExpanded((x) => !x)}>
                {expanded ? 'Less' : 'More'} <ChevronDown />
              </button>
            </header>
            {typed.length > 0 && <div className="fields">{typed.map(input)}</div>}
            {error && <p className="field-error">{error}</p>}
          </section>

          <div id="insp-more" className="insp-more">
            {choices.length > 0 && (
              <section className="insp-section">
                <header className="insp-head"><h2>Style</h2></header>
                <div className="fields">{choices.map(choice)}</div>
              </section>
            )}

            <section className="insp-section">
              <header className="insp-head"><h2>About this design</h2></header>
              <dl className="facts">
                <div>
                  <dt>Region</dt>
                  <dd>{region.flag} {region.name} <span className="muted">· {region.code}</span></dd>
                </div>
                <div>
                  <dt>Design</dt>
                  <dd>{format.label}</dd>
                </div>
                {badge && (
                  <div>
                    <dt>Status</dt>
                    <dd><span className="status-badge">{badge}</span> <span className="muted">not an issued registration</span></dd>
                  </div>
                )}
                {format.pattern && (
                  <div>
                    <dt>Pattern</dt>
                    <dd className="mono">{format.pattern}</dd>
                  </div>
                )}
              </dl>
              {(format.description || region.notes) && <Note key={format.id} text={(format.description ?? region.notes)!} />}
              {!!format.references?.length && (
                <div className="insp-sources">
                  <h3>Sources</h3>
                  <ul>
                    {format.references.map((source) => (
                      <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<span aria-hidden="true"> ↗</span></a></li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {(region.id === 'iraq' || region.id === 'iran') && <TypefaceReview key={region.id} country={region.id} />}

            <section className="insp-section export-section">
              <header className="insp-head"><h2>Export</h2></header>
              <div className="btn-row">
                <button className="btn" onClick={() => onExport('png')}><DownloadIcon /> PNG</button>
                <button className="btn" onClick={() => onExport('svg')}><DownloadIcon /> SVG</button>
                <button className="btn" onClick={() => onExport('tesla')} title={TESLA_HINT}><DownloadIcon /> Tesla</button>
                <button className="btn ghost" onClick={onCopyLink}>Copy link</button>
              </div>
              <p className="insp-note small">Tesla: 400×200 PNG (400×100 for long plates). {TESLA_HINT}.</p>
            </section>
          </div>
        </div>
      </aside>
    </>
  );
}
