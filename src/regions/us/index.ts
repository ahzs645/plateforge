import { serialFormat } from '../../core/format';
import type { PlateFormat, PlateStatus, Region } from '../../core/types';
import type { UsDesign } from '../../templates/us';
import * as s from './serials';

type Ref = { title: string; url: string };
interface Variant {
  id: string;
  label: string;
  description?: string;
  serial: s.SerialFn;
  pattern: string;
  shape: RegExp;
  period?: readonly [number, number];
  status?: PlateStatus;
  references?: readonly Ref[];
  design?: Partial<UsDesign>;
}

interface StateDef {
  code: string;
  name: string;
  serial: s.SerialFn;
  pattern: string;
  design: Partial<UsDesign> & Pick<UsDesign, 'header' | 'slogan'>;
  /** Overrides for the `standard` format (label, period, sources…). */
  standard?: Partial<Omit<Variant, 'id' | 'serial' | 'pattern' | 'design'>>;
  /** Earlier or special-issue designs, drawn as extra formats with their own `design`. */
  variants?: Variant[];
  /** Territories keep their own flag and sit under the United States. */
  flag?: string;
}

const wiki = (name: string): Ref => ({
  title: `Vehicle registration plates of ${name} (Wikipedia)`,
  url: `https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_${name.replace(/ /g, '_')}`,
});

const NAVY = '#1c2e6b';

// Keys the region's standard design sets that a variant must clear.
const CLEAR: Partial<UsDesign> = {
  band: undefined, bands: undefined, accent: undefined, scene: undefined, subheader: undefined, marker: undefined,
  separator: undefined, separatorChar: undefined, sloganStroke: undefined, sloganStyle: undefined, sloganSize: undefined,
  sloganY: undefined, headerY: undefined, headerSize: undefined, sheen: undefined, frame: undefined,
};

// ── California ──
const CA_2011: StateDef['design'] = { header: 'California', headerStyle: 'script', headerColor: '#c8102e', slogan: 'dmv.ca.gov', sloganStyle: 'sans', sloganColor: '#c8102e', text: NAVY };
const CA_GOLD = '#f5c518';
const caBlock = (bg: [string, string], ink: string, sheen?: number): Partial<UsDesign> => ({
  ...CLEAR, header: 'CALIFORNIA', headerStyle: 'block', headerSize: 40, headerY: 58, headerColor: ink, slogan: '', sloganColor: undefined,
  bg, text: ink, frame: ink, sheen,
});
const CA_LEGACY_SOURCES: Ref[] = [
  wiki('California'),
  { title: 'LAist · DMV bringing back California’s black and yellow license plates', url: 'https://laist.com/news/kpcc-archive/dmv-to-resurrect-calif-s-black-and-yellow-license' },
];
const CALIFORNIA: Variant[] = [
  { id: 'black-yellow-1956', label: 'Black on yellow (1956)', period: [1956, 1962], serial: s.californiaAbc123, pattern: 'AAA 999', shape: /^[A-Z]{3} \d{3}$/,
    description: 'Black on yellow, ABC 123 (AAA 000 → about YRT 999). Header placement approximate.', references: [wiki('California')],
    design: caBlock(['#f4c20d', '#eeb500'], '#141414') },
  { id: 'black-gold-1963', label: 'Gold on black (1963–69)', period: [1963, 1969], serial: s.californiaAbc123, pattern: 'AAA 999', shape: /^[A-Z]{3} \d{3}$/,
    description: 'Embossed gold on black with the state name at the top, ABC 123 (AAA 000 → ZZZ 999).', references: [wiki('California')],
    design: caBlock(['#141414', '#050505'], CA_GOLD, 0.12) },
  { id: 'blue-gold-1970', label: 'Gold on blue (1970–82)', period: [1970, 1982], serial: s.california123Abc, pattern: '999 AAA', shape: /^\d{3} [A-Z]{3}$/,
    description: 'Embossed gold serial on blue, state name on top, 123 ABC (000 AAA → 999 ZZZ).', references: [wiki('California')],
    design: caBlock(['#1f4396', '#17357c'], CA_GOLD, 0.2) },
  { id: 'legacy-1960s', label: 'Legacy 1960s black (2015–)', period: [2015, 2026], serial: s.californiaLegacy, pattern: 'A999A9', shape: /^[A-Z]\d{3}[A-Z]\d$/,
    description: 'DMV Legacy plate in the style of the 1963–69 issue, gold on reflective black (B001A0 → L783N1 as of May 2026). Of the three proposed legacy designs only this one reached the 7,500 pre-orders; the 1950s yellow and 1970s blue reissues were never produced.',
    references: CA_LEGACY_SOURCES, design: caBlock(['#141414', '#050505'], CA_GOLD, 0.12) },
  { id: 'standard-2026', label: 'dmv.ca.gov, 123ABC1 order (2026–)', period: [2026, 2026], serial: s.california2026, pattern: '999AAA9', shape: /^\d{3}[A-Z]{3}\d$/,
    description: 'Same base after the 1ABC123 sequence ran out; serials now read 123ABC1 (000AAA1 → about 801BEZ1, Sept 2026).', references: [wiki('California')] },
];

// ── Arizona ──
const ARIZONA: Variant[] = [
  { id: 'alternative-fuel', label: 'Alternative fuel · Clean Air – Blue Skies', period: [1997, 2026], serial: s.arizonaAltFuel,
    pattern: 'AF·9999 | AF·999A | AF·99A9 | AF99A9 | AF·9A99 | 9A99AF',
    shape: /^(AF·\d{4}|AF·\d{3}[A-Z]|AF·?\d{2}[A-Z]\d|AF·\d[A-Z]\d{2}|\d[A-Z]\d{2}AF)$/,
    description: 'Blue on a sky-and-clouds graphic, first issued April 1997. Serial shapes follow the series (AF·1234 … 1A23AF); the separator was dropped around AF00S1. "CLEAN AIR – BLUE SKIES" and "ALTERNATIVE FUEL" lettering follows photos, not a specification.',
    references: [wiki('Arizona')],
    design: { ...CLEAR, header: 'ARIZONA', headerSize: 52, headerY: 54, headerColor: '#1c2a6b', subheader: 'CLEAN AIR · BLUE SKIES', subheaderStyle: 'italic', subheaderColor: '#1c6b86',
      slogan: 'ALTERNATIVE FUEL', sloganStyle: 'italic', sloganSize: 30, sloganColor: '#1f6f7a', bg: ['#27a6e0', '#3cb4e8'], text: '#1c2a6b', frame: '#ffffff', scene: 'az-clouds' } },
];

// ── Illinois ──
const IL_2017: StateDef['design'] = {
  header: 'ILLINOIS', headerStyle: 'serif', headerSize: 50, headerY: 58, headerColor: '#15161a', slogan: 'LAND OF LINCOLN', sloganStyle: 'serif', sloganSize: 26, sloganY: 284,
  sloganColor: '#15161a', text: '#1a2140', bg: ['#3a98de', '#ffffff'], frame: '#a9b6c4', scene: 'il-skyline',
};
const ILLINOIS: Variant[] = [
  { id: 'electric-vehicle', label: 'Electric vehicle · EL (2020–)', period: [2020, 2026], serial: s.illinoisEv, pattern: '99999 EL | A9999 EL', shape: /^(\d{1,5}|[A-Z]\d{4}) EL$/,
    description: 'Black serial on white with a faded Lincoln, blue script state name, and a large EL suffix at the right (1 EL → 99999 EL, then A1001 EL → D1748 EL as of July 2026). Optional since 2022.',
    references: [wiki('Illinois'), { title: 'Illinois Secretary of State · Electric Vehicle License Plates', url: 'https://www.ilsos.gov/departments/vehicles/license-plate-guide/electric-vehicle.html' }],
    design: { ...CLEAR, header: 'Illinois', headerStyle: 'script', headerColor: '#1f3f99', subheader: 'Land of Lincoln', subheaderColor: '#1f3f99', slogan: '', sloganColor: undefined,
      bg: ['#ffffff', '#f5f6f8'], text: '#111111', frame: '#b9bec6', scene: 'il-lincoln', marker: 'EL' } },
];

// ── New York ──
const NY_BLUE = '#1d3b78';
const NY_SHAPE = /^[A-HJ-NPR-Z]{3}-\d{4}$/;
const NY_2020: StateDef['design'] = {
  header: 'NEW YORK', headerStyle: 'serif', headerSize: 52, headerY: 58, headerColor: NY_BLUE, slogan: 'EXCELSIOR', sloganStyle: 'serif', sloganSize: 30, sloganY: 285,
  sloganColor: '#f0b323', sloganStroke: NY_BLUE, text: NY_BLUE, bg: ['#ffffff', '#f3f7fb'], frame: NY_BLUE, scene: 'ny-excelsior',
  separator: 'ny-outline', separatorChar: '-',
};
const NEW_YORK: Variant[] = [
  { id: 'empire-state-2001', label: 'Empire State (2001–2010)', period: [2001, 2010], serial: s.newYork2001, pattern: 'AAA-9999', shape: NY_SHAPE,
    description: 'Blue on white between two blue bars: the upper with Niagara Falls, the Adirondacks and the city skyline, the lower with THE EMPIRE STATE (ACA-1000 → EYH-2999, no I/O/Q).',
    references: [wiki('New York')],
    design: { ...CLEAR, header: 'NEW YORK', headerStyle: 'serif', headerSize: 54, headerY: 62, headerColor: '#ffffff', slogan: 'THE EMPIRE STATE', sloganStyle: 'serif', sloganSize: 26, sloganY: 287,
      sloganColor: '#ffffff', text: '#1b2656', bg: ['#ffffff', '#eef3fa'], frame: '#1b2656', scene: 'ny-2001',
      bands: { top: { color: '#1b2656', height: 74 }, bottom: { color: '#1b2656', height: 44 } } } },
  { id: 'empire-gold-2010', label: 'Empire Gold (2010–2020)', period: [2010, 2020], serial: s.newYork, pattern: 'AAA-9999', shape: /^[A-Z]{3}-\d{4}$/,
    description: 'Dark blue on golden yellow under an arched blue top bar, EMPIRE STATE at the bottom (FAA-1000 → JSF-9999); generator uses the late-2019 range.',
    references: [wiki('New York')],
    design: { ...CLEAR, header: 'NEW YORK', headerStyle: 'serif', headerSize: 50, headerY: 54, headerColor: '#e8a93a', slogan: 'EMPIRE STATE', sloganStyle: 'serif', sloganSize: 30, sloganY: 276,
      sloganColor: '#101c46', text: '#101c46', bg: ['#e3a232', '#d38817'], frame: '#101c46', scene: 'ny-2010',
      bands: { top: { color: '#101c46', height: 82, curve: 14 }, bottom: { color: '#101c46', height: 12 } } } },
];

// ── Pennsylvania ──
const PA_NAVY = '#1b2f6b';
const PA_HISTORY: Ref = { title: 'Spotlight PA · The fascinating history of Pennsylvania license plates', url: 'https://www.spotlightpa.org/news/2025/03/pennsylvania-license-plate-designs-owl-bicentennial-semiquincentennial/' };
const PA_2004: StateDef['design'] = {
  header: 'PENNSYLVANIA', headerStyle: 'sans', headerSize: 36, headerY: 44, headerColor: '#ffffff', slogan: 'visitPA.com', sloganStyle: 'sans', sloganSize: 32, sloganY: 287,
  sloganColor: PA_NAVY, text: PA_NAVY, bg: ['#ffffff', '#ffffff'], frame: PA_NAVY,
  bands: { top: { color: PA_NAVY, height: 62 }, bottom: { color: '#f2b705', height: 52 } },
};
const PA_2017: StateDef['design'] = { ...PA_2004, scene: 'pa-keystone' };
const PENNSYLVANIA: Variant[] = [
  { id: 'visitpa-2004', label: 'visitPA.com (2004–2017)', period: [2004, 2017], serial: s.pennsylvania2004, pattern: 'AAA-9999', shape: /^[A-Z][B-DF-Z][A-Z]-\d{4}$/,
    description: 'Dark blue on white with a navy top bar and yellow bottom bar (GBA-0000 → KLE-9999; A and E never the second letter).',
    references: [wiki('Pennsylvania')], design: { ...CLEAR, ...PA_2004 } },
  { id: 'liberty-bell', label: 'Let Freedom Ring (2025–)', period: [2025, 2026], serial: s.pennsylvania2025, pattern: 'AAA9999', shape: /^[A-Z]{3}\d{4}$/,
    description: 'Dark blue on cream over the Liberty Bell, red name and slogan; no dash in the serial (MYR0200 → NJS3686, Sept 2026). Issued alongside the previous base until stock runs out.',
    references: [wiki('Pennsylvania'), PA_HISTORY],
    design: { ...CLEAR, header: 'PENNSYLVANIA', headerStyle: 'block', headerSize: 48, headerY: 58, headerColor: '#b3242f', slogan: 'LET FREEDOM RING', sloganStyle: 'serif', sloganSize: 28, sloganY: 283,
      sloganColor: '#b3242f', text: PA_NAVY, bg: ['#f8f4de', '#f2edd0'], frame: '#c9c2a2', scene: 'pa-liberty-bell' } },
];

// ── Puerto Rico ──
const PR_2023: StateDef['design'] = {
  header: 'PUERTO RICO', headerStyle: 'sans', headerSize: 42, headerY: 52, headerColor: '#111111', slogan: 'Isla Del Encanto', sloganStyle: 'sans', sloganSize: 34, sloganY: 283,
  sloganColor: '#111111', text: '#111111', bg: ['#ffffff', '#ffffff'], frame: '#222222', scene: 'pr-garita',
};

// Colors / slogans approximate each state's current general-issue plate.
const STATES: StateDef[] = [
  { code: 'AL', name: 'Alabama', serial: s.alabama, pattern: '99AA999', design: { header: 'Alabama', headerStyle: 'script', headerColor: '#b0122b', slogan: 'Sweet Home Alabama', text: NAVY } },
  { code: 'AK', name: 'Alaska', serial: s.alaska, pattern: 'AAA 999', design: { header: 'ALASKA', slogan: 'THE LAST FRONTIER', bg: ['#f6d24a', '#e9b21c'], text: '#16357a', headerColor: '#16357a' } },
  { code: 'AZ', name: 'Arizona', serial: s.arizona, pattern: 'AAA9999', design: { header: 'ARIZONA', slogan: 'GRAND CANYON STATE', bg: ['#9fd0ec', '#f6dca9'], text: '#6b1d1d', headerColor: '#6b1d1d' },
    standard: { period: [2008, 2020], description: 'Desert-scene base with screened ABC1234 serials (Jan 2008 – Apr 2020); range as of late 2019.', references: [wiki('Arizona')] },
    variants: ARIZONA },
  { code: 'AR', name: 'Arkansas', serial: s.arkansas, pattern: '999 AAA', design: { header: 'ARKANSAS', slogan: 'THE NATURAL STATE', bg: ['#ffffff', '#cfe3f5'], text: '#b0122b' } },
  { code: 'CA', name: 'California', serial: s.california, pattern: '9AAA999', design: CA_2011,
    standard: { label: 'dmv.ca.gov (2011–2026)', period: [2011, 2026], description: 'White base with red script name and dmv.ca.gov (1ABC123, 6TPW000 → 9ZZZ999); range as of late 2019.', references: [wiki('California')] },
    variants: CALIFORNIA },
  { code: 'CO', name: 'Colorado', serial: s.colorado, pattern: 'AAA-A99', design: { header: 'COLORADO', slogan: '', bg: ['#ffffff', '#ffffff'], band: '#0f6b3a', text: '#0f6b3a', headerColor: '#ffffff', bandPosition: 'top' } },
  { code: 'CT', name: 'Connecticut', serial: s.connecticut, pattern: 'AA·99999', design: { header: 'Connecticut', slogan: 'CONSTITUTION STATE', bg: ['#e4f1fb', '#ffffff'], text: '#1f3b73' } },
  { code: 'DE', name: 'Delaware', serial: s.delaware, pattern: '999999', design: { header: 'DELAWARE', slogan: 'THE FIRST STATE', bg: ['#1f2f5c', '#1f2f5c'], text: '#f2c14e', headerColor: '#f2c14e', sloganColor: '#f2c14e', frame: '#f2c14e' } },
  { code: 'DC', name: 'District of Columbia', serial: s.washingtonDc, pattern: 'AA-9999', design: { header: 'DISTRICT OF COLUMBIA', slogan: 'END TAXATION WITHOUT REPRESENTATION', text: '#b31942', headerColor: '#b31942', band: '#b31942', bandPosition: 'bottom', sloganColor: '#ffffff' } },
  { code: 'FL', name: 'Florida', serial: s.florida, pattern: 'Z99 9AA', design: { header: 'MYFLORIDA.COM', slogan: 'SUNSHINE STATE', text: '#006c3b', headerColor: '#006c3b', sloganColor: '#006c3b', accent: '#f39a1d' } },
  { code: 'GA', name: 'Georgia', serial: s.georgia, pattern: 'AAA9999', design: { header: 'GEORGIA', headerStyle: 'serif', headerColor: '#111111', slogan: 'IN GOD WE TRUST', text: '#111111', frame: '#9aa0a8', scene: 'ga-peach' } },
  { code: 'HI', name: 'Hawaii', serial: s.hawaii, pattern: 'AAA 999', design: { header: 'HAWAII', slogan: 'ALOHA STATE', text: '#111111', accent: '#7a4ea3' } },
  { code: 'ID', name: 'Idaho', serial: s.idaho, pattern: '9A 99999', design: { header: 'IDAHO', slogan: 'FAMOUS POTATOES', text: NAVY, accent: '#b0122b' } },
  { code: 'IL', name: 'Illinois', serial: s.illinois, pattern: 'AA 99999', design: IL_2017,
    standard: { label: 'Land of Lincoln (2017–)', period: [2017, 2026], description: 'Blue-to-white gradient with a white Chicago–Springfield skyline and Lincoln at the far left; range as of late 2019.', references: [wiki('Illinois')] },
    variants: ILLINOIS },
  { code: 'IN', name: 'Indiana', serial: s.indiana, pattern: '999AAA', design: { header: 'INDIANA', slogan: 'CROSSROADS OF AMERICA', text: NAVY, accent: '#b8862b' } },
  { code: 'IA', name: 'Iowa', serial: s.iowa, pattern: 'AAA 999', design: { header: 'IOWA', slogan: 'COUNTY', text: '#111111', bg: ['#dfeefa', '#ffffff'] } },
  { code: 'KS', name: 'Kansas', serial: s.kansas, pattern: '999 AAA', design: { header: 'KANSAS', slogan: '', text: '#2c3e7a' } },
  { code: 'KY', name: 'Kentucky', serial: s.kentucky, pattern: '999 AAA', design: { header: 'KENTUCKY', slogan: 'UNBRIDLED SPIRIT', text: NAVY, bg: ['#ffffff', '#e8f0fa'] } },
  { code: 'LA', name: 'Louisiana', serial: s.louisiana, pattern: '999 AAA', design: { header: 'LOUISIANA', slogan: "SPORTSMAN'S PARADISE", text: '#1d3f8f' } },
  { code: 'ME', name: 'Maine', serial: s.maine, pattern: '9999 AA', design: { header: 'MAINE', slogan: 'VACATIONLAND', text: '#133b6b', accent: '#2e6b3a' } },
  { code: 'MD', name: 'Maryland', serial: s.maryland, pattern: '9AA9999', design: { header: 'Maryland', headerStyle: 'script', slogan: '', text: '#111111', band: '#c8102e', bandPosition: 'bottom', accent: '#f2c14e' } },
  { code: 'MA', name: 'Massachusetts', serial: s.massachusetts, pattern: '1AAA 99', design: { header: 'Massachusetts', slogan: 'THE SPIRIT OF AMERICA', text: '#b01e2e', headerColor: '#b01e2e', sloganColor: '#b01e2e' } },
  { code: 'MI', name: 'Michigan', serial: s.michigan, pattern: 'AAA 9999', design: { header: 'PURE MICHIGAN', slogan: '', text: '#ffffff', bg: ['#1a3d8f', '#0f2a66'], headerColor: '#ffffff' } },
  { code: 'MN', name: 'Minnesota', serial: s.minnesota, pattern: 'AAA-999', design: { header: 'Minnesota', slogan: '10,000 LAKES', text: '#1f3f8a', bg: ['#dcebf8', '#ffffff'] } },
  { code: 'MS', name: 'Mississippi', serial: s.mississippi, pattern: 'AAA 9999', design: { header: 'MISSISSIPPI', slogan: 'IN GOD WE TRUST', text: '#1a2a5e', bg: ['#ffffff', '#dce7f5'] } },
  { code: 'MO', name: 'Missouri', serial: s.missouri, pattern: 'AA9 A9A', design: { header: 'MISSOURI', slogan: 'SHOW-ME STATE', text: '#1d2d5c', bg: ['#e1f0f4', '#ffffff'] } },
  { code: 'MT', name: 'Montana', serial: s.montana, pattern: '9-99999A', design: { header: 'MONTANA', slogan: 'TREASURE STATE', text: '#1a2a5e', bg: ['#dae8f6', '#ffffff'] } },
  { code: 'NE', name: 'Nebraska', serial: s.nebraska, pattern: '99-A9999', design: { header: 'NEBRASKA', slogan: '', text: '#1f3f8a' } },
  { code: 'NV', name: 'Nevada', serial: s.nevada, pattern: '999·A99', design: { header: 'NEVADA', slogan: 'THE SILVER STATE', text: '#1d2d5c', bg: ['#cfe0f2', '#f6e3c7'], separator: 'nv-outline' },
    standard: { references: [wiki('Nevada')], description: 'General-issue passenger plate using the state issuing range (late 2019). Nevada has used a state-shaped separator since 2015.' } },
  { code: 'NH', name: 'New Hampshire', serial: s.newHampshire, pattern: '999 9999', design: { header: 'NEW HAMPSHIRE', slogan: 'LIVE FREE OR DIE', text: '#0e5a3a', headerColor: '#0e5a3a', sloganColor: '#0e5a3a' } },
  { code: 'NJ', name: 'New Jersey', serial: s.newJersey, pattern: 'A99-AAA', design: { header: 'NEW JERSEY', slogan: 'GARDEN STATE', text: '#111111', bg: ['#f8eaa6', '#f3dc7a'] } },
  { code: 'NM', name: 'New Mexico', serial: s.newMexico, pattern: '999-AAA', design: { header: 'NEW MEXICO', slogan: 'LAND OF ENCHANTMENT', text: '#b0122b', bg: ['#f8d93a', '#f2c318'], headerColor: '#b0122b', sloganColor: '#b0122b' } },
  { code: 'NY', name: 'New York', serial: s.newYork2020, pattern: 'AAA-9999', design: NY_2020,
    standard: { label: 'Excelsior (2020–)', period: [2020, 2026], shape: NY_SHAPE, references: [wiki('New York')],
      description: 'White base with Niagara Falls and the New York City skyline, a state-shaped separator in place of the dash; KDA-1000 onward (KAA–KCH were recalled), through MHT as of July 2026.' },
    variants: NEW_YORK },
  { code: 'NC', name: 'North Carolina', serial: s.northCarolina, pattern: 'AAA-9999', design: { header: 'NORTH CAROLINA', slogan: 'FIRST IN FLIGHT', text: NAVY, accent: '#b0122b' } },
  { code: 'ND', name: 'North Dakota', serial: s.northDakota, pattern: '999 AAA', design: { header: 'NORTH DAKOTA', slogan: 'LEGENDARY', text: NAVY, bg: ['#ffffff', '#f3e4c4'] } },
  { code: 'OH', name: 'Ohio', serial: s.ohio, pattern: 'AAA 9999', design: { header: 'OHIO', slogan: 'BIRTHPLACE OF AVIATION', text: '#1a2a5e', bg: ['#dcebf8', '#fff3d6'] } },
  { code: 'OK', name: 'Oklahoma', serial: s.oklahoma, pattern: 'AAA-999', design: { header: 'OKLAHOMA', slogan: 'OK.GOV', text: '#1d2d5c', bg: ['#e8f1f8', '#ffffff'] } },
  { code: 'OR', name: 'Oregon', serial: s.oregon, pattern: '999 AAA', design: { header: 'OREGON', slogan: '', text: '#1b3a5b', accent: '#2e6b3a' } },
  { code: 'PA', name: 'Pennsylvania', serial: s.pennsylvania, pattern: 'AAA-9999', design: PA_2017,
    standard: { label: 'visitPA.com with outline (2017–2025)', period: [2017, 2025], references: [wiki('Pennsylvania'), PA_HISTORY],
      description: 'The 2004 navy/yellow base with a state outline added at the top left (KLF-0000 → MYR-0199); range as of late 2019. Outline position approximate.' },
    variants: PENNSYLVANIA },
  { code: 'RI', name: 'Rhode Island', serial: s.rhodeIsland, pattern: 'AA-999', design: { header: 'RHODE ISLAND', slogan: 'OCEAN STATE', text: '#1f3f8a', bg: ['#ffffff', '#cfe3f5'] } },
  { code: 'SC', name: 'South Carolina', serial: s.southCarolina, pattern: 'AAA 999', design: { header: 'SOUTH CAROLINA', slogan: 'WHILE I BREATHE I HOPE', text: NAVY, bg: ['#fff4dd', '#ffffff'] } },
  { code: 'SD', name: 'South Dakota', serial: s.southDakota, pattern: '9A9 999', design: { header: 'SOUTH DAKOTA', slogan: 'GREAT FACES. GREAT PLACES.', text: NAVY, bg: ['#dcebf8', '#fff'] } },
  { code: 'TN', name: 'Tennessee', serial: s.tennessee, pattern: 'AAA-999', design: { header: 'TENNESSEE', slogan: 'TNVACATION.COM', text: '#ffffff', bg: ['#244c8f', '#1b3c78'], headerColor: '#ffffff', sloganColor: '#ffffff' } },
  { code: 'TX', name: 'Texas', serial: s.texas, pattern: 'AAA-9999', design: { header: 'TEXAS', slogan: 'THE LONE STAR STATE', text: '#111111' } },
  { code: 'UT', name: 'Utah', serial: s.utah, pattern: 'A99 9AA', design: { header: 'UTAH', slogan: 'LIFE ELEVATED', text: '#1a1a1a', bg: ['#ffffff', '#f2c7a0'] } },
  { code: 'VT', name: 'Vermont', serial: s.vermont, pattern: 'AAA 999', design: { header: 'VERMONT', slogan: 'GREEN MOUNTAIN STATE', text: '#ffffff', bg: ['#16703f', '#0f5a32'], headerColor: '#ffffff', sloganColor: '#ffffff', frame: '#ffffff' } },
  { code: 'VA', name: 'Virginia', serial: s.virginia, pattern: 'AAA-9999', design: { header: 'Virginia', headerStyle: 'script', slogan: '', text: NAVY } },
  { code: 'WA', name: 'Washington', serial: s.washington, pattern: 'AAA9999', design: { header: 'Washington', headerStyle: 'script', slogan: 'EVERGREEN STATE', text: NAVY, bg: ['#ffffff', '#e6eef4'] } },
  { code: 'WV', name: 'West Virginia', serial: s.westVirginia, pattern: '9AA 999', design: { header: 'WEST VIRGINIA', slogan: 'ALMOST HEAVEN', text: NAVY, band: NAVY, bandPosition: 'top', headerColor: '#f2c14e' } },
  { code: 'WI', name: 'Wisconsin', serial: s.wisconsin, pattern: 'AAA-9999', design: { header: 'WISCONSIN', slogan: "AMERICA'S DAIRYLAND", text: NAVY, bg: ['#ffffff', '#f5e6c8'] } },
  { code: 'WY', name: 'Wyoming', serial: s.wyoming, pattern: '99-99999', design: { header: 'WYOMING', slogan: '', text: '#1a2a5e', bg: ['#ffffff', '#f3e6c9'] } },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', serial: s.puertoRico, pattern: 'AAA 999', design: PR_2023,
    standard: { label: 'Isla del Encanto (2023–)', period: [2023, 2026], shape: /^[A-Z]{3}[ -]\d{3}$/, references: [wiki('Puerto Rico')],
      description: 'Screened black on reflective white with the garita (sentry box) graphic; KBV 001 → KYN 025 as of Sept 2026. Early 2008-base plates used a dash, which validation also accepts.' } },
];

// Loose shape check for hand-edited serials: 2–8 characters, optional separators.
const US_SHAPE = /^(?=.{2,9}$)[A-Z0-9]+(?:[ \-·][A-Z0-9]+)*$/;

function variantFormat(v: Variant): PlateFormat {
  const format = serialFormat({ id: v.id, label: v.label, description: v.description, design: v.design, generate: v.serial, pattern: v.pattern, shape: v.shape, maxLength: 9 });
  return { ...format, ...(v.period && { period: v.period }), ...(v.status && { status: v.status }), ...(v.references && { references: v.references }) };
}

export const usRegions: Region[] = STATES.map((st) => ({
  id: `us-${st.code.toLowerCase()}`,
  name: st.name,
  code: st.code,
  group: 'North America',
  country: 'United States',
  flag: st.flag ?? '🇺🇸',
  ...(st.flag && { countryFlag: '🇺🇸' }),
  template: 'us',
  design: st.design,
  formats: [
    variantFormat({
      id: 'standard',
      label: 'Standard passenger',
      description: 'General-issue passenger plate using the state issuing range (late 2019).',
      serial: st.serial,
      pattern: st.pattern,
      shape: US_SHAPE,
      ...st.standard,
    }),
    ...(st.variants ?? []).map(variantFormat),
  ],
}));
