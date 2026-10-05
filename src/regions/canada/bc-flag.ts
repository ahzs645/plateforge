/**
 * 1985 flag base: "Beautiful British Columbia" in a serif above an embossed
 * serial split by the waving flag, on white reflective sheeting. One recipe per
 * serial generation; artwork, dies and wells are shared.
 * Sources: BCpl8s passenger chapters 1985–2001, 2001–2014, 2014–2025, 2025.
 * Geometry measured from BM0-34A (2016, straight-on photograph).
 */
import type { PlateFormat } from '../../core/types';
import type { KitDecal, KitRecipe } from '../../templates/bc/kit';
import { BC_AK, BC_LX, kitFormat } from './bc-kit';

const source = (period: string) => ({ title: `BCpl8s · Passenger ${period.replace('-', '–')}`, url: `https://www.bcpl8s.ca/Passenger-${period}.html` });
const SERIAL_BLUE = '#1a45a0', LEGEND_BLUE = '#2b7cd1', SHEETING = '#eef2f5', RIM = '#c5cfda';
const FLAG_NOTE = 'Flag-base reconstruction: flat screened slogan and flag, embossed serial. The slogan uses a serif typeface as a stand-in; flag artwork, paint and dies are approximate. Validation checks the documented block pattern, not a real registration.';

const singleWell: KitDecal = { x: 94.5, y: 115, width: 112.5, height: 29, rx: 2 };
const dayWell: KitDecal = { x: 97.5, y: 116, width: 34.5, height: 29, rx: 2 };
const monthWell: KitDecal = { x: 136.5, y: 116, width: 70.5, height: 29, rx: 2 };

function flagRecipe(id: string, label: string, die: string, period: string, dualWells: boolean): KitRecipe {
  return {
    id, label, width: 300, height: 150, radius: 7, background: SHEETING, ink: SERIAL_BLUE,
    rim: { inset: 4.5, width: 1.2, color: RIM }, holes: 'slots', holeAt: { x: [0.21, 0.79], y: [0.113, 0.88] },
    legends: [],
    fontLegends: [{ text: 'Beautiful British Columbia', x: 150, baseline: 39, size: 19.5, width: 237, font: 'serif', color: LEGEND_BLUE, role: 'slogan' }],
    serial: { x: 150, baseline: 109.5, cap: 64, maxWidth: 268, die, color: SERIAL_BLUE,
      researchFormats: { 'bc-astro-4': '1985-flag', 'bc-waldale': '2001-flag' },
      separator: { kind: 'art', gap: 2.5, art: { art: 'bc-spirit-flag', x: 0, y: 63, width: 42, height: 32 } } },
    decal: dualWells ? monthWell : singleWell,
    extraWells: dualWells ? [dayWell] : [],
    embossed: true, source: source(period), note: FLAG_NOTE,
  };
}

const ASTRO = [
  { id: 'bc-astro-4', label: 'Astrographic · Classic (most of the contract)' },
  { id: 'bc-astro-1', label: 'Astrographic · male/female (1985–86)' },
  { id: 'bc-astro-2', label: 'Astrographic · neoprene-top' },
  { id: 'bc-astro-3', label: 'Astrographic · non-passenger (N/P block)' },
  { id: 'bc-waldale', label: 'Waldale test run (KRL–ARC, 1998–99)' },
];
const sets = { a: BC_AK, l: BC_LX };

export const bcFlagFormats: PlateFormat[] = [
  kitFormat({
    id: '1985-flag', label: '1985 flag · AAA-999', family: 'passenger', period: [1985, 2001], era: 'flag-1985',
    recipe: flagRecipe('flag-1985', '1985 flag base · AAA-999', 'bc-astro-4', '1985-2001', false),
    grammar: { sets, hint: 'AAA-999 in the eight documented letter blocks (LAA … KXK)',
      blocks: ['{l}{a}{a}', '{l}{l}{a}', '{l}{l}{l}', '{l}{a}{l}', '{a}{a}{a}', '{a}{a}{l}', '{a}{l}{l}', '{a}{l}{a}'].map((p) => ({ pattern: `${p}-999` })) },
    dies: ASTRO, decals: [1985, 2001],
    description: 'Letters-first serials from LAA-000 (July 1985) through eight blocks of a million to KXK-999 (2001). Astrographic made the plates; its male/female, neoprene-top, non-passenger and Classic dies are selectable, plus the brief Waldale test run. One bottom-centre decal well.',
  }),
  kitFormat({
    id: '2001-flag', label: '2001 flag · 999-AAA', family: 'passenger', period: [2001, 2014], era: 'flag-1985',
    recipe: flagRecipe('flag-2001', '2001 flag base · 999-AAA', 'bc-waldale', '2001-2014', false),
    grammar: { sets, hint: '999-AAA in the documented letter blocks (000-AAA … 999-MXX)',
      blocks: ['{a}{a}{a}', '{a}{a}{l}', '{a}{l}{a}', '{a}{l}{l}', '{l}{a}{a}', '{l}{a}{l}', '{l}{l}{a}', '{l}{l}{l}'].map((p) => ({ pattern: `999-${p}` })),
      avoid: (serial) => serial.startsWith('4') },
    dies: [{ id: 'bc-waldale', label: 'Waldale (from 000-HGA, Dec 2002)' }, { id: 'bc-astro-4', label: 'Astrographic · Classic (000-AAA to 999-HFK)' }], decals: [2001, 2014],
    description: 'Numbers-first serials from 000-AAA (May 2001); Waldale took over at 000-HGA in December 2002, with exceptions either side. Numbers 400–499 were withheld from about 2007, so the generator avoids them. The series ended with the leftover Olympic block 000-MJG … 999-MXX in 2014.',
  }),
  kitFormat({
    id: '2013-flag-dual', label: '2013 flag · two wells', family: 'passenger', period: [2013, 2014], era: 'flag-1985',
    recipe: flagRecipe('flag-2013', '2013 flag base · two decal wells', 'bc-waldale', '2001-2014', true),
    grammar: { sets, hint: '999-AAA, late blocks (from about 003-NWW)', blocks: [{ pattern: '999-{l}{l}{l}' }, { pattern: '999-M{l}{l}' }] }, decals: [2013, 2014],
    description: 'From 27 April 2013 (between 891-NWT and 003-NWW) the base has two wells: a small one for the day sticker and a larger one for the month/year decal.',
  }),
  kitFormat({
    id: '2014-flag', label: '2014 flag · AA9-99A', family: 'passenger', period: [2014, 2025], era: 'flag-1985',
    recipe: flagRecipe('flag-2014', '2014 flag base · AA9-99A', 'bc-waldale', '2014-2025', true),
    grammar: { sets: { f: 'ABCDEFGHJKLMNSTVWX', s: BC_AK + BC_LX }, hint: 'AA9-99A (first letters A–N, S–X; P and R went to BC Parks plates)',
      blocks: [{ pattern: '{f}{s}9-99{s}' }] }, decals: [2014, 2023],
    description: 'Mixed serials from AA0-00A (August 2014), one block per first letter through XA (January 2025). The P and R blocks were used on the BC Parks base. Two decal wells until the boxes were dropped after SF9-99X (2022); later plates have none.',
  }),
  kitFormat({
    id: '2025-flag', label: '2025 flag · A99-9AA', family: 'passenger', period: [2025, 2026], era: 'flag-1985',
    recipe: { ...flagRecipe('flag-2025', '2025 flag base · A99-9AA', 'bc-waldale', '2025', false), decal: null, extraWells: [] },
    grammar: { sets: { z: `${BC_AK}${BC_LX}UYZ` }, hint: 'A99-9AA (A block from August 2025; B projected for June 2026; U, Y and Z now used)',
      blocks: [{ pattern: '\\A99-9{z}{z}' }, { pattern: 'B99-9{z}{z}' }] },
    description: 'ICBC’s 2025 configuration: same design, reflectivity and materials, with U, Y and Z added. Decal wells were dropped after SF9-99X in 2022, so none are drawn.',
  }),
];
