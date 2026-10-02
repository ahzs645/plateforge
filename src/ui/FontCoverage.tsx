import { useMemo } from 'react';
import type { Parts, PlateFormat } from '../core/types';
import { IRAQ_FONT_PROFILES, IRAQ_WORDMARKS } from '../templates/iraq-custom-fonts';
import { iraqCustomStateFromParts, renderIraqCustom } from '../templates/iraq-custom-scene';
import { IRAN_FONT_PROFILES, IRAN_WORDMARKS } from '../templates/iran-custom-fonts';
import { renderIranCustom } from '../templates/iran-custom-scene';
import { iranStateForPlate } from '../templates/iran-region-bridge';

const PROVENANCE: Record<string, string> = {
  observed: 'Observed source outlines', inferred: 'Inferred numeral completion', candidate: 'Candidate reconstruction',
  fallback: 'Fallback outlines', unsupported: 'Unsupported',
};

interface Coverage {
  label: string; provenance: string; policy: string; glyphs: string[]; words: { id: string; label: string; text: string }[];
  roles?: number; notes: string[]; warnings: string[]; rights: string; sourceUrl?: string;
}

/** Inspector section: the selected font profile, what it covers, and the live scene's notices. */
function FontCoverage({ coverage: c }: { coverage: Coverage }) {
  return (
    <section className="insp-section coverage-section" aria-label="Source and font coverage">
      <header className="insp-head"><h2>Source &amp; font coverage</h2></header>
      <p className="coverage-profile"><strong>{c.label}</strong> <span className="status-badge">{PROVENANCE[c.provenance] ?? c.provenance}</span></p>
      <p className="insp-note small">{c.policy === 'strict' ? 'Strict: missing shapes are boxed and the plate is marked invalid.' : 'Fallback enabled: missing shapes use labelled substitute outlines.'}</p>
      <details className="coverage-details">
        <summary>Glyphs · {c.glyphs.length} characters, {c.words.length} whole words{c.roles ? `, ${c.roles} layout-role sets` : ''}</summary>
        <div className="coverage-glyphs" aria-label="Available glyphs">{c.glyphs.map((g, i) => <span key={`${g}-${i}`} dir="auto">{g}</span>)}</div>
        {c.words.length > 0 && <ul className="coverage-words">{c.words.map((w) => <li key={w.id}><span>{w.label}</span><span dir="rtl">{w.text}</span></li>)}</ul>}
        {c.notes.map((note, i) => <p key={i} className="insp-note small">{note}</p>)}
      </details>
      {c.warnings.length > 0 && <details className="coverage-details">
        <summary>{c.warnings.length} source / rendering {c.warnings.length === 1 ? 'notice' : 'notices'}</summary>
        <ul className="coverage-notices">{c.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
      </details>}
      <p className="insp-note small"><strong>Use &amp; provenance:</strong> {c.rights}{c.sourceUrl && <> <a href={c.sourceUrl} target="_blank" rel="noreferrer">Profile source ↗</a></>}</p>
    </section>
  );
}

export function IraqCoverage({ format, parts }: { format: PlateFormat; parts: Parts }) {
  const presetId = String(format.design?.presetId ?? format.id);
  const coverage = useMemo((): Coverage | null => {
    const state = iraqCustomStateFromParts(presetId, parts);
    const profile = Object.values(IRAQ_FONT_PROFILES).find((p) => p.id === state.fontProfile);
    if (!profile) return null;
    return {
      label: profile.label, provenance: profile.provenance, policy: state.missingPolicy,
      glyphs: Array.from(profile.coverage).filter((g) => g.trim()),
      words: Object.entries(profile.wordmarks).map(([id, w]) => ({ id, label: IRAQ_WORDMARKS[id]?.label ?? id, text: w.text })),
      notes: profile.notes, warnings: renderIraqCustom(state).warnings, rights: profile.rights, sourceUrl: profile.sourceUrl,
    };
  }, [presetId, parts]);
  return coverage && <FontCoverage coverage={coverage} />;
}

export function IranCoverage({ format, parts }: { format: PlateFormat; parts: Parts }) {
  const coverage = useMemo((): Coverage | null => {
    const state = iranStateForPlate(format.design ?? {}, parts);
    const profile = state && IRAN_FONT_PROFILES[state.fontProfile];
    if (!state || !profile) return null;
    return {
      label: profile.label, provenance: profile.provenance, policy: state.missingPolicy,
      glyphs: Object.keys(profile.glyphs), roles: Object.keys(profile.roles ?? {}).length,
      words: Object.entries(profile.wordmarks).map(([id, w]) => ({ id, label: IRAN_WORDMARKS[id]?.label ?? id, text: w.text })),
      notes: profile.notes, warnings: renderIranCustom(state).warnings, rights: profile.rights, sourceUrl: profile.sourceUrl,
    };
  }, [format, parts]);
  return coverage && <FontCoverage coverage={coverage} />;
}
