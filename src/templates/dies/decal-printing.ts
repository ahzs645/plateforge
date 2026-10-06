import type { DieProfile } from './engine';
import outlines from './decal-printing.json';

/** Filled printed candidates, separate from every stamped serial/legend die. */
export const DECAL_PRINTING_PROFILES: DieProfile[] = Object.entries(outlines).map(([name, glyphs]) => ({
  id: `bc-decal-print-${name}`, label: `Decal printing · ${name}`,
  params: { width: 60, stroke: 0, curve: 'oval', tracking: 0 },
  overrides: glyphs, allowConstructedFallback: false, allowResearchReplacement: false,
  evidence: { status: 'legend-approximation', specimens: [{ title: 'BCpl8s · Passenger renewal decals', url: 'https://www.bcpl8s.ca/Decals.htm' }],
    notes: 'Printed font candidates from supplied Helvetica Compressed and open URW Nimbus outlines. Month/year profiles deliberately narrow the supplied curves to photographed proportions; province/control use separate native outlines. These are visual reconstructions, not confirmed historical typeface or printing tooling. Source hashes and transforms are recorded in docs/research/decal-review/printing-provenance.json. No font software is bundled.' },
}));

DECAL_PRINTING_PROFILES.push({
  id: 'bc-decal-1970', label: '1970 decal · outline numerals',
  params: {width: 75, stroke: 0, curve: 'oval', tracking: 5},
  overrides: {
    '7': {advance:75,fill:true,paths:['M0 0 H72 V18 L29 100 H12 L55 16 H0 Z M5 5 V11 H63 L20 95 H26 L67 17 V5 Z']},
    '0': {advance:77,fill:true,paths:['M38 0 C63 0 75 20 75 50 C75 80 63 100 38 100 C13 100 1 80 1 50 C1 20 13 0 38 0 Z M38 5 C16 5 6 23 6 50 C6 77 16 95 38 95 C60 95 70 77 70 50 C70 23 60 5 38 5 Z M38 16 C53 16 59 29 59 50 C59 71 53 84 38 84 C23 84 17 71 17 50 C17 29 23 16 38 16 Z M38 21 C27 21 22 32 22 50 C22 68 27 79 38 79 C49 79 54 68 54 50 C54 32 49 21 38 21 Z']},
  }, allowResearchReplacement: false, allowConstructedFallback: false,
  evidence: {status:'legend-approximation',specimens:[{title:'1970 passenger decal',url:'https://www.bcpl8s.ca/images/Decals/Passenger/1970.jpg'}],notes:'Clean outlined 70 construction, independently inspected on the small original; not a precise paint trace.'},
});
