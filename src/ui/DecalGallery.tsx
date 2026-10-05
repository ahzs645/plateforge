import { useState } from 'react';
import type { Parts, Plate } from '../core/types';
import { applyDecal, canApplyDecal, filterProvinceDecals, provinceDecals } from '../library/province-decals';
import { BC_DECAL_SOURCE, decalId } from '../regions/canada/bc-decals';
import { decalArt } from '../regions/canada/bc-kit';
import { buildDecal } from '../templates/bc/decal';
import { SvgScene } from '../templates/SvgScene';
import { PlateView } from './PlateView';
import './decal-gallery.css';

interface Props {
  plate: Plate;
  onChange(parts: Parts): void;
  onBack(): void;
}

export function DecalGallery({ plate, onChange, onBack }: Props) {
  const [query, setQuery] = useState('');
  const [compatibleOnly, setCompatibleOnly] = useState(false);
  const { region, format, parts } = plate;
  const supportsDecals = !!format.fields.find(field => field.key === 'decal')?.options?.length;
  const decals = filterProvinceDecals(region.id, format, query, compatibleOnly && supportsDecals);
  const selected = provinceDecals(region.id).find(decal => decalId(decal) === parts.decal);
  const selectedLabel = selected ? `${selected.year}${selected.variant ? ` · ${selected.variant}` : ''}` : 'Empty well';
  const month = format.fields.find(field => field.key === 'decalMonth');
  return <section className="decal-gallery" aria-label={`${region.name} decal gallery`}>
    <header className="decal-gallery-head">
      <div><p className="gallery-eyebrow">{region.country} / {region.name}</p><h1>{region.name} decals</h1>
        <p>Passenger renewal decals · 1970–2023. Browse the imported years and colour variants, or apply a supported choice to your current plate.</p></div>
      <button className="btn" onClick={onBack}>Back to current plate</button>
    </header>
    <div className="decal-gallery-layout">
      <aside className="decal-current">
        <h2>Current plate</h2><p>{format.label}</p>
        <PlateView plate={plate} className="decal-current-plate" />
        <p className="mono">{plate.text}</p>
        {supportsDecals ? <>
          <p role="status" aria-live="polite">Renewal decal: {selectedLabel}</p>
          {month?.options && <label className="field">Decal month<select aria-label="Gallery decal month" value={parts.decalMonth ?? 'JAN'} onChange={event => onChange({ ...parts, decalMonth: event.target.value })}>
            {month.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select></label>}
          <button className="btn" onClick={() => onChange({ ...parts, decal: 'blank' })} disabled={parts.decal === 'blank'}>Clear decal</button>
        </> : <p>This plate has no passenger renewal decal choices. You can browse the references here.</p>}
      </aside>
      <div className="decal-gallery-results">
        <div className="decal-gallery-filters">
          <label className="field">Find a decal<input aria-label="Find a decal" value={query} onChange={event => setQuery(event.target.value)} placeholder="Year, colour or variant…" /></label>
          {supportsDecals && <label className="decal-gallery-checkbox"><input type="checkbox" checked={compatibleOnly} onChange={event => setCompatibleOnly(event.target.checked)} />Choices for this plate</label>}
        </div>
        <p role="status">{decals.length} of {provinceDecals(region.id).length} decal references</p>
        <p className="decal-gallery-note">Previews use the same approximate artwork as the plate renderer; control numbers are illustrative. Open the original photograph to check lettering and colour. Decal years describe renewals, not the plate’s manufacture date. <a href={BC_DECAL_SOURCE.url} target="_blank" rel="noreferrer">BCpl8s sources ↗</a></p>
        <div className="decal-gallery-grid">
          {decals.map(decal => {
            const id = decalId(decal);
            const art = decalArt(decal, parts);
            const available = canApplyDecal(format, decal);
            return <article key={id} className="decal-card" data-decal-id={id} data-selected={parts.decal === id}>
              <div className="decal-card-art"><svg viewBox={`0 0 ${art.aspect * 40} 40`} role="img" aria-label={`${decal.year}${decal.variant ? ` ${decal.variant}` : ''} decal reconstruction`}><SvgScene node={buildDecal(art, { x: 0, y: 0, width: art.aspect * 40, height: 40 })} /></svg></div>
              <h2>{decal.year}{decal.variant && <span> · {decal.variant}</span>}</h2>
              <p>{decal.colours}</p><p className="decal-gallery-note">{decal.style} layout · approximate</p>
              <a href={decal.image} target="_blank" rel="noreferrer">Original decal photograph ↗</a>
              <button className="btn" disabled={!available || parts.decal === id} onClick={() => onChange(applyDecal(format, parts, decal))}>
                {available ? parts.decal === id ? 'Applied to current plate' : 'Apply to current plate' : 'Outside this plate’s choices'}
              </button>
            </article>;
          })}
        </div>
        {!decals.length && <p>No decals match. Try a different year or clear the filter.</p>}
      </div>
    </div>
  </section>;
}
