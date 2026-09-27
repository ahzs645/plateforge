import { britishColumbia as earlyBritishColumbia } from './bc';
import { bcLaterFormats } from './bc-later';
import type { PlateEra, PlateGap } from '../../core/types';

/** Timeline groupings for the passenger presets; periods follow the BCpl8s chapter breaks. */
export const BC_ERAS: readonly PlateEra[] = [
  { id: 'annual-1940', label: 'Annual plates', period: [1940, 1948], summary: 'A new plate and colour pair every year, with the year stacked beside the serial.' },
  { id: 'bases-1949', label: 'Short & long bases', period: [1949, 1951], summary: 'Five-digit short and six-digit long bases; 1951 renews the 1950 plate with a bolted strip.' },
  { id: 'totem-1952', label: '1952 totem base', period: [1952, 1954], summary: 'Aluminum base with the totem emblem, renewed by side tabs in 1953 and 1954.' },
  { id: 'annual-1955', label: 'Annual 300 mm plates', period: [1955, 1963], summary: 'Yearly colour changes on the standard size, including the 1958 centenary layout.' },
  { id: 'beautiful-1964', label: 'BEAUTIFUL B.C. annuals', period: [1964, 1969], summary: 'Annual plates carrying the BEAUTIFUL legend above the serial.' },
  { id: 'decal-1970', label: 'Multi-year decal bases', period: [1970, 1978], summary: 'Three-letter blocks on the 1970 steel and 1973 aluminum bases, renewed with decals.' },
  { id: 'blue-1979', label: '1979 blue base', period: [1979, 1985], summary: 'White on blue with a wide lower-centre decal box.' },
];

const chapter = (period: string) => ({ title: `BCpl8s · Passenger ${period.replace('-', '–')}`, url: `https://www.bcpl8s.ca/Passenger-${period}.html` });
/** Passenger chapters BCpl8s documents that have no editable preset yet. */
export const BC_GAPS: readonly PlateGap[] = [
  { id: 'early-1904', label: 'Early plates', period: [1904, 1939], note: 'Includes porcelain and other early construction types that cannot safely be forced into the standard 12 × 6 shell.',
    sources: ['1904-1912', '1913-1914', '1915-1917', '1918-1923', '1924-1929', '1930', '1931-1935', '1936-1939'].map(chapter) },
  { id: 'flag-1985', label: 'Flag base', period: [1985, 2001], note: 'The 1985 flag design; Astrographic die forms differ within the period.', sources: [chapter('1985-2001')] },
  { id: 'series-2001', label: '2001–2014 series', period: [2001, 2014], note: 'Numeric-first serials; the Astrographic-to-Waldale transition has exceptions.', sources: [chapter('2001-2014')] },
  { id: 'series-2014', label: '2014–2025 series', period: [2014, 2025], sources: [chapter('2014-2025')] },
  { id: 'config-2025', label: '2025 configurations', period: [2025, 2025], note: 'New six-character arrangements announced by ICBC; not a new graphic base by itself.', sources: [chapter('2025')] },
];

/** Preserve legacy recipe exports/tests while extending the registered region. */
export const britishColumbia = {
  ...earlyBritishColumbia,
  formats: [...earlyBritishColumbia.formats, ...bcLaterFormats],
  eras: BC_ERAS,
  gaps: BC_GAPS,
  coverageRoute: '#/library/coverage',
  notes: 'Passenger base reconstructions, 1940–1985, with selected production and serial variants. Reference-library coverage is much broader than editable coverage. Exact dies, decals, colours and artwork are not certified.',
};
