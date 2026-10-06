import type { DieProfile } from './engine';
import outlines from './decal-printing.json';
import auditOutlines from './decal-audit-printing.json';
import glyphOutlines from './decal-glyph-printing.json';

/** Filled printed candidates, separate from every stamped serial/legend die. */
export const DECAL_PRINTING_PROFILES: DieProfile[] = Object.entries({...outlines, ...auditOutlines, ...glyphOutlines}).map(([name, glyphs]) => ({
  id: `bc-decal-print-${name}`, label: `Decal printing · ${name}`,
  params: { width: 60, stroke: 0, curve: 'oval', tracking: 0 },
  overrides: glyphs, allowConstructedFallback: false, allowResearchReplacement: false,
  evidence: { status: 'legend-approximation', specimens: [{ title: 'BCpl8s · Passenger renewal decals', url: 'https://www.bcpl8s.ca/Decals.htm' }],
    notes: 'Printed font candidates from supplied Helvetica Compressed and open URW Nimbus outlines. Month/year profiles deliberately narrow the supplied curves to photographed proportions; province/control use separate native outlines. These are visual reconstructions, not confirmed historical typeface or printing tooling. Source hashes and transforms are recorded in docs/research/decal-review/printing-provenance.json. Additional native Barlow Condensed candidates and their hashes are recorded in docs/research/decal-typography/printing-provenance.json. Native Oswald, Anton, Roboto Condensed and Archivo Narrow candidates selected by occurrence overlays are documented in docs/research/decal-glyph-analysis/candidate-provenance.json. No font software is bundled.' },
}));

DECAL_PRINTING_PROFILES.push({
  id: 'bc-decal-1970', label: '1970 decal · outline numerals',
  params: {width: 75, stroke: 0, curve: 'oval', tracking: 5},
  overrides: {
    '7': {advance:75,fill:true,paths:['M0 0 H72 V18 L29 100 H12 L55 16 H0 Z M5 5 V11 H63 L20 95 H26 L67 17 V5 Z']},
    '0': {advance:102,fill:true,paths:['M51 0 A50 50 0 1 1 51 100 A50 50 0 1 1 51 0 Z M51 5 A45 45 0 1 0 51 95 A45 45 0 1 0 51 5 Z M51 25 A25 25 0 1 1 51 75 A25 25 0 1 1 51 25 Z M51 30 A20 20 0 1 0 51 70 A20 20 0 1 0 51 30 Z']},
  }, allowResearchReplacement: false, allowConstructedFallback: false,
  evidence: {status:'legend-approximation',specimens:[{title:'1970 passenger decal',url:'https://www.bcpl8s.ca/images/Decals/Passenger/1970.jpg'}],notes:'Clean outlined 70 construction, independently inspected on the small original; not a precise paint trace.'},
});
