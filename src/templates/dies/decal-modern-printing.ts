import type { DieProfile } from './engine';
import outlines from './decal-modern-printing.json';
import laterOutlines from './decal-modern-late-printing.json';

/** Printing reconstructions are independent of stamped plate serial dies. */
export const DECAL_MODERN_PRINTING_PROFILES: DieProfile[] = [
  {
    id: 'bc-decal-print-modern-year-reconstruction',
    label: 'Modern decal year · specimen numeral construction',
    params: { width: 44, stroke: 0, curve: 'oval', tracking: 0 },
    overrides: outlines['modern-year-reconstruction'],
    allowConstructedFallback: false, allowResearchReplacement: false,
    evidence: {
      status: 'legend-approximation',
      specimens: [
        { title: '2015 JAN renewal decal · 70118033', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2015-70118033(XL).jpg' },
        { title: '2017 NOV renewal decal · 91115136', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2017-91115136(XL).jpg' },
      ],
      notes: 'Independent vector constructions at authored widths. Numerals 0/1/2 are supported by two enlarged 2015/2017 photographs; 5 and 7 by one each. A second occurrence audit corroborates 4 in nine 2014 photographs, 6 in eleven 2016 photographs, and the early 8 in five 2018 photographs. Later 2018 replacement specimens have a different 0/1/8 printing group that is not assigned merely by expiry month. The retained 3/9 contours remain lower-confidence coverage; production 2019–2023 uses the separately evidenced later profile. No historical font or manufacturer identification. See docs/research/bc-modern-numerals and docs/research/bc-decal-residuals/modern.',
    },
  },
  {
    id: 'bc-decal-print-modern-late-year-reconstruction',
    label: 'Later modern decal year · observed 2019–2023 numeral construction',
    params: { width: 48, stroke: 0, curve: 'oval', tracking: 0 },
    overrides: laterOutlines['modern-late-year-reconstruction'],
    allowConstructedFallback: false, allowResearchReplacement: false,
    evidence: {
      status: 'legend-approximation',
      specimens: [
        { title: '2019 JAN renewal decal · 10727925', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2019-10727925.jpg' },
        { title: '2020 APR renewal decal · 23747480 · D5e58, CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:2020_British_Columbia_licence_plate_decal.jpg' },
        { title: '2021 APR renewal decal · 33502027 · D5e58, CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:2021_British_Columbia_licence_plate_decal.jpg' },
        { title: '2022 FEB renewal decal · 71708687 · D5e58, CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:2022_British_Columbia_licence_plate_decal.jpg' },
        { title: '2023 MAR renewal decal · 52843353', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2023-52843353.jpg' },
      ],
      notes: 'Separately authored later 0/1/3/9 contours and advances; 2 retains its earlier contour with the later observed advance. Only observed 0/1/2/3/9 are provided. Wider later 0, a narrow straight-shoulder 1, and larger native character starts are corroborated by 26 small catalogue photographs and three enlarged independent photographs. The independent 9 is supported by eleven small photographs; 3 has only one 46-pixel-high occurrence, so its fine contour remains provisional. All repeated occurrences are compared at equal painted height without x-only fitting. The later 2018 replacement printing group is documented but not assigned by a presumed expiry boundary. Photography does not identify a historical typeface. Source/shape/spacing limits: docs/research/bc-decal-residuals/modern.',
    },
  },
  {
    id: 'bc-decal-print-modern-control-reconstruction',
    label: 'Modern decal control · native narrow numerals, reconstructed 1',
    params: { width: 60, stroke: 0, curve: 'oval', tracking: 0 },
    overrides: outlines['modern-control-reconstruction'],
    allowConstructedFallback: false, allowResearchReplacement: false,
    evidence: {
      status: 'legend-approximation',
      specimens: [
        { title: '2015 JAN control 70118033', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2015-70118033(XL).jpg' },
        { title: '2017 NOV control 91115136', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2017-91115136(XL).jpg' },
      ],
      notes: 'Native Nimbus Sans Narrow Bold 0/2/3/4/5/6/7/8/9 outlines and all native tabular advances, with a reconstructed diagonal-flag 1 supported by six occurrences in the enlarged 2015 and November 2017 photographs. The independent enlarged 2020–2022 sources add 24 occurrence checks, including previously weak 2 and 4 evidence; those checks support retaining the current control contours. No x-only scaling, synthetic stroke, or tracking fitted to a whole-run score. Printed counter and stem comparisons support this candidate; historical font identity is unconfirmed. See docs/research/bc-modern-numerals and docs/research/bc-decal-residuals/modern.',
    },
  },
];
