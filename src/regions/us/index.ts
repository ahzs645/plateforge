import { serialFormat } from '../../core/format';
import type { Region } from '../../core/types';
import type { UsDesign } from '../../templates/us';
import * as s from './serials';

interface StateDef {
  code: string;
  name: string;
  serial: s.SerialFn;
  pattern: string;
  design: Partial<UsDesign> & Pick<UsDesign, 'header' | 'slogan'>;
}

const NAVY = '#1c2e6b';

// Colors / slogans approximate each state's current general-issue plate.
const STATES: StateDef[] = [
  { code: 'AL', name: 'Alabama', serial: s.alabama, pattern: '99AA999', design: { header: 'Alabama', headerStyle: 'script', headerColor: '#b0122b', slogan: 'Sweet Home Alabama', text: NAVY } },
  { code: 'AK', name: 'Alaska', serial: s.alaska, pattern: 'AAA 999', design: { header: 'ALASKA', slogan: 'THE LAST FRONTIER', bg: ['#f6d24a', '#e9b21c'], text: '#16357a', headerColor: '#16357a' } },
  { code: 'AZ', name: 'Arizona', serial: s.arizona, pattern: 'AAA9999', design: { header: 'ARIZONA', slogan: 'GRAND CANYON STATE', bg: ['#9fd0ec', '#f6dca9'], text: '#6b1d1d', headerColor: '#6b1d1d' } },
  { code: 'AR', name: 'Arkansas', serial: s.arkansas, pattern: '999 AAA', design: { header: 'ARKANSAS', slogan: 'THE NATURAL STATE', bg: ['#ffffff', '#cfe3f5'], text: '#b0122b' } },
  { code: 'CA', name: 'California', serial: s.california, pattern: '9AAA999', design: { header: 'California', headerStyle: 'script', headerColor: '#c8102e', slogan: 'DMV.CA.GOV', text: NAVY } },
  { code: 'CO', name: 'Colorado', serial: s.colorado, pattern: 'AAA-A99', design: { header: 'COLORADO', slogan: '', bg: ['#ffffff', '#ffffff'], band: '#0f6b3a', text: '#0f6b3a', headerColor: '#ffffff', bandPosition: 'top' } },
  { code: 'CT', name: 'Connecticut', serial: s.connecticut, pattern: 'AA·99999', design: { header: 'Connecticut', slogan: 'CONSTITUTION STATE', bg: ['#e4f1fb', '#ffffff'], text: '#1f3b73' } },
  { code: 'DE', name: 'Delaware', serial: s.delaware, pattern: '999999', design: { header: 'DELAWARE', slogan: 'THE FIRST STATE', bg: ['#1f2f5c', '#1f2f5c'], text: '#f2c14e', headerColor: '#f2c14e', sloganColor: '#f2c14e', frame: '#f2c14e' } },
  { code: 'DC', name: 'District of Columbia', serial: s.washingtonDc, pattern: 'AA-9999', design: { header: 'DISTRICT OF COLUMBIA', slogan: 'END TAXATION WITHOUT REPRESENTATION', text: '#b31942', headerColor: '#b31942', band: '#b31942', bandPosition: 'bottom', sloganColor: '#ffffff' } },
  { code: 'FL', name: 'Florida', serial: s.florida, pattern: 'Z99 9AA', design: { header: 'MYFLORIDA.COM', slogan: 'SUNSHINE STATE', text: '#006c3b', headerColor: '#006c3b', sloganColor: '#006c3b', accent: '#f39a1d' } },
  { code: 'GA', name: 'Georgia', serial: s.georgia, pattern: 'AAA9999', design: { header: 'GEORGIA', slogan: 'IN GOD WE TRUST', text: '#111111', accent: '#f6a36b' } },
  { code: 'HI', name: 'Hawaii', serial: s.hawaii, pattern: 'AAA 999', design: { header: 'HAWAII', slogan: 'ALOHA STATE', text: '#111111', accent: '#7a4ea3' } },
  { code: 'ID', name: 'Idaho', serial: s.idaho, pattern: '9A 99999', design: { header: 'IDAHO', slogan: 'FAMOUS POTATOES', text: NAVY, accent: '#b0122b' } },
  { code: 'IL', name: 'Illinois', serial: s.illinois, pattern: 'AA 99999', design: { header: 'Illinois', headerStyle: 'script', slogan: 'LAND OF LINCOLN', text: NAVY, headerColor: NAVY } },
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
  { code: 'NV', name: 'Nevada', serial: s.nevada, pattern: '999·A99', design: { header: 'NEVADA', slogan: 'THE SILVER STATE', text: '#1d2d5c', bg: ['#cfe0f2', '#f6e3c7'] } },
  { code: 'NH', name: 'New Hampshire', serial: s.newHampshire, pattern: '999 9999', design: { header: 'NEW HAMPSHIRE', slogan: 'LIVE FREE OR DIE', text: '#0e5a3a', headerColor: '#0e5a3a', sloganColor: '#0e5a3a' } },
  { code: 'NJ', name: 'New Jersey', serial: s.newJersey, pattern: 'A99-AAA', design: { header: 'NEW JERSEY', slogan: 'GARDEN STATE', text: '#111111', bg: ['#f8eaa6', '#f3dc7a'] } },
  { code: 'NM', name: 'New Mexico', serial: s.newMexico, pattern: '999-AAA', design: { header: 'NEW MEXICO', slogan: 'LAND OF ENCHANTMENT', text: '#b0122b', bg: ['#f8d93a', '#f2c318'], headerColor: '#b0122b', sloganColor: '#b0122b' } },
  { code: 'NY', name: 'New York', serial: s.newYork, pattern: 'AAA-9999', design: { header: 'NEW YORK', slogan: 'EXCELSIOR', text: NAVY, bg: ['#fdf7e1', '#f7d98a'], band: '#f3a712', bandPosition: 'bottom', sloganColor: NAVY } },
  { code: 'NC', name: 'North Carolina', serial: s.northCarolina, pattern: 'AAA-9999', design: { header: 'NORTH CAROLINA', slogan: 'FIRST IN FLIGHT', text: NAVY, accent: '#b0122b' } },
  { code: 'ND', name: 'North Dakota', serial: s.northDakota, pattern: '999 AAA', design: { header: 'NORTH DAKOTA', slogan: 'LEGENDARY', text: NAVY, bg: ['#ffffff', '#f3e4c4'] } },
  { code: 'OH', name: 'Ohio', serial: s.ohio, pattern: 'AAA 9999', design: { header: 'OHIO', slogan: 'BIRTHPLACE OF AVIATION', text: '#1a2a5e', bg: ['#dcebf8', '#fff3d6'] } },
  { code: 'OK', name: 'Oklahoma', serial: s.oklahoma, pattern: 'AAA-999', design: { header: 'OKLAHOMA', slogan: 'OK.GOV', text: '#1d2d5c', bg: ['#e8f1f8', '#ffffff'] } },
  { code: 'OR', name: 'Oregon', serial: s.oregon, pattern: '999 AAA', design: { header: 'OREGON', slogan: '', text: '#1b3a5b', accent: '#2e6b3a' } },
  { code: 'PA', name: 'Pennsylvania', serial: s.pennsylvania, pattern: 'AAA-9999', design: { header: 'PENNSYLVANIA', slogan: 'VISITPA.COM', text: NAVY, band: '#1c3f94', bandPosition: 'top', headerColor: '#f2c14e', accent: '#f2c14e' } },
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
];

// Loose shape check for hand-edited serials: 2–8 characters, optional separators.
const US_SHAPE = /^(?=.{2,9}$)[A-Z0-9]+(?:[ \-·][A-Z0-9]+)*$/;

export const usRegions: Region[] = STATES.map((st) => ({
  id: `us-${st.code.toLowerCase()}`,
  name: st.name,
  code: st.code,
  group: 'North America',
  country: 'United States',
  flag: '🇺🇸',
  template: 'us',
  design: st.design,
  formats: [
    serialFormat({
      id: 'standard',
      label: 'Standard passenger',
      description: 'General-issue passenger plate using the state issuing range (late 2019).',
      generate: st.serial,
      pattern: st.pattern,
      shape: US_SHAPE,
    }),
  ],
}));
