import { useEffect, useState } from 'react';
import type { Parts, PlateFormat, Region } from '../core/types';
import { templateFor } from '../core/registry';
import { availableFontAssets } from '../templates/fonts';
import { inspectSvgTypography, type SvgTypographyInspection } from './font-inspection';
import { usePlateFontsVersion } from './font-loading';
import { useResearchDiesVersion } from './ResearchDiesToggle';

/** A rendering identity is not a historical authenticity rating. */
export const TYPOGRAPHY_NOTES: Record<string, string> = {
  'bc-historical': 'Source-guided, constructed and research-overlay lettering coexist. Each marked glyph keeps its own provenance; an outline is not automatically an observed or authenticated die.',
  ca: 'Provincial source-specific artwork is independent of generic serial and label substitutes. Portable Noto/Pinyon text does not identify a historic production font.',
  us: 'Serial and general-purpose inscription substitutes are portable. Procedural styles describe constructions, not authenticated state die alphabets.',
  eu: 'The shared EuroPlate/UKNumberPlate choices are approximations across countries. Their recorded versions do not establish country-by-country authenticity or deployment permission.',
  mercosur: 'EuroPlate, UKNumberPlate and general-purpose text remain separately identified approximations. A shared regional layout is not evidence of identical national lettering.',
  cn: 'Noto Sans SC and Barlow are portable, box-fitted substitutes. They are not the GA 36 manufacturing alphabet.',
  jp: 'Japanese labels use pinned Noto Sans JP, separately from Chinese forms; numerals use Barlow. These are substitutes, not an identified Japanese plate die.',
  kr: 'Hangul uses pinned Noto Sans KR; numerals and KOR use the recorded Barlow weights. These are not the official plate alphabet.',
  vn: 'Barlow is a portable substitute, not an authenticated Vietnamese manufacturing font.',
  cr: 'Barlow is a portable substitute, not an authenticated Costa Rican manufacturing font.',
  standin: 'Antonio overlays third-party raster artwork. Baked-in lettering is not editable font coverage, and SVG export does not turn the background into vector paths.',
  'iq-flat': 'Source-observed subsets, explicit candidates and missing-glyph policy remain separate. Profile reuse rights are stated below; technical export success does not clear those rights.',
  ir: 'Main figures, contextual roles and joined words retain their source profiles. Inferred numerals remain inferred even when strict coverage permits them.',
};

export function TypographyCoverage({ region, format, parts }: { region: Region; format: PlateFormat; parts: Parts }) {
  const fontVersion = usePlateFontsVersion(), researchVersion = useResearchDiesVersion();
  const template = templateFor(region, format);
  const key = JSON.stringify([region.id, format.id, parts]);
  const [value, setValue] = useState<{ key: string; inspection: SvgTypographyInspection } | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const svg = document.querySelector<SVGSVGElement>('.plate-preview svg');
      if (svg) setValue({ key, inspection: inspectSvgTypography(svg, availableFontAssets(template.fonts)) });
    });
    return () => cancelAnimationFrame(frame);
  }, [key, template, fontVersion, researchVersion]);
  const inspection = value?.key === key ? value.inspection : null;
  const families = [...new Map(inspection?.faces.map((font) => [JSON.stringify([font.family, font.weight, font.style, font.sourceVersion]), font]) ?? []).values()];
  return <section className="insp-section typography-coverage" aria-label="Typography identity and export">
    <header className="insp-head"><h2>Typography identity</h2></header>
    <p className="insp-note small">{TYPOGRAPHY_NOTES[template.id] ?? 'This template has no typography classification. Inspect its sources before claiming fidelity.'}</p>
    {!inspection ? <p className="insp-note small">Inspecting rendered lettering…</p> : <>
      <p className="insp-note small">{inspection.liveRuns ? `${inspection.liveRuns} live-text runs · ${inspection.faces.length} matched bundled subsets` : 'No live-text runs: lettering is outlined or baked into artwork. No live-text font embedding is required.'}</p>
      <details className="coverage-details">
        <summary>Versions, source profiles and substitutions</summary>
        {families.map((font) => <div className="typography-family" key={JSON.stringify([font.family, font.weight, font.style, font.sourceVersion])}>
          <strong>{font.family} · {font.weight ?? 400} · {font.style ?? 'normal'}</strong>
          <p className="insp-note small">{font.sourceVersion ?? 'Internal font version not recorded'}</p>
          <p className="insp-note small">{font.license?.label ?? 'Permission not recorded'}</p>
        </div>)}
        {!!inspection.profileIds.length && <p className="insp-note small typography-ids">Outline profiles: {inspection.profileIds.join(', ')}</p>}
        {!!inspection.researchUnits.length && <p className="insp-note small typography-ids">Research units: {inspection.researchUnits.join(', ')}</p>}
        {Object.entries(inspection.glyphKinds).map(([kind, count]) => <p key={kind} className="insp-note small">{kind}: {count} marked outline groups</p>)}
        <p className="insp-note small">SVG metadata records selected binary versions and hashes, source-unit IDs, substitutions and rights notices. Hash verification identifies files, not historical tooling.</p>
      </details>
      {!!inspection.warnings.length && <details className="coverage-details"><summary>{inspection.warnings.length} font / export notices</summary><ul className="coverage-notices">{inspection.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details>}
    </>}
  </section>;
}
