import { LetteringPicker } from './LetteringPicker';
import type { Parts, PlateFormat, Region } from '../core/types';
import { AlertIcon, CheckIcon, DownloadIcon } from './icons';

interface Props {
  region: Region;
  format: PlateFormat;
  parts: Parts;
  onChange(parts: Parts): void;
  onExport(kind: 'png' | 'svg'): void;
  onCopyLink(): void;
}

/** Right-hand panel: editable parts generated from the format's fields, format facts, export. */
export function Inspector({ region, format, parts, onChange, onExport, onCopyLink }: Props) {
  const error = format.validate?.(parts) ?? null;

  return (
    <aside className="inspector" aria-label="Plate details">
      <section className="insp-section">
        <header className="insp-head">
          <h2>Serial</h2>
          <span className={`status ${error ? 'bad' : 'ok'}`} role="status">
            {error ? <AlertIcon /> : <CheckIcon />}
            {error ? 'Invalid' : 'Valid'}
          </span>
        </header>
        <div className="fields">
          {format.fields.map((field) => {
            if (field.key === 'lettering') return (
              <LetteringPicker key={field.key} field={field} value={parts.lettering ?? 'default'}
                onChange={(lettering) => onChange({ ...parts, lettering })} />
            );
            const id = `field-${field.key}`;
            const wide = !field.options && (field.maxLength ?? 12) > 6 && format.fields.length > 1;
            return (
              <div key={field.key} className={`field ${wide ? 'wide' : ''}`}>
                <label htmlFor={id}>{field.label}</label>
                {field.options ? (
                  <div className="select">
                    <select id={id} value={parts[field.key] ?? ''} onChange={(e) => onChange({ ...parts, [field.key]: e.target.value })}>
                      {field.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
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
                )}
              </div>
            );
          })}
        </div>
        {error && <p className="field-error">{error}</p>}
      </section>

      <section className="insp-section">
        <header className="insp-head">
          <h2>Format</h2>
        </header>
        <dl className="facts">
          <div>
            <dt>Region</dt>
            <dd>
              {region.name} <span className="muted">· {region.code}</span>
            </dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{format.label}</dd>
          </div>
          {format.pattern && (
            <div>
              <dt>Pattern</dt>
              <dd className="mono">{format.pattern}</dd>
            </div>
          )}
        </dl>
        {(format.description || region.notes) && (
          <p className="insp-note">{format.description ?? region.notes}</p>
        )}
        {format.references?.map((source) => (
          <p className="insp-note" key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
          </p>
        ))}
      </section>

      <section className="insp-section export-section">
        <header className="insp-head">
          <h2>Export</h2>
        </header>
        <div className="btn-row">
          <button className="btn" onClick={() => onExport('png')}>
            <DownloadIcon /> PNG
          </button>
          <button className="btn" onClick={() => onExport('svg')}>
            <DownloadIcon /> SVG
          </button>
          <button className="btn" onClick={onCopyLink}>
            Copy link
          </button>
        </div>
      </section>
    </aside>
  );
}
