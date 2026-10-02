import { britishColumbia as earlyBritishColumbia } from './bc';
import { bcLaterFormats } from './bc-later';
import { bcFlagFormats } from './bc-flag';
import { bcEarlyFormats } from './bc-early';
import { BC_SPECIALTY_ERAS, BC_SPECIALTY_FAMILIES, BC_SPECIALTY_FORMATS } from './bc-specialty';
import { BC_VEHICLE_ERAS, BC_VEHICLE_FAMILIES, BC_VEHICLE_FORMATS } from './bc-vehicles';
import { BC_TRADE_ERAS, BC_TRADE_FAMILIES, BC_TRADE_FORMATS } from './bc-trade';
import { BC_OFFICIAL_ERAS, BC_OFFICIAL_FAMILIES, BC_OFFICIAL_FORMATS } from './bc-official';
import { BC_SAMPLE_FAMILIES, bcSampleFormats } from './bc-samples';
import { BC_MUNICIPAL_ERAS, BC_MUNICIPAL_FAMILIES, BC_MUNICIPAL_FORMATS } from './bc-municipal';
import { withBcDecals, withBcDies } from './bc-dies';
import { BC_LATER_RECIPES } from './bc-later';
import type { PlateEra, PlateFamily, PlateGap } from '../../core/types';

/** Each family has its own timeline; passenger is the default. */
export const BC_FAMILIES: readonly PlateFamily[] = [
  { id: 'passenger', label: 'Passenger', summary: 'General passenger plates, 1904 onward.' },
];

/** Timeline groupings for the passenger presets; periods follow the BCpl8s chapter breaks. */
export const BC_ERAS: readonly PlateEra[] = [
  { id: 'owner-1904', label: 'Owner-made plates', period: [1904, 1912], summary: 'Permanent registration numbers made up by owners, usually house numerals on leather.' },
  { id: 'enamel-1913', label: 'Porcelain & tin', period: [1913, 1917], summary: 'Provincial issue begins: porcelain in 1913–14, then lithographed tin with the coat of arms.' },
  { id: 'steel-1918', label: 'Steel bases & tabs', period: [1918, 1923], summary: 'Embossed steel meant for several years, renewed with tabs in 1919, 1921 and 1922.' },
  { id: 'annual-1924', label: 'BRITISH COLUMBIA annuals', period: [1924, 1939], summary: 'Annual embossed plates with the province name along the bottom and a small date.' },
  { id: 'annual-1940', label: 'Annual plates', period: [1940, 1948], summary: 'A new plate and colour pair every year, with the year stacked beside the serial.' },
  { id: 'bases-1949', label: 'Short & long bases', period: [1949, 1951], summary: 'Five-digit short and six-digit long bases; 1951 renews the 1950 plate with a bolted strip.' },
  { id: 'totem-1952', label: '1952 totem base', period: [1952, 1954], summary: 'Aluminum base with the totem emblem, renewed by side tabs in 1953 and 1954.' },
  { id: 'annual-1955', label: 'Annual 300 mm plates', period: [1955, 1963], summary: 'Yearly colour changes on the standard size, including the 1958 centenary layout.' },
  { id: 'beautiful-1964', label: 'BEAUTIFUL B.C. annuals', period: [1964, 1969], summary: 'Annual plates carrying the BEAUTIFUL legend above the serial.' },
  { id: 'decal-1970', label: 'Multi-year decal bases', period: [1970, 1978], summary: 'Three-letter blocks on the 1970 steel and 1973 aluminum bases, renewed with decals.' },
  { id: 'blue-1979', label: '1979 blue base', period: [1979, 1985], summary: 'White on blue with a wide lower-centre decal box.' },
  { id: 'flag-1985', label: 'Flag base', period: [1985, 2026], summary: 'Reflective white base with the waving flag between serial halves and “Beautiful British Columbia” above; serial generations change, the design does not.' },
];

/** Passenger chapters BCpl8s documents that have no editable preset yet. */
export const BC_GAPS: readonly PlateGap[] = [
];

/** Decal years for a 1970–85 base: its own issue period, then renewals until the next general reissue. No 1973 or 1979 decals exist. */
function decalYears(id: string): readonly [number, number] | null {
  const r = BC_LATER_RECIPES.find((item) => item.id === id);
  if (!r || r.layout === 'annual-beautiful') return null;
  return [r.period[0], r.baseYear === 1979 ? 1985 : 1978];
}

const BASE_FORMATS = [
    ...earlyBritishColumbia.formats.map(withBcDies),
    ...bcLaterFormats.map((f) => withBcDies(decalYears(f.id) ? withBcDecals(f, decalYears(f.id)!) : f)),
    ...bcFlagFormats,
    ...bcEarlyFormats,
];

/** Preserve legacy recipe exports/tests while extending the registered region. */
export const britishColumbia = {
  ...earlyBritishColumbia,
  formats: [
    ...BASE_FORMATS,
    ...bcSampleFormats((id) => BASE_FORMATS.find((f) => f.id === id)),
    ...BC_VEHICLE_FORMATS, ...BC_TRADE_FORMATS, ...BC_SPECIALTY_FORMATS, ...BC_OFFICIAL_FORMATS, ...BC_MUNICIPAL_FORMATS,
  // The renderer binds research dies by format id (src/templates/dies/research-dies.ts).
  ].map((f) => ({ ...f, design: { ...f.design, formatId: f.id } })),
  families: [...BC_FAMILIES, ...BC_VEHICLE_FAMILIES, ...BC_TRADE_FAMILIES, ...BC_SPECIALTY_FAMILIES, ...BC_OFFICIAL_FAMILIES, ...BC_MUNICIPAL_FAMILIES, ...BC_SAMPLE_FAMILIES],
  eras: [...BC_ERAS, ...BC_VEHICLE_ERAS, ...BC_TRADE_ERAS, ...BC_SPECIALTY_ERAS, ...BC_OFFICIAL_ERAS, ...BC_MUNICIPAL_ERAS],
  gaps: BC_GAPS,
  coverageRoute: '#/library/coverage',
  notes: 'Research reconstructions of B.C. plates from 1904 to 2026 across passenger, specialty, vehicle-class, official, municipal and bicycle families, from BCpl8s sources. Dies, decals, colours and artwork are approximate; serial validation checks documented formats, not real registrations.',
};
