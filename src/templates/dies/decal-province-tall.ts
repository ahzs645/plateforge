import type { DieProfile } from './engine';

/** Independently authored only for the twelve capitals in BRITISH / COLUMBIA. */
export const DECAL_PROVINCE_TALL_PROFILE: DieProfile = {
  id: 'bc-decal-print-province-tall-2010-reconstruction',
  label: '2010–13 decal province · observed tall capitals',
  params: { width: 54, stroke: 0, curve: 'oval', tracking: 0 },
  overrides: {
    A: { advance: 67, fill: true, paths: ['M0 100 L21 0 H37 L59 100 H45 L41 79 H17 L13 100 Z M20 65 H38 L29 23 Z'] },
    B: { advance: 61, fill: true, paths: ['M0 0 H29 C45 0 52 9 52 26 C52 39 47 46 41 49 C49 53 54 61 54 75 C54 92 46 100 29 100 H0 Z M13 14 V42 H27 C36 42 39 38 39 28 C39 18 36 14 27 14 Z M13 56 V86 H28 C37 86 41 82 41 71 C41 61 37 56 28 56 Z'] },
    C: { advance: 61, fill: true, paths: ['M54 23 L41 27 C38 16 34 12 27 12 C18 12 13 25 13 50 C13 75 18 88 27 88 C34 88 39 82 41 71 L54 75 C50 93 42 101 27 101 C9 101 0 82 0 50 C0 18 9 -1 27 -1 C42 -1 50 8 54 23 Z'] },
    H: { advance: 62, fill: true, paths: ['M0 0 H13 V42 H41 V0 H54 V100 H41 V57 H13 V100 H0 Z'] },
    I: { advance: 23, fill: true, paths: ['M0 0 H17 V100 H0 Z'] },
    L: { advance: 53, fill: true, paths: ['M0 0 H13 V86 H46 V100 H0 Z'] },
    M: { advance: 72, fill: true, paths: ['M0 100 V0 H17 L32.5 64 L48 0 H65 V100 H52 V33 L38 100 H27 L13 33 V100 Z'] },
    O: { advance: 66, fill: true, paths: ['M29 -1 C49 -1 58 17 58 50 C58 83 49 101 29 101 C9 101 0 83 0 50 C0 17 9 -1 29 -1 Z M29 12 C18 12 13 25 13 50 C13 75 18 88 29 88 C40 88 45 75 45 50 C45 25 40 12 29 12 Z'] },
    R: { advance: 61, fill: true, paths: ['M0 100 V0 H30 C46 0 53 8 53 29 C53 42 48 50 41 54 C48 57 50 65 51 79 L54 100 H40 L37 75 C36 66 33 63 27 63 H13 V100 Z M13 14 V49 H27 C37 49 40 43 40 31 C40 19 37 14 27 14 Z'] },
    S: { advance: 59, fill: true, paths: ['M51 25 L38 29 C37 17 33 12 26 12 C18 12 14 18 14 27 C14 37 18 41 29 45 C44 50 52 57 52 74 C52 92 43 101 26 101 C9 101 1 90 0 73 L13 69 C14 82 18 88 27 88 C35 88 39 83 39 74 C39 65 34 61 24 57 C8 51 1 44 1 28 C1 10 10 -1 26 -1 C42 -1 49 9 51 25 Z'] },
    T: { advance: 55, fill: true, paths: ['M0 0 H52 V14 H33 V100 H19 V14 H0 Z'] },
    U: { advance: 61, fill: true, paths: ['M0 0 H13 V69 C13 83 17 88 26.5 88 C36 88 40 83 40 69 V0 H53 V70 C53 91 45 101 26.5 101 C8 101 0 91 0 70 Z'] },
  },
  allowConstructedFallback: false,
  allowResearchReplacement: false,
  evidence: {
    status: 'legend-approximation',
    specimens: [
      { title: '2012 AUG decal · PartColumbia, CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:ICBC_Aug_2012_Registration_Decal.png' },
      { title: '2010 JAN decal · BCpl8s', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2010.jpg' },
      { title: '2012 NOV decal · BCpl8s', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2012.jpg' },
    ],
    notes: 'Clean independent contours for the fixed province words, authored from the 1825×763 2012 photograph. The individual capitals are about 103–107 pixels high; repeated B and I occurrences constrain width and weight. Rounded C/O bowls, the short curved R leg, tall narrow B and broad M are kept distinct from a generic condensed font. Original photographic tilt is retained in comparison figures; no existing font is squeezed. Fine print spread and historical typeface identity remain unconfirmed. Application is limited to the corroborated 2010–13 province subset; no modern vertical legend generalization.',
  },
};
