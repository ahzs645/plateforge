import { useState } from 'react';

/** Raster-only comparison. These controls do not silently change a production die profile. */
const CASES = {
  iraq: [
    { id: 'iraq-964', label: 'KRG · 22 C 79770', candidates: ['original', 'euro'],
      note: '964media photograph, 2023. C is partly occluded and excluded from the score. Reference positions are held fixed; this is a glyph-shape study, not a whole-plate layout certification.' },
  ],
  iran: [
    { id: 'iran-flat', label: 'Public · flat specimen', candidates: ['original', 'irplate', 'roya'],
      note: 'Dickelbers, 2015 · CC BY-SA 4.0. Cropped and rectified. The flat and embossed photographs share a serial and collection; they are not independent validation samples.' },
    { id: 'iran-embossed', label: 'Public · embossed specimen', candidates: ['original', 'irplate', 'roya'],
      note: 'Dickelbers, 2015 · CC BY-SA 4.0. Cropped and rectified. The photographed ۴ and ۷ differ in width from the unmodified font candidates.' },
    { id: 'iran-heh', label: 'Private · contextual هـ', candidates: ['original', 'irplate', 'roya', 'roya-plate-form'],
      note: 'MohsenKalali, 2018 · CC BY-SA 4.0. Independent 346 × 81 photograph, enlarged. Compares isolated ه against the plate form هـ; do not treat the enlargement as precision die evidence.' },
  ],
} as const;
const LABELS: Record<string, string> = {
  original: 'Original geometric glyphs', euro: 'Existing EuroPlate',
  irplate: 'IR Plate', roya: 'B Roya Bold · isolated heh', 'roya-plate-form': 'B Roya Bold · plate heh',
};
export function TypefaceReview({ country }: { country: keyof typeof CASES }) {
  const [caseIndex, setCaseIndex] = useState(0);
  const [candidate, setCandidate] = useState('original');
  const [opacity, setOpacity] = useState(50);
  const [failed, setFailed] = useState(false);
  const item = CASES[country][caseIndex] ?? CASES[country][0];
  const active = (item.candidates as readonly string[]).includes(candidate) ? candidate : 'original';
  const base = `${import.meta.env.BASE_URL}typography-review/`;
  return <section className="insp-section" aria-label="Typography reference comparison">
    <header className="insp-head"><h2>Typography comparison</h2></header>
    <p className="insp-note">Photographed specimens versus actual candidate-font renders. These review controls do not change the generated plate or certify an official typeface.</p>
    <details>
      <summary style={{ cursor: 'pointer', marginBottom: 12 }}>Compare shapes with a reference</summary>
      <div className="fields">
        <div className="field wide"><label htmlFor="typeface-reference">Reference</label>
          <div className="select"><select id="typeface-reference" value={caseIndex} onChange={(e) => { setCaseIndex(Number(e.target.value)); setCandidate('original'); setFailed(false); }}>
            {CASES[country].map((c, i) => <option key={c.id} value={i}>{c.label}</option>)}
          </select></div>
        </div>
        <div className="field wide"><label htmlFor="typeface-candidate">Candidate</label>
          <div className="select"><select id="typeface-candidate" value={active} onChange={(e) => setCandidate(e.target.value)}>
            {item.candidates.map((c) => <option key={c} value={c}>{LABELS[c]}</option>)}
          </select></div>
        </div>
      </div>
      <div style={{ position: 'relative', aspectRatio: '1040 / 220', background: '#fff', isolation: 'isolate', marginTop: 14 }}>
        <img src={`${base}${item.id}-reference.png`} alt={`${item.label}: rectified reference photograph`} loading="lazy" onError={() => setFailed(true)} style={{ display: 'block', width: '100%' }} />
        <img src={`${base}${item.id}-${active}.png`} alt={`${LABELS[active]} at the reference character positions`} loading="lazy" onError={() => setFailed(true)} style={{ position: 'absolute', inset: 0, width: '100%', opacity: opacity / 100, mixBlendMode: 'multiply' }} />
      </div>
      <label htmlFor="typeface-opacity" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>Candidate opacity · {opacity}%</label>
      <input id="typeface-opacity" type="range" min="0" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} style={{ width: '100%' }} />
      {failed && <p role="alert" className="field-error">The comparison images could not be loaded. Open the full report or rebuild the typography study.</p>}
      <p className="insp-note">{item.note}</p>
    </details>
    <p className="insp-note"><a href={`${base}index.html`} target="_blank" rel="noreferrer">Open full-size comparisons, measurements and source credits ↗</a></p>
    <p className="insp-note"><a href={`${base}offline.html`} download="plateforge-typography-comparison.html">Save the standalone comparison report</a></p>
  </section>;
}
