import type { DieProfile } from './engine';

/** Limited reconstructions for observed runs; these are not complete alphabets. */
export const DECAL_RESIDUAL_LETTERING_PROFILES: DieProfile[] = [
  {
    id: 'bc-decal-print-panel-1983-jun-reconstruction',
    label: '1983 panel JUN · observed-letter reconstruction',
    params: { width: 50, stroke: 0, curve: 'oval', tracking: 0 },
    overrides: {
      J: { advance: 46.8, fill: true, paths: ['M13.5 0 H33 V78 C33 94 25 100 10 100 H0 V83 H8 C12 83 13.5 81 13.5 76 Z'] },
      U: { advance: 66, fill: true, paths: ['M0 0 H19.5 V77 C19.5 83 21.5 86 25 86 C28.5 86 30.5 83 30.5 77 V0 H50 V77 C50 94 41.5 102 25 102 C8.5 102 0 94 0 77 Z'] },
      N: { advance: 53, fill: true, paths: ['M0 0 H22 L34 44 V0 H51 V100 H33 L17 52 V100 H0 Z'] },
    },
    allowConstructedFallback: false, allowResearchReplacement: false,
    evidence: {
      status: 'legend-approximation',
      specimens: [
        { title: '1983 JUN · 85138416 (control tentative)', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/1983-85138416.jpg' },
        { title: '1983 JUL · 86105841', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/1983-86105841.jpg' },
        { title: 'Jerry Woody · July 1983 photograph', url: 'https://commons.wikimedia.org/wiki/File:British_Columbia_Sticker_Decal_July_1983.jpg' },
        { title: '1983 JAN · independent N corroboration', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/1983-JANX.jpg' },
      ],
      notes: 'Independent clean J/U/N constructions and authored advances. Repeated J/U photographs support the narrow stem-and-hook J and narrow U; JAN corroborates N. The primary JUN is only 47–48 pixels tall and the photographs are unrectified, so individual contour and weight precision remain limited. Apply only to the observed JUN selection. No x-only transformation or historical font attribution. See docs/research/bc-decal-residuals/lettering/README.md.',
    },
  },
  {
    id: 'bc-decal-print-thick-1999-may-reconstruction',
    label: '1999 thick-border MAY · observed-letter reconstruction',
    params: { width: 60, stroke: 0, curve: 'oval', tracking: 0 },
    overrides: {
      M: { advance: 75.5, fill: true, paths: ['M0 0 H31 L36.75 39 L42.5 0 H74 V100 H53 V29 L42.5 100 H29.5 L19 29 V100 H0 Z'] },
      A: { advance: 60.5, fill: true, paths: ['M18 0 H41 L57.5 100 H39 L35.5 81 H21.5 L18.5 100 H0 Z M29 22 L23.7 64 H34.9 Z'] },
      Y: { advance: 53, fill: true, paths: ['M0 0 H19.3 L25.5 34 L31.2 0 H51 L35.4 55 V100 H15.6 V55 Z'] },
    },
    allowConstructedFallback: false, allowResearchReplacement: false,
    evidence: {
      status: 'legend-approximation',
      specimens: [
        { title: '1999 thick-border MAY · 54174570', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/1999-thick.jpg' },
        { title: '1999 MAR · 52069021 (M/A corroboration)', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/1999-52069021.jpg' },
        { title: 'Jerry Woody · January 1999 photograph (A corroboration)', url: 'https://commons.wikimedia.org/wiki/File:British_Columbia_Sticker_Decal_January_1999.jpg' },
      ],
      notes: 'Separate authored M/A/Y contours for the observed thick-border 1999 MAY, leaving the 1998 Type II master intact. M/A have independent 1999 photographic corroboration; Y still has only the small MAY photograph, so its detailed shape remains provisional. The M has a shallower central top notch than the 1998 construction. Painted widths are 74/57.5/51 cap units, authored advances 75.5/60.5/53, with AY:-7.5 on the MAY run. No x-only font squeeze or claim of exact historical tooling. See docs/research/bc-decal-residuals/lettering/README.md.',
    },
  },
  {
    id: 'bc-decal-print-solid-2004-year-reconstruction',
    label: '2004 solid decal 04 · observed-digit reconstruction',
    params: { width: 50, stroke: 0, curve: 'oval', tracking: 0 },
    overrides: {
      '0': { advance: 47, fill: true, paths: ['M22.5 -1 C7.5 -1 0 5 0 19 V81 C0 96 7.5 101 22.5 101 C37.5 101 45 96 45 81 V19 C45 5 37.5 -1 22.5 -1 Z M22.5 12 C20 12 19.25 14 19.25 20 V80 C19.25 87 20 89 22.5 89 C25 89 25.75 87 25.75 80 V20 C25.75 14 25 12 22.5 12 Z'] },
      '4': { advance: 55.5, fill: true, paths: ['M21 0 H46 V66 H54 V80 H46 V100 H29 V80 H0 V65 Z M29 20 L12 66 H29 Z'] },
    },
    allowConstructedFallback: false, allowResearchReplacement: false,
    evidence: {
      status: 'legend-approximation',
      specimens: [
        { title: '2004 MAR · 42591320', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2004-42591320.jpg' },
        { title: '2004 JAN · 40724602', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2004-40724602.jpg' },
        { title: '2004 FEB · 41598474 (filename differs)', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2004-41568474.jpg' },
        { title: '2004 JUL · 48794381', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2004-48794381.jpg' },
        { title: '2004 NOV · 64276099', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2004-64276099.jpg' },
        { title: '2004 DEC · 65242308', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2004-65242308.jpg' },
      ],
      notes: 'Only 0/4 are provided. Six photographed month selections support broader 04 proportions than the earlier compressed candidate, a small vertical zero counter and a closed-top 4 with a low crossbar. Clean contours and advances are authored separately; pair adjustment 04:-1.5 controls spacing. Repeated photographs improve proportion confidence but remain small and unrectified. The February image filename says 41568474 while the visible control reads 41598474; no control evidence is inferred from that filename. No historical font identity or manufacturing precision claim. See docs/research/bc-decal-residuals/lettering/README.md.',
    },
  },
];
