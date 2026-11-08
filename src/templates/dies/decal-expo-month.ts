/**
 * 1986 renewal month lettering, derived independently of the EXPO souvenir font.
 * Rounded P/R bowls are geometric reconstructions supported by APR/MAR/SEP.
 * T/V preserve the native outlines but paint overlapping contours separately:
 * an even-odd compound path had punched transparent notches through their joins.
 * The remaining observed capitals retain the documented mixed reconstruction.
 */
import type {DieProfile} from './engine';
import type {SkeletonGlyph} from './skeleton';
import previous from './decal-glyph-printing.json';

const source = previous['1986-rounded-reconstruction'];
const observed = [...new Set('JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC')];
const retained = Object.fromEntries(observed.map(char => [char, source[char as keyof typeof source]]));

/** Separate additive contours while retaining the source coordinates/advances. */
const additive = (glyph: SkeletonGlyph): SkeletonGlyph => ({
  ...glyph,
  paths: glyph.paths.flatMap(path => path.split(/(?=M)/).filter(Boolean)),
});

export const DECAL_EXPO_MONTH_PROFILE: DieProfile = {
  id: 'bc-decal-print-1986-rounded-corrected',
  label: '1986 decal month · rounded reconstruction with intact joins',
  params: {width: 60, stroke: 0, curve: 'oval', tracking: 0},
  overrides: {
    ...retained,
    P: {
      advance: 82, fill: true,
      paths: [
        'M0 100 V36 C0 16.118 16.118 0 36 0 C55.882 0 72 16.118 72 36 C72 55.882 55.882 72 36 72 C28.811 72 22.115 69.893 16.5 66.264 V100 Z '
        + 'M16.8 36 C16.8 46.604 25.396 55.2 36 55.2 C46.604 55.2 55.2 46.604 55.2 36 C55.2 25.396 46.604 16.8 36 16.8 C25.396 16.8 16.8 25.396 16.8 36 Z',
      ],
    },
    R: {
      advance: 77, fill: true,
      paths: [
        'M0 100 V31.5 C0 14.103 14.103 0 31.5 0 C48.897 0 63 14.103 63 31.5 C63 47.337 51.312 60.444 36.101 62.664 L67 100 H48 L16.5 64 V100 Z '
        + 'M16.5 31.5 C16.5 39.784 23.216 46.5 31.5 46.5 C39.784 46.5 46.5 39.784 46.5 31.5 C46.5 23.216 39.784 16.5 31.5 16.5 C23.216 16.5 16.5 23.216 16.5 31.5 Z',
      ],
    },
    T: additive(source.T),
    V: additive(source.V),
  },
  allowConstructedFallback: false,
  allowResearchReplacement: false,
  evidence: {
    status: 'legend-approximation',
    specimens: [
      {title: 'BCpl8s · MAR 1986, 12137790', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/1986-12137790.jpg'},
      {title: 'BCpl8s · APR 1986, 13185411', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/1986-13185411.jpg'},
      {title: 'BCpl8s · SEP 1986, 18021283', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/1986-18021283.jpg'},
    ],
    notes: 'Derived decal-only mixed reconstruction. P/R use smooth rounded bowls and a 16.5-cap-unit stem, supported by repeated month photographs. R has a smaller round counter than P. T/V retain the source contours and advances as separately painted additive shapes, removing even-odd overlap knockouts. M/A and other observed month letters retain the earlier documented candidates; unobserved letters are unavailable. No per-glyph horizontal scaling or photographic pixel tracing. Historical typeface identity and fine print contours remain uncertain. Diagnostics: docs/research/bc-decal-corrections/expo86/.',
  },
};
