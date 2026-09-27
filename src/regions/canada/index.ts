import { britishColumbia as earlyBritishColumbia } from './bc';
import { bcLaterFormats } from './bc-later';
import type { PlateEra } from '../../core/types';

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

/** Preserve legacy recipe exports/tests while extending the registered region. */
export const britishColumbia = {
  ...earlyBritishColumbia,
  formats: [...earlyBritishColumbia.formats, ...bcLaterFormats],
  eras: BC_ERAS,
  notes: 'Passenger base reconstructions, 1940–1985, with selected production and serial variants. Reference-library coverage is much broader than editable coverage. Exact dies, decals, colours and artwork are not certified.',
};
