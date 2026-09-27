import type { FieldDef } from '../core/types';
import { LETTERING_TYPES, LETTERING_NOTE, LETTERING_SCOPE_NOTE } from '../core/lettering';
import { buildLettering } from '../templates/lettering';
import { SvgScene } from '../templates/SvgScene';
import './lettering.css';

interface Props { field: FieldDef; value: string; onChange(value: string): void }
export function LetteringPicker({ field, value, onChange }: Props) {
  const selected = LETTERING_TYPES.find((type) => type.id === value);
  return (
    <div className="field wide lettering-picker">
      <label htmlFor="field-lettering">{field.label}</label>
      <div className="select">
        <select id="field-lettering" value={value} onChange={(event) => onChange(event.target.value)} aria-describedby="lettering-status">
          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      <p className="insp-note" id="lettering-status" aria-live="polite">
        {value === 'die' ? 'Serial and legends drawn from die profiles reconstructed for this period and maker (vector paths, never stretched). See the B.C. die library notes.'
          : selected ? `${selected.description} Vector serial; category-inspired, not an exact die.` : 'Existing template font. Serial exports as editable text.'}
      </p>
      <details className="lettering-comparison">
        <summary>Compare the four construction types</summary>
        <div className="lettering-grid">
          {LETTERING_TYPES.map((type) => (
            <button type="button" key={type.id} className="lettering-card" aria-pressed={value === type.id}
              aria-label={`Use ${type.label} lettering`} onClick={() => onChange(type.id)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 104" aria-hidden="true">
                <SvgScene node={buildLettering({ text: 'BOD 2689', type: type.id, centerX: 140, baseline: 94, height: 86, maxWidth: 264, ink: 'currentColor' })} />
              </svg>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
        <p className="insp-note">{LETTERING_NOTE}</p>
        <p className="insp-note">{LETTERING_SCOPE_NOTE}</p>
      </details>
    </div>
  );
}
