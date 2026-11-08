import type { DieProfile } from './engine';

/** Only the twelve distinct capitals observed in the 1981/82 province words. */
export const DECAL_PROVINCE_WIDE_PROFILE: DieProfile = {
  id: 'bc-decal-print-province-wide-1981-reconstruction',
  label: '1981–82 decal province · observed wide capitals',
  params: { width: 120, stroke: 0, curve: 'oval', tracking: 0 },
  overrides: {
    A: { advance: 140, fill: true, paths: ['M0 100 L45 0 H80 L125 100 H94 L86 79 H39 L31 100 Z M47 57 H78 L62.5 25 Z'] },
    B: { advance: 135, fill: true, paths: ['M0 0 H89 Q119 0 119 25 Q119 42 108 48 Q120 55 120 75 Q120 100 90 100 H0 Z M28 22 V42 H83 Q91 42 91 32 Q91 22 83 22 Z M28 60 V78 H84 Q93 78 93 69 Q93 60 84 60 Z'] },
    C: { advance: 134, fill: true, paths: ['M119 30 H91 Q89 24 81 24 H38 Q28 24 28 34 V66 Q28 76 38 76 H81 Q90 76 91 67 H119 Q118 100 85 100 H33 Q0 100 0 67 V33 Q0 0 33 0 H85 Q118 0 119 30 Z'] },
    H: { advance: 137, fill: true, paths: ['M0 0 H28 V39 H94 V0 H122 V100 H94 V61 H28 V100 H0 Z'] },
    I: { advance: 49, fill: true, paths: ['M0 0 H34 V100 H0 Z'] },
    L: { advance: 106, fill: true, paths: ['M0 0 H28 V76 H91 V100 H0 Z'] },
    M: { advance: 171, fill: true, paths: ['M0 100 V0 H42 L78 63 L114 0 H156 V100 H128 V39 L92 100 H64 L28 39 V100 Z'] },
    O: { advance: 140, fill: true, paths: ['M34 0 H91 Q125 0 125 33 V67 Q125 100 91 100 H34 Q0 100 0 67 V33 Q0 0 34 0 Z M39 24 Q28 24 28 35 V65 Q28 76 39 76 H86 Q97 76 97 65 V35 Q97 24 86 24 Z'] },
    R: { advance: 135, fill: true, paths: ['M0 0 H90 Q120 0 120 27 V44 Q120 60 102 65 Q117 73 120 100 H88 L83 79 Q82 72 74 72 H28 V100 H0 Z M28 22 V49 H82 Q92 49 92 36 Q92 22 82 22 Z'] },
    S: { advance: 131, fill: true, paths: ['M116 28 H87 V27 Q87 22 79 22 H37 Q28 22 28 31 Q28 40 37 40 H82 Q116 40 116 69 V75 Q116 100 83 100 H31 Q0 100 0 74 V71 H29 V74 Q29 78 37 78 H79 Q88 78 88 69 Q88 60 79 60 H34 Q0 60 0 32 V25 Q0 0 33 0 H83 Q116 0 116 26 Z'] },
    T: { advance: 125, fill: true, paths: ['M0 0 H110 V23 H69 V100 H41 V23 H0 Z'] },
    U: { advance: 134, fill: true, paths: ['M0 0 H28 V65 Q28 76 39 76 H80 Q91 76 91 65 V0 H119 V67 Q119 100 85 100 H34 Q0 100 0 67 Z'] },
  },
  allowConstructedFallback: false,
  allowResearchReplacement: false,
  evidence: {
    status: 'legend-approximation',
    specimens: [
      { title: '1981 JUN passenger decal · BCpl8s', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/1981-59031991.jpg' },
      { title: '1981 OCT decal · Jerry Woody, CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:British_Columbia_Sticker_Decal_October_1981.jpg' },
      { title: '1982 JUL decal · Jerry Woody, CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:British_Columbia_Sticker_Decal_July_1982.jpg' },
    ],
    notes: 'Independent rounded-square capitals for the observed fixed words BRITISH and COLUMBIA. Authored contours, widths and advances follow the larger 1981 photograph; repeated B/I occurrences and the smaller 1981/82 sources are retained in docs/research/bc-decal-residuals/province-placement. No existing font is horizontally stretched. Only the twelve observed capitals are supported. Fine corner radii and weight remain approximate because the photographed letters are about 31–32 pixels high; 1982 is blurrier. No historical font or manufacturer identity is claimed.',
  },
};
