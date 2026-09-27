import type { Parts, PlateFormat, Region } from '../../core/types';
import { withLettering } from '../../core/lettering';
import type { Rng } from '../../core/random';
import { BC_RECONSTRUCTION_NOTE, BC_SOURCES, BC_YEARS, bcYear, type BcYear } from './bc-data';

/** Do not silently discard punctuation or arbitrary input. */
export function compactBcSerial(value: string): string | null {
  if (/^(?:[1-9]\d{0,5}|[A-Z][1-9]\d{0,3}|[1-9][A-Z]\d{1,3})$/.test(value)) return value;
  if (/^(?:[1-9]\d{0,2}-\d{3}|[A-Z]-[1-9]\d{0,2}|[A-Z][1-9]-\d{3}|[1-9][A-Z]-\d{1,3})$/.test(value)) return value.replace('-', '');
  return null;
}

/** BC's thousand separator is a small rectangular dash in the stamped dies. */
export function displayBcSerial(value: string, dashless = false): string {
  const raw = compactBcSerial(value);
  if (raw === null) return value;
  if (dashless) return raw;
  if (/^[1-9][A-Z]/.test(raw)) return `${raw.slice(0, 2)}-${raw.slice(2)}`;
  if (/^[A-Z]/.test(raw)) return raw.length <= 4 ? `${raw[0]}-${raw.slice(1)}` : `${raw.slice(0, -3)}-${raw.slice(-3)}`;
  return raw.length > 3 ? `${raw.slice(0, -3)}-${raw.slice(-3)}` : raw;
}

// Documented initial 1952 regional allocations, not every later over-run.
const regionalRanges: ReadonlyArray<readonly [string, number, number]> = [
  ['A', 1, 9], ['E', 1, 9], ['H', 1, 8], ['J', 1, 6],
  ['K', 1, 3], ['P', 1, 4], ['R', 1, 4], ['S', 1, 3], ['T', 1, 4],
];
const totemPrefixes = 'AEHJKPRSTU';

export function validateBcSerial(value: string, recipe: BcYear, dashless = false): string | null {
  const raw = compactBcSerial(value);
  if (raw === null) return 'Enter a positive serial without leading zeroes; use digits and a supported letter/dash position.';
  if (dashless) return /^1\d{3}$/.test(value) ? null : 'This no-dash variant models the documented 1000–1999 block. Enter four digits without a dash.';
  if (/^\d+$/.test(raw)) {
    const maxDigits = recipe.year <= 1948 || recipe.layout === 'totem-base' ? 5 : 6;
    return raw.length <= maxDigits ? null : `This base supports at most ${maxDigits} numeric digits.`;
  }
  if (recipe.layout === 'totem-base') {
    if (/^[A-Z][1-9]\d{0,3}$/.test(raw) && totemPrefixes.includes(raw[0])) return null;
    // W and Y over-runs were issued on 1952-style bases during the 1953/54 renewal years.
    if (recipe.year >= 1953 && /^[WY][1-9]\d{0,3}$/.test(raw)) return null;
    if (/^[1-9][AEHJKPRST]\d{1,3}$/.test(raw) && Number(raw.slice(2)) > 0) return null;
    return 'Supported 1952-base subset: 1–99999, A/E/H/J/K/P/R/S/T/U prefixes (W/Y from 1953), or regional letters in the second position. Suffix variants are not included.';
  }
  if (/^[A-Z][1-9]\d{0,3}$/.test(raw) && recipe.prefixes.includes(raw[0])) return null;
  return recipe.prefixes ? `Supported passenger prefixes for ${recipe.year}: ${recipe.prefixes.split('').join(', ')}.` : 'This format uses an all-numeric passenger serial.';
}

function generateSerial(recipe: BcYear, rng: Rng): string {
  if (recipe.layout === 'totem-base' && rng.chance(0.2)) {
    if (rng.chance(0.6)) {
      const prefix = rng.pick(totemPrefixes.slice(0, -1));
      return displayBcSerial(`${prefix}${rng.int(1, prefix === 'T' ? 4000 : 9999)}`);
    }
    const [letter, lo, hi] = rng.pick(regionalRanges);
    return `${rng.int(lo, hi)}${letter}-${rng.int(1, 999)}`;
  }
  if (recipe.prefixes && rng.chance(0.15)) return displayBcSerial(`${rng.pick(recipe.prefixes)}${rng.int(1, 999)}`);
  return displayBcSerial(String(rng.int(1, recipe.generationMax)));
}

function makeFormat(recipe: BcYear, dashless = false): PlateFormat {
  const hasTab = [1951, 1953, 1954].includes(recipe.year);
  return {
    id: `${recipe.year}${dashless ? '-no-dash' : ''}`,
    label: `${recipe.year}${dashless ? ' · no dash' : ''}`,
    pattern: dashless ? '1000–1999' : recipe.layout === 'totem-base' ? '12-345 / A1-234 / 1A-123'
      : recipe.prefixes ? `12-345 / ${recipe.prefixes[0]}1-234` : recipe.year <= 1951 ? '12-345 / 123-456' : '123-456',
    description: `${recipe.colourDescription}. ${recipe.note} ${BC_RECONSTRUCTION_NOTE}`,
    references: [BC_SOURCES[recipe.source]],
    fields: [
      { key: 'serial', label: 'Plate serial', maxLength: 7, placeholder: dashless ? '1877' : recipe.sample },
      ...(hasTab ? [{ key: 'tabSerial', label: 'Renewal tab number (optional)', maxLength: 6, placeholder: 'Separate from plate serial' }] : []),
      ...(hasTab ? [{ key: 'renewal', label: recipe.year === 1951 ? 'Renewal strip' : 'Renewal tab', preserveOnGenerate: true, options: [
        { value: 'on-plate', label: recipe.year === 1951 ? 'Bolted across the bottom' : 'Bolted over the 52 emblem' },
        { value: 'base-only', label: recipe.year === 1951 ? 'Hide strip · show 1950 base' : 'Hide tab · show 1952 base' },
        ...(recipe.year === 1951 ? [] : [{ value: 'blank-base', label: 'Hide tab · blank base (no 52 or emblem)' }]),
        { value: 'loose', label: recipe.year === 1951 ? 'Strip on its own' : 'Tab on its own' },
        ...(recipe.year === 1951 ? [{ value: 'top', label: 'Across the top (misapplied)' }] : []),
      ] }] : []),
      { key: 'finish', label: 'Rendering', preserveOnGenerate: true, options: [{ value: 'flat', label: 'Flat / editable SVG' }, { value: 'embossed', label: 'Subtle embossed preview' }] },
    ],
    design: { year: recipe.year, dashless },
    generate: (rng): Parts => ({ serial: dashless ? String(rng.int(1000, 1999)) : generateSerial(recipe, rng),
      ...(hasTab ? { tabSerial: '', renewal: 'on-plate' } : {}), finish: 'flat' }),
    validate: (parts) => {
      const serialError = validateBcSerial(parts.serial ?? '', recipe, dashless);
      if (serialError) return serialError;
      if (parts.finish !== undefined && !['flat', 'embossed'].includes(parts.finish)) return 'Choose flat or embossed rendering.';
      if (hasTab && parts.renewal !== undefined && !['on-plate', 'base-only', 'loose', ...(recipe.year === 1951 ? ['top'] : ['blank-base'])].includes(parts.renewal)) return 'Choose how the renewal piece is shown.';
      if (hasTab && parts.tabSerial && !/^[1-9]\d{5}$/.test(parts.tabSerial)) return 'Tab numbers must contain six digits, with no leading zero.';
      return null;
    },
    text: (parts) => displayBcSerial(parts.serial ?? '', dashless),
  };
}

export const britishColumbia: Region = {
  id: 'ca-bc', name: 'British Columbia', code: 'BC', group: 'Canada', flag: '🇨🇦',
  template: 'bc-historical', design: { year: 1940 },
  formats: [...BC_YEARS.map((year) => makeFormat(year)), makeFormat(bcYear(1962), true)].map(withLettering),
  notes: BC_RECONSTRUCTION_NOTE,
};
