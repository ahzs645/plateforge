import specimens from './bc-decal-specimens.json';

/**
 * Passenger renewal decals, 1970–2023: colours read from BCpl8s decal photos
 * (aged scans, so approximate), serial length by period, and the layout style of
 * each era. No decal was issued for 1973 or 1979. Sizes are estimated from photos.
 */
export type DecalStyle = 'annual' | 'panel' | 'bordered' | 'solid';
export interface BcDecal {
  year: number;
  /** Distinguishes documented same-year variants (e.g. the 1996 pink decal). */
  variant?: string;
  style: DecalStyle;
  background: string;
  ink: string;
  serialInk: string;
  /** Control-number digits (none on the 1970 decal). */
  digits: number;
  colours: string;
  image: string;
  /** Individually inspected source/layout record, independent of palette. */
  specimen?: DecalSpecimen;
}
const BASE_DECALS: readonly BcDecal[] = [
  { year: 1970, style: 'annual', background: '#2671a0', ink: '#e8ebef', serialInk: '#e8ebef', digits: 0, colours: "blue / white", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1970.jpg' },
  { year: 1971, style: 'annual', background: '#9d1a0f', ink: '#c98e12', serialInk: '#c98e12', digits: 6, colours: "red / yellow/gold", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1971.jpg' },
  { year: 1972, style: 'annual', background: '#d89d09', ink: '#425611', serialInk: '#425611', digits: 6, colours: "yellow/gold / dark green", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1972.jpg' },
  { year: 1974, style: 'annual', background: '#caaf87', ink: '#5b6d53', serialInk: '#5b6d53', digits: 6, colours: "cream/buff (aged) / green", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1974.jpg' },
  { year: 1975, style: 'annual', background: '#bc4a3d', ink: '#c48138', serialInk: '#c48138', digits: 7, colours: "red / orange/yellow", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1975.jpg' },
  { year: 1976, style: 'annual', background: '#315c9a', ink: '#e2e0d5', serialInk: '#e2e0d5', digits: 7, colours: "blue / white", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1976.jpg' },
  { year: 1977, style: 'annual', background: '#05807c', ink: '#98d0d2', serialInk: '#98d0d2', digits: 7, colours: "teal/green / light aqua/white", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1977.jpg' },
  { year: 1978, style: 'annual', background: '#c5d0b0', ink: '#2c3239', serialInk: '#2c3239', digits: 7, colours: "pale green/white / black/navy", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1978.jpg' },
  { year: 1980, style: 'panel', background: '#cbc698', ink: '#251f19', serialInk: '#251f19', digits: 8, colours: "cream/beige / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1980.jpg' },
  { year: 1981, style: 'panel', background: '#bd3438', ink: '#c1c6ac', serialInk: '#c1c6ac', digits: 8, colours: "red / white/cream", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1981.jpg' },
  { year: 1982, style: 'panel', background: '#03826a', ink: '#c7e1b8', serialInk: '#c7e1b8', digits: 8, colours: "green / pale green/white", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1982.jpg' },
  { year: 1983, style: 'panel', background: '#0a0a15', ink: '#c7dddb', serialInk: '#c7dddb', digits: 8, colours: "black end panels + pale blue-grey centre / white (month/year), black (centre text)", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1983.jpg' },
  { year: 1984, style: 'panel', background: '#d55324', ink: '#ccd6cc', serialInk: '#ccd6cc', digits: 8, colours: "orange centre on pale grey/white / white (on orange), orange (vertical legend)", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1984.jpg' },
  { year: 1985, style: 'panel', background: '#c5c4ba', ink: '#072878', serialInk: '#072878', digits: 8, colours: "pale grey/white / dark blue", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1985.jpg' },
  { year: 1986, style: 'panel', background: '#c3c9ae', ink: '#61354f', serialInk: '#61354f', digits: 8, colours: "pale grey/white / red month + blue EXPO 86 logo", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1986.jpg' },
  { year: 1987, style: 'panel', background: '#bd2927', ink: '#cdc2ac', serialInk: '#cdc2ac', digits: 8, colours: "red end blocks + pale centre / white (on red), red (centre)", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1987.jpg' },
  { year: 1988, style: 'panel', background: '#042e8f', ink: '#c2c5c4', serialInk: '#c2c5c4', digits: 8, colours: "blue end blocks + pale centre / white (on blue), blue (centre)", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1988.jpg' },
  { year: 1989, style: 'bordered', background: '#f4f5ef', ink: '#0f8476', serialInk: '#111111', digits: 8, colours: "white/pale centre inside a thick green border / green", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1989.jpg' },
  { year: 1990, style: 'bordered', background: '#f4f5ef', ink: '#c42757', serialInk: '#111111', digits: 8, colours: "white/pale centre inside a thick red (magenta-red) border / red (magenta-red)", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1990.jpg' },
  { year: 1991, style: 'bordered', background: '#f4f5ef', ink: '#084193', serialInk: '#111111', digits: 8, colours: "white/pale centre inside a thick blue border / blue", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1991.jpg' },
  { year: 1992, style: 'bordered', background: '#f4f5ef', ink: '#0e0b0d', serialInk: '#111111', digits: 8, colours: "white/pale centre inside a thick black border / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1992.jpg' },
  { year: 1993, style: 'bordered', background: '#f4f5ef', ink: '#107869', serialInk: '#111111', digits: 8, colours: "white/pale centre inside a thick green border / green", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1993.jpg' },
  { year: 1994, style: 'bordered', background: '#f4f5ef', ink: '#bb3532', serialInk: '#111111', digits: 8, colours: "white/pale centre inside a thick red border / red", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1994.jpg' },
  { year: 1995, style: 'bordered', background: '#f4f5ef', ink: '#0f5ca1', serialInk: '#111111', digits: 8, colours: "white/pale centre inside a thick blue border / blue", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1995.jpg' },
  { year: 1996, style: 'bordered', background: '#f4f5ef', ink: '#0f0b0d', serialInk: '#111111', digits: 8, colours: "white/pale centre inside a thick black border / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1996-black.jpg' },
  { year: 1997, style: 'bordered', background: '#f4f5ef', ink: '#10897a', serialInk: '#111111', digits: 8, colours: "white/pale centre inside a thick green border / green", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1997.jpg' },
  { year: 1998, style: 'bordered', background: '#f4f5ef', ink: '#d0271a', serialInk: '#111111', digits: 8, colours: "white/pale centre inside a thick red border / red", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1998.jpg' },
  { year: 1999, style: 'bordered', background: '#f4f5ef', ink: '#084da7', serialInk: '#111111', digits: 8, colours: "white/pale centre inside a thick blue border / blue", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1999-thick.jpg' },
  { year: 1996, variant: 'pink', style: 'bordered', background: '#f4f5ef', ink: '#c62f76', serialInk: '#111111', digits: 8, colours: "white centre, thick pink/magenta border / pink/magenta", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1996-pink.jpg' },
  { year: 1998, variant: 'type-ii', style: 'bordered', background: '#f4f5ef', ink: '#a6220a', serialInk: '#111111', digits: 8, colours: "white centre, red border / red", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1998/1998-May-34838894.jpg' },
  { year: 1999, variant: 'white', style: 'solid', background: '#e1e2dc', ink: '#074cb9', serialInk: '#074cb9', digits: 8, colours: "white / blue", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/1999-61152006.jpg' },
  { year: 2000, style: 'solid', background: '#f4c81c', ink: '#1a0d05', serialInk: '#111111', digits: 8, colours: "yellow / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2000-50803178.jpg' },
  { year: 2001, style: 'solid', background: '#ed8c29', ink: '#111111', serialInk: '#111111', digits: 8, colours: 'orange / black', image: 'https://www.bcpl8s.ca/images/Decals/2001-76052343.jpg' },
  { year: 2002, style: 'solid', background: '#03b990', ink: '#0c1b1d', serialInk: '#111111', digits: 8, colours: "green (mint) / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2002.jpg' },
  { year: 2003, style: 'solid', background: '#da1d37', ink: '#0e0a0a', serialInk: '#111111', digits: 8, colours: "red (pinkish-red) / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2003-86273079.jpg' },
  { year: 2004, style: 'solid', background: '#e9cc12', ink: '#20160b', serialInk: '#111111', digits: 8, colours: "yellow / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2004.jpg' },
  { year: 2005, style: 'solid', background: '#207ae4', ink: '#0c1128', serialInk: '#111111', digits: 8, colours: "blue / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2005.jpg' },
  { year: 2006, style: 'solid', background: '#d62c2d', ink: '#110e11', serialInk: '#111111', digits: 8, colours: "red / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2006-21258417.jpg' },
  { year: 2007, style: 'solid', background: '#02b57e', ink: '#111d1b', serialInk: '#111111', digits: 8, colours: "green / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2007.jpg' },
  { year: 2008, style: 'solid', background: '#0561b2', ink: '#7fafe4', serialInk: '#7fafe4', digits: 8, colours: "blue / white/light blue", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2008.jpg' },
  { year: 2009, style: 'solid', background: '#e6682e', ink: '#1d1816', serialInk: '#111111', digits: 8, colours: "orange / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2009.jpg' },
  { year: 2010, style: 'solid', background: '#478605', ink: '#151513', serialInk: '#111111', digits: 8, colours: "green (lime) / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2010.jpg' },
  { year: 2011, style: 'solid', background: '#e0a319', ink: '#39260e', serialInk: '#111111', digits: 8, colours: "yellow/gold / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2011.jpg' },
  { year: 2012, style: 'solid', background: '#ef0c4a', ink: '#080000', serialInk: '#111111', digits: 8, colours: "pink (hot pink/red) / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2012.jpg' },
  { year: 2013, style: 'solid', background: '#f3590c', ink: '#371b15', serialInk: '#111111', digits: 8, colours: "orange / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2013.jpg' },
  { year: 2014, style: 'solid', background: '#02c9ab', ink: '#1a1e21', serialInk: '#111111', digits: 8, colours: "green (turquoise) / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2014-99103688.jpg' },
  { year: 2015, style: 'solid', background: '#f3b001', ink: '#1a1e21', serialInk: '#111111', digits: 8, colours: "yellow / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2015-70118033.jpg' },
  { year: 2016, style: 'solid', background: '#fb3168', ink: '#1a1e21', serialInk: '#111111', digits: 8, colours: "pink / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2016-10076867.jpg' },
  { year: 2017, style: 'solid', background: '#08aa8f', ink: '#1a1e21', serialInk: '#111111', digits: 8, colours: "green (turquoise) / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2017-20093481.jpg' },
  { year: 2018, style: 'solid', background: '#e14e1c', ink: '#1a1e21', serialInk: '#111111', digits: 8, colours: "orange / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2018-50278580.jpg' },
  { year: 2019, style: 'solid', background: '#d4b105', ink: '#1a1e21', serialInk: '#111111', digits: 8, colours: "yellow / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2019-10727925.jpg' },
  { year: 2020, style: 'solid', background: '#a47d2b', ink: '#1a1e21', serialInk: '#111111', digits: 8, colours: "gold / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2020-0000000.jpg' },
  { year: 2021, style: 'solid', background: '#ec3662', ink: '#1a1e21', serialInk: '#111111', digits: 8, colours: "pink / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2021-36946964.jpg' },
  { year: 2022, style: 'solid', background: '#20eae8', ink: '#1a1e21', serialInk: '#111111', digits: 8, colours: "cyan/aqua / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2022-72919128.jpg' },
  { year: 2023, style: 'solid', background: '#f57c26', ink: '#1a1e21', serialInk: '#111111', digits: 8, colours: "orange / black", image: 'https://www.bcpl8s.ca/images/Decals/Passenger/2023-52843353.jpg' },
];

export interface DecalSpecimen {
  system: string; aspect: number; crop: number[]; month: string | null; control: string | null; reviewNote: string;
  photoInspected: boolean; reviewedOn: string; sourceSha256: string; sourcePixels: number[]; barcodeDecoded: boolean; thumbnail: string;
}
const reviews = specimens as Record<string, DecalSpecimen>;
export const BC_DECALS: readonly BcDecal[] = BASE_DECALS.map(decal => ({...decal, specimen: reviews[`${decal.year}${decal.variant ? `-${decal.variant}` : ''}`]}));

export const decalId = (d: BcDecal): string => `${d.year}${d.variant ? `-${d.variant}` : ''}`;
export const decalsBetween = (from: number, to: number): BcDecal[] => BC_DECALS.filter((d) => d.year >= from && d.year <= to);
export const BC_DECAL_SOURCE = { title: 'BCpl8s · Decals', url: 'https://www.bcpl8s.ca/Decals.htm' };
