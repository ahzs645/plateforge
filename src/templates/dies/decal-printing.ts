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
    notes: 'Printed font candidates from supplied Helvetica Compressed and open URW Nimbus outlines. Month/year profiles deliberately narrow the supplied curves to photographed proportions; province/control use separate native outlines. These are visual reconstructions, not confirmed historical typeface or printing tooling. Source hashes and transforms are recorded in docs/research/decal-review/printing-provenance.json. Additional native Barlow Condensed candidates and their hashes are recorded in docs/research/decal-typography/printing-provenance.json. Native Oswald, Anton, Roboto Condensed and Archivo Narrow candidates selected by occurrence overlays are documented in docs/research/decal-glyph-analysis/candidate-provenance.json. Additional online sources, native width-axis Archivo candidates, squared Orbitron candidates and the explicitly reconstructed 1986 M/A are documented in docs/research/decal-online-analysis. No font software is bundled.' },
}));

DECAL_PRINTING_PROFILES.push({
  id: 'bc-decal-1970', label: '1970 decal · outline numerals',
  params: {width: 75, stroke: 0, curve: 'oval', tracking: 5},
  overrides: {
    '7': {advance:75,fill:true,paths:['M0 0 H72 V18 L29 100 H12 L55 16 H0 Z M7 7 V9 H66 L23 93 H25 L65 16 V7 Z']},
    '0': {advance:102,fill:true,paths:['M51 0 A50 50 0 1 1 51 100 A50 50 0 1 1 51 0 Z M51 7.5 A42.5 42.5 0 1 0 51 92.5 A42.5 42.5 0 1 0 51 7.5 Z M51 25 A25 25 0 1 1 51 75 A25 25 0 1 1 51 25 Z M51 32 A18 18 0 1 0 51 68 A18 18 0 1 0 51 32 Z']},
  }, allowResearchReplacement: false, allowConstructedFallback: false,
  evidence: {status:'legend-approximation',specimens:[{title:'1970 passenger decal',url:'https://www.bcpl8s.ca/images/Decals/Passenger/1970.jpg'}],notes:'Clean outlined 70 construction, independently inspected on the small original; not a precise paint trace.'},
});

/** Preserve main's narrow month construction; increase paint weight independently. */
DECAL_PRINTING_PROFILES.push({
  id:'bc-decal-print-heavy-month-weighted',label:'Modern decal month · retained narrow outlines, heavier print',
  params:{width:60,stroke:0,curve:'oval',tracking:0},overrides:outlines['heavy-month'],
  filledStroke:2.5,allowConstructedFallback:false,allowResearchReplacement:false,
  evidence:{status:'legend-approximation',specimens:[{title:'2014 passenger decal',url:'https://www.bcpl8s.ca/images/Decals/Passenger/2014-99103688.jpg'}],
    notes:'Retains the main compressed-month paths and advances. A 2.5-cap-unit same-ink stroke increases print weight without widening glyph construction or shrinking the run to accommodate a broader face. Source construction and supplied-font provenance remain in docs/research/decal-review/printing-provenance.json; historical font identity remains unconfirmed.'},
});
