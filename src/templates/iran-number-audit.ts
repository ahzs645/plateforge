/** Executable per-preset format/render audit, also used by the offline JSON report builder. */
import { createRng } from '../core/random';
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_CITIES } from './iran-custom-data';
import { IRAN_FONT_PROFILES } from './iran-custom-fonts';
import { iranCustomizerState, renderIranCustom } from './iran-custom-scene';
import { generateIranNumber, iranNumberFormat, validateIranNumberState, IRAN_NUMBER_BOUNDARY } from './iran-number-generation';
import type { IranCustomState } from './iran-custom-types';

export function buildIranNumberAudit() {
  const presets = IRAN_CUSTOM_PRESETS.map(preset => {
    const state = iranCustomizerState(preset.id), format = iranNumberFormat(state);
    const profile = IRAN_FONT_PROFILES[state.fontProfile];
    const checks: { name: string; expected: 'accept' | 'reject'; pass: boolean; values: Partial<IranCustomState>; validationErrors: string[]; renderErrors: string[]; usedProvenance: string[] }[] = [];
    const check = (name: string, input: IranCustomState, accept = true) => {
      const validation = validateIranNumberState(input), scene = renderIranCustom(input);
      checks.push({ name, expected: accept ? 'accept' : 'reject', pass: accept ? !validation.errors.length && !scene.errors.length : !!validation.errors.length && !!scene.errors.length, values: Object.fromEntries(preset.fields.filter(field => ['serial', 'prefix', 'letter', 'code', 'city', 'year', 'expiry', 'zone', 'vehicleClass'].includes(field)).map(field => [field, input[field]])), validationErrors: validation.errors, renderErrors: scene.errors, usedProvenance: [...new Set(scene.letteringUsage?.flatMap(role => role.provenance) ?? [])] });
    };
    check('source-default', state);
    for (const rule of format.numeric) {
      // Exercise every numeral in each unconstrained numeric field, not just the source digits.
      if (!rule.values && rule.min === undefined) for (const digit of '0123456789') check(`${rule.field}/digit-${digit}`, { ...state, [rule.field]: digit.repeat(rule.maxLength) }, rule.digits.includes(digit));
      if (rule.values) for (const value of [...new Set([rule.values[0], rule.values.at(-1)!])]) check(`${rule.field}/allocation-${value}`, { ...state, [rule.field]: value });
      if (rule.min !== undefined) for (const value of [rule.min, rule.max!]) check(`${rule.field}/range-${value}`, { ...state, [rule.field]: String(value) });
      check(`${rule.field}/empty`, { ...state, [rule.field]: '' }, false);
      check(`${rule.field}/too-long`, { ...state, [rule.field]: '1'.repeat(rule.maxLength + 1) }, false);
      check(`${rule.field}/nondigit`, { ...state, [rule.field]: 'x'.repeat(rule.maxLength) }, false);
      if (rule.values) check(`${rule.field}/unallocated`, { ...state, [rule.field]: '0'.repeat(rule.maxLength) }, false);
    }
    if (preset.fields.includes('letter') && (preset.kind !== 'national' || state.vehicleClass === 'private')) {
      for (const letter of format.letters) check(`letter/${letter}`, { ...state, letter });
      check('letter/unlisted', { ...state, letter: 'ZZZZ' }, false);
    }
    if (preset.fields.includes('year')) check('year/Gregorian-rejected', { ...state, year: '2026' }, false);
    if (preset.fields.includes('expiry')) {
      for (const expiry of ['1405/01', '1405/12', '۱۴۰۵/۰۷']) check(`expiry/${expiry}`, { ...state, expiry });
      for (const expiry of ['1405/00', '1405/13', '2026/07']) check(`expiry/reject-${expiry}`, { ...state, expiry }, false);
    }
    if (preset.fields.includes('city')) {
      for (const city of IRAN_CUSTOM_CITIES.filter(city => profile.wordmarks[city.id])) check(`city/covered-${city.id}`, { ...state, city: city.id });
      check('city/unknown', { ...state, city: 'unknown' }, false);
    }
    check('class/unsupported', { ...state, vehicleClass: 'unknown' }, false);
    for (const layout of ['long', 'compact'] as const) check(`layout/${layout}`, { ...state, layout });
    check('input/Persian-digits', { ...state, serial: state.serial.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]) });
    check('input/Arabic-Indic-digits', { ...state, serial: state.serial.replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]) });
    const rng = createRng(`iran-number-audit/${preset.id}`);
    for (let index = 0; index < 32; index++) check(`generated/${index + 1}`, generateIranNumber(state, rng));
    return {
      id: preset.id, label: preset.label, period: preset.period, sourceArtworks: preset.sourceArtworks,
      fields: preset.fields, format, mainProfile: profile.id,
      mainNumerals: Object.entries(profile.glyphs).filter(([digit]) => /^[0-9۰-۹]$/.test(digit)).map(([digit, glyph]) => ({ digit, provenance: glyph.provenance, sourceId: glyph.sourceId })),
      roleNumerals: Object.fromEntries(Object.entries(profile.roles ?? {}).map(([role, value]) => [role, Object.entries(value.glyphs).filter(([digit]) => /^[0-9۰-۹]$/.test(digit)).map(([digit, glyph]) => ({ digit, provenance: glyph.provenance, sourceId: glyph.sourceId }))])),
      yearBehavior: preset.fields.includes('year') ? 'Preserve valid printed Solar Hijri year; source-layout era is unchanged.' : preset.fields.includes('expiry') ? 'Preserve valid Solar Hijri YYYY/MM expiry; do not invent legal validity.' : 'No year field.',
      codeBehavior: format.numeric.find(rule => rule.field === 'code')?.meaning ?? 'No code field.',
      passed: checks.every(check => check.pass), checks,
    };
  });
  const checks = presets.flatMap(preset => preset.checks);
  return { schemaVersion: 1, boundary: IRAN_NUMBER_BOUNDARY, presetCount: presets.length, totalChecks: checks.length, passingChecks: checks.filter(check => check.pass).length, failedChecks: checks.filter(check => !check.pass).length, passed: presets.every(preset => preset.passed), presets };
}
