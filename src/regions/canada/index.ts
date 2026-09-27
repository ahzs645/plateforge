import { britishColumbia as earlyBritishColumbia } from './bc';
import { bcLaterFormats } from './bc-later';
import { bcFlagFormats } from './bc-flag';
import { withBcDecals, withBcDies } from './bc-dies';
import { BC_LATER_RECIPES } from './bc-later';
import type { PlateEra, PlateFamily, PlateGap } from '../../core/types';

/** Each family has its own timeline; passenger is the default. */
export const BC_FAMILIES: readonly PlateFamily[] = [
  { id: 'passenger', label: 'Passenger', summary: 'General passenger plates, 1904 onward.' },
];

/** Timeline groupings for the passenger presets; periods follow the BCpl8s chapter breaks. */
export const BC_ERAS: readonly PlateEra[] = [
  { id: 'annual-1940', label: 'Annual plates', period: [1940, 1948], summary: 'A new plate and colour pair every year, with the year stacked beside the serial.' },
  { id: 'bases-1949', label: 'Short & long bases', period: [1949, 1951], summary: 'Five-digit short and six-digit long bases; 1951 renews the 1950 plate with a bolted strip.' },
  { id: 'totem-1952', label: '1952 totem base', period: [1952, 1954], summary: 'Aluminum base with the totem emblem, renewed by side tabs in 1953 and 1954.' },
  { id: 'annual-1955', label: 'Annual 300 mm plates', period: [1955, 1963], summary: 'Yearly colour changes on the standard size, including the 1958 centenary layout.' },
  { id: 'beautiful-1964', label: 'BEAUTIFUL B.C. annuals', period: [1964, 1969], summary: 'Annual plates carrying the BEAUTIFUL legend above the serial.' },
  { id: 'decal-1970', label: 'Multi-year decal bases', period: [1970, 1978], summary: 'Three-letter blocks on the 1970 steel and 1973 aluminum bases, renewed with decals.' },
  { id: 'blue-1979', label: '1979 blue base', period: [1979, 1985], summary: 'White on blue with a wide lower-centre decal box.' },
  { id: 'flag-1985', label: 'Flag base', period: [1985, 2026], summary: 'Reflective white base with the waving flag between serial halves and “Beautiful British Columbia” above; serial generations change, the design does not.' },
];

const chapter = (period: string) => ({ title: `BCpl8s · Passenger ${period.replace('-', '–')}`, url: `https://www.bcpl8s.ca/Passenger-${period}.html` });
/** Passenger chapters BCpl8s documents that have no editable preset yet. */
export const BC_GAPS: readonly PlateGap[] = [
  { id: 'early-1904', label: 'Early plates', period: [1904, 1939], note: 'Includes porcelain and other early construction types that cannot safely be forced into the standard 12 × 6 shell.',
    sources: ['1904-1912', '1913-1914', '1915-1917', '1918-1923', '1924-1929', '1930', '1931-1935', '1936-1939'].map(chapter) },
];

/** Decal years for a 1970–85 base: its own issue period, then renewals until the next general reissue. No 1973 or 1979 decals exist. */
function decalYears(id: string): readonly [number, number] | null {
  const r = BC_LATER_RECIPES.find((item) => item.id === id);
  if (!r || r.layout === 'annual-beautiful') return null;
  return [r.period[0], r.baseYear === 1979 ? 1985 : 1978];
}

/** Preserve legacy recipe exports/tests while extending the registered region. */
export const britishColumbia = {
  ...earlyBritishColumbia,
  formats: [
    ...earlyBritishColumbia.formats.map(withBcDies),
    ...bcLaterFormats.map((f) => withBcDies(decalYears(f.id) ? withBcDecals(f, decalYears(f.id)!) : f)),
    ...bcFlagFormats,
  ],
  families: BC_FAMILIES,
  eras: BC_ERAS,
  gaps: BC_GAPS,
  coverageRoute: '#/library/coverage',
  notes: 'Passenger base reconstructions, 1940–1985, with selected production and serial variants. Reference-library coverage is much broader than editable coverage. Exact dies, decals, colours and artwork are not certified.',
};
