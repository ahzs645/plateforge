/** Shared source-bounded numbering rules. These validate a reconstruction format, never issuance. */
import { createRng, type Rng } from '../core/random';
import { IRAN_CODES, IRAN_MOTORCYCLE_CODES, IRAN_PRIVATE_LETTERS } from '../regions/asia/iran-data';
import { asciiDigits, normalizeLetter, randomDigits } from '../regions/asia/plate-script';
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_PRESET_ALIASES, IRAN_CUSTOM_CLASSES, IRAN_CUSTOM_CITIES, IRAN_CUSTOM_ZONES } from './iran-custom-data';
import type { IranCustomPreset, IranCustomState } from './iran-custom-types';

export type IranNumberField = 'serial' | 'prefix' | 'code' | 'year';
export interface IranNumberRule {
  field: IranNumberField;
  minLength: number;
  maxLength: number;
  digits: string;
  values?: readonly string[];
  min?: number;
  max?: number;
  generation: 'random' | 'preserve';
  meaning: string;
}
export interface IranNumberFormat {
  presetId: string;
  numeric: IranNumberRule[];
  letters: readonly string[];
  letterBoundary: string;
  classes: readonly string[];
  boundary: string;
}
export const IRAN_NUMBER_BOUNDARY = 'Valid means this researched reconstruction format only. It does not confirm a real registration, county/letter allocation, issue date or manufacturing specification.';
export const IRAN_NATIONAL_CLASS_IDS = ['private', 'accessible', 'taxi', 'public', 'agricultural', 'government', 'police', 'irgc', 'army', 'defence', 'staff', 'diplomatic', 'service'] as const;
const nationalStartingCode = new Set(['police', 'irgc', 'army', 'defence', 'staff', 'diplomatic', 'service']);
const nationalMission = new Set(['diplomatic', 'service']);
const allDigits = '0123456789';
const nonzeroDigits = '123456789';
function presetFor(id: string): IranCustomPreset | undefined {
  return IRAN_CUSTOM_PRESETS.find(preset => preset.id === (IRAN_CUSTOM_PRESET_ALIASES[id] ?? id));
}

export function iranNumberFormat(state: IranCustomState): IranNumberFormat {
  const preset = presetFor(state.presetId) ?? IRAN_CUSTOM_PRESETS[0];
  const national = preset.kind === 'national';
  const mission = national && nationalMission.has(state.vehicleClass);
  const nonzeroMain = (national && !mission) || ['temporary', 'motorcycle'].includes(preset.kind);
  const numeric: IranNumberRule[] = [{ field: 'serial', minLength: preset.defaults.serial.length, maxLength: preset.defaults.serial.length, digits: nonzeroMain ? nonzeroDigits : allDigits, generation: mission ? 'preserve' : 'random', meaning: mission ? 'Mission identifier; identity is not verified. Generation preserves it.' : 'Serial length of this source layout; not a claim about every historical issue.' }];
  if (preset.fields.includes('prefix')) {
    const month = preset.kind === 'temporary-old';
    numeric.push({ field: 'prefix', minLength: month ? 1 : preset.defaults.prefix.length, maxLength: month ? 2 : preset.defaults.prefix.length, digits: national || preset.kind === 'temporary' ? nonzeroDigits : allDigits, ...(month ? { min: 1, max: 12 } : {}), generation: month ? 'preserve' : 'random', meaning: month ? 'Solar Hijri expiry month, 1–12; preserved during generation.' : 'Numeric prefix / extension in the source arrangement.' });
  }
  if (preset.fields.includes('code')) {
    const values = national ? (nationalStartingCode.has(state.vehicleClass) ? ['11'] : IRAN_CODES.map(code => code.value)) : preset.kind === 'motorcycle' ? IRAN_MOTORCYCLE_CODES.map(code => code.value) : undefined;
    numeric.push({ field: 'code', minLength: preset.defaults.code.length, maxLength: preset.defaults.code.length, digits: preset.kind === 'motorcycle' ? nonzeroDigits : allDigits, ...(values ? { values } : {}), generation: 'preserve', meaning: national ? (nationalStartingCode.has(state.vehicleClass) ? 'Documented starting national code 11 only; later assignments are not modelled.' : 'Researched allocation table, with shared and historical exceptions; preserved during generation.') : preset.kind === 'motorcycle' ? 'Researched three-digit motorcycle allocation; preserved during generation.' : 'Source numeric extension / temporary code, not a verified modern provincial assignment; preserved during generation.' });
  }
  if (preset.fields.includes('year')) numeric.push({ field: 'year', minLength: 4, maxLength: 4, digits: allDigits, min: 1200, max: 1399, generation: 'preserve', meaning: 'Printed Solar Hijri specimen / expiry year, 1200–1399; preserved, not inferred from generation or converted to a redesign date.' });
  const selectedClass = IRAN_CUSTOM_CLASSES.find(item => item.id === state.vehicleClass);
  const letters: readonly string[] = national ? (state.vehicleClass === 'private' ? IRAN_PRIVATE_LETTERS : selectedClass && 'letter' in selectedClass ? [selectedClass.letter] : []) : preset.fields.includes('letter') ? [preset.defaults.letter] : [];
  return { presetId: preset.id, numeric, letters, letterBoundary: national ? (state.vehicleClass === 'private' ? '13 documented private-series letters; county/letter allocation not exhaustively modelled.' : state.vehicleClass === 'accessible' ? 'Drawn accessibility symbol; no substitute letter.' : 'Class fixes the printed series mark.') : letters.length ? 'Only the observed source legend / initial is supported for this preset. Other historical letter assignments are unverified.' : 'No editable letter in this arrangement.', classes: national ? IRAN_NATIONAL_CLASS_IDS : [preset.defaults.vehicleClass], boundary: IRAN_NUMBER_BOUNDARY };
}

function numberError(rule: IranNumberRule, input: string): string | undefined {
  const value = asciiDigits(String(input ?? '')).trim();
  const name = rule.field === 'serial' ? 'Serial' : rule.field === 'prefix' ? 'Prefix / month' : rule.field === 'year' ? 'Solar Hijri year' : 'Code';
  if (value.length < rule.minLength || value.length > rule.maxLength || [...value].some(digit => !rule.digits.includes(digit))) return `${name} requires ${rule.minLength === rule.maxLength ? rule.minLength : `${rule.minLength}–${rule.maxLength}`} ${rule.digits === nonzeroDigits ? 'nonzero digits (1–9; zero is excluded)' : 'digits (0–9)'} for this source layout.`;
  if (rule.values && !rule.values.includes(value)) return `${name} must be a supplied allocation for this format. ${rule.meaning}`;
  if ((rule.min !== undefined && Number(value) < rule.min) || (rule.max !== undefined && Number(value) > rule.max)) return `${name} must be from ${rule.min} to ${rule.max}.`;
  return undefined;
}

export function validateIranNumberState(state: IranCustomState): { errors: string[]; warnings: string[] } {
  const preset = presetFor(state.presetId);
  if (!preset) return { errors: ['Unknown preset. Restore a listed design.'], warnings: [] };
  const format = iranNumberFormat(state);
  const errors = format.numeric.flatMap(rule => { const error = numberError(rule, state[rule.field]); return error ? [error] : []; });
  const warnings: string[] = [];
  if (!format.classes.includes(state.vehicleClass)) errors.push('Choose a vehicle class supported by this preset.');
  if (preset.fields.includes('letter') && (preset.kind !== 'national' || state.vehicleClass === 'private') && !format.letters.some(letter => normalizeLetter(letter) === normalizeLetter(state.letter).trim())) errors.push(`Choose a supported series letter / source legend. ${format.letterBoundary}`);
  if (preset.fields.includes('city') && !IRAN_CUSTOM_CITIES.some(city => city.id === state.city)) errors.push('Choose a supplied complete joined city wordmark.');
  if (preset.fields.includes('zone') && !IRAN_CUSTOM_ZONES.some(zone => zone.id === state.zone)) errors.push('Choose a documented free zone.');
  if (preset.fields.includes('expiry') && !/^1[34]\d{2}\/(?:0?[1-9]|1[0-2])$/.test(asciiDigits(state.expiry).trim())) errors.push('Expiry must be a Solar Hijri year/month, such as 1405/07.');
  if (preset.kind === 'national' && nationalMission.has(state.vehicleClass)) warnings.push('Mission identifier is preserved, not randomly assigned. Editing its three digits does not verify a diplomatic mission identity.');
  if (preset.fields.includes('year') && asciiDigits(state.year).trim() !== preset.defaults.year) warnings.push('Edited Solar Hijri year is a reconstruction choice, not source evidence for this date or a redesign.');
  return { errors, warnings };
}

/** Fresh full-repertoire serials; appearance, allocations, dates and known mission identifiers stay put. */
export function generateIranNumber(state: IranCustomState, source: Rng | string | number = createRng()): IranCustomState {
  const preset = presetFor(state.presetId);
  if (!preset) throw new Error('Cannot generate an unknown Iran preset.');
  const rng = typeof source === 'object' ? source : createRng(source);
  const next = { ...state, presetId: preset.id };
  let format = iranNumberFormat(next);
  if (!format.classes.includes(next.vehicleClass)) next.vehicleClass = preset.defaults.vehicleClass;
  format = iranNumberFormat(next);
  for (const rule of format.numeric) {
    if (rule.generation === 'random') next[rule.field] = randomDigits(rng, rule.maxLength, rule.digits === allDigits);
    else if (numberError(rule, next[rule.field])) next[rule.field] = rule.values?.[0] ?? preset.defaults[rule.field];
  }
  // A one-digit specimen still visibly changes on repeated Generate clicks.
  const randomRule = format.numeric.find(rule => rule.generation === 'random');
  if (randomRule && format.numeric.filter(rule => rule.generation === 'random').every(rule => next[rule.field] === asciiDigits(state[rule.field]))) {
    const value = next[randomRule.field], last = value.at(-1)!;
    next[randomRule.field] = value.slice(0, -1) + randomRule.digits[(randomRule.digits.indexOf(last) + 1) % randomRule.digits.length];
  }
  if (preset.fields.includes('letter') && format.letters.length && !format.letters.some(letter => normalizeLetter(letter) === normalizeLetter(next.letter).trim())) next.letter = format.letters[0];
  if (preset.fields.includes('city') && !IRAN_CUSTOM_CITIES.some(city => city.id === next.city)) next.city = preset.defaults.city;
  if (preset.fields.includes('zone') && !IRAN_CUSTOM_ZONES.some(zone => zone.id === next.zone)) next.zone = preset.defaults.zone;
  if (preset.fields.includes('expiry') && !/^1[34]\d{2}\/(?:0?[1-9]|1[0-2])$/.test(asciiDigits(next.expiry).trim())) next.expiry = preset.defaults.expiry;
  return next;
}
