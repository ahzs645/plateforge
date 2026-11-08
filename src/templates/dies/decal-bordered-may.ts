import type { DieProfile } from './engine';

/** Exact-MAY candidate: do not silently apply these forms to other month runs. */
export const DECAL_BORDERED_MAY_PROFILE: DieProfile = {
  id: 'bc-decal-print-bordered-may-reconstruction',
  label: 'Bordered decal MAY · specimen construction',
  params: { width: 65, stroke: 0, curve: 'oval', tracking: 0 },
  overrides: {
    M: { advance: 82.5, fill: true, paths: ['M0 0 H27 L39.75 65 L52.5 0 H79.5 V100 H60 V29 L46 100 H33.5 L19.5 29 V100 H0 Z'] },
    A: { advance: 65, fill: true, paths: ['M23 0 H40 L62.5 100 H43.5 L40 80 H22.5 L18.5 100 H0 Z M31.5 21 L25 63 H38 Z'] },
    Y: { advance: 62, fill: true, paths: ['M0 0 H19.5 L29.75 36 L40 0 H59.5 L39 56 V100 H20.5 V56 Z'] },
  },
  allowConstructedFallback: false, allowResearchReplacement: false,
  evidence: {
    status: 'legend-approximation',
    specimens: [
      { title: '1998 Type II MAY decal', url: 'https://www.bcpl8s.ca/Decals.htm' },
      { title: '1999 thick-border MAY · 54174570', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/1999-thick.jpg' },
    ],
    notes: 'Independent straight-sided M/A/Y reconstructions from the issued MAY examples. Authored glyph widths are approximately 79.5/62.5/59.5 cap units; the 1998 source supports A/Y box overlap of about 11.6 cap units. Use run kerning AY:-14 with the authored advances. Only the exact MAY selection for 1998 Type II and thick-border 1999 is supported; other months retain their prior profiles. No horizontal font squeeze or historical font identification. See docs/research/bc-modern-numerals/bordered-may.md.',
  },
};
