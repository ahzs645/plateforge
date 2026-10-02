/** Adapter between the ordinary Region/Parts contract and the Iran research renderer. */
import type { Design, Parts } from '../core/types';
import { normalizeLetter } from '../regions/asia/plate-script';
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_PRESET_ALIASES, IRAN_CUSTOM_ZONES } from './iran-custom-data';
import { IRAN_FONT_PROFILES, type IranFontProfile } from './iran-custom-fonts';
import { iranCustomizerState } from './iran-custom-scene';
import type { IranCustomState } from './iran-custom-types';

/** Identifiers are generated per plate; appearance is kept through Generate (preserveOnGenerate in the app). */
export const IRAN_IDENTIFIER_FIELDS = ['serial', 'prefix', 'letter', 'code', 'city', 'year', 'expiry', 'zone'] as const;
export type IranIdentifierField = typeof IRAN_IDENTIFIER_FIELDS[number];
export const IRAN_APPEARANCE_FIELDS = ['fontProfile', 'missingPolicy', 'layout', 'nationalVariant', 'aspectRatio', 'bg', 'ink', 'strip', 'tracking', 'mainScale', 'border'] as const;
export type IranAppearanceField = typeof IRAN_APPEARANCE_FIELDS[number];

/** Fields the preset's layout has a place for; the main app and the standalone editor share these rules. */
export function iranActiveFields(state: IranCustomState): Set<keyof IranCustomState> {
  const preset = IRAN_CUSTOM_PRESETS.find(item => item.id === state.presetId) ?? IRAN_CUSTOM_PRESETS[0];
  const fields = new Set(preset.fields);
  if (preset.kind === 'national' && state.vehicleClass !== 'private') fields.delete('letter');
  if (preset.kind === 'free-zone-old' && state.zone === 'qeshm') fields.delete('strip');
  return fields;
}
export function iranAvailableFontProfiles(state: IranCustomState, availableProfiles: IranFontProfile[] = Object.values(IRAN_FONT_PROFILES)) {
  const preset = IRAN_CUSTOM_PRESETS.find(item => item.id === state.presetId) ?? IRAN_CUSTOM_PRESETS[0];
  const latinOnly = ['international', 'observer'].includes(preset.kind);
  return availableProfiles.filter(profile => Object.keys(profile.glyphs).length > 0 && (latinOnly ? profile.script === 'latin' : profile.script === 'persian'));
}

/** Parts carry strings; only a value that parses to the state's own type is accepted. */
function parsedAppearance(state: IranCustomState, key: IranAppearanceField, value: string): unknown {
  const current = state[key];
  if (typeof current === 'number' || (key === 'aspectRatio' && current === undefined)) {
    const n = Number(value);
    return value.trim() !== '' && Number.isFinite(n) ? n : undefined;
  }
  if (typeof current === 'boolean') return value === 'on' ? true : value === 'off' ? false : undefined;
  return value;
}

export function iranStateForPlate(design: Design, parts: Parts = {}): IranCustomState | undefined {
  if (typeof design.customPreset !== 'string') return undefined;
  let presetId = IRAN_CUSTOM_PRESET_ALIASES[design.customPreset] ?? design.customPreset;
  const zone = IRAN_CUSTOM_ZONES.find((z) => z.id === parts.zone || z.label === parts.zone);
  if (presetId.startsWith('free-zone-old-') && zone) presetId = `free-zone-old-${zone.id}`;
  const preset = IRAN_CUSTOM_PRESETS.find((p) => p.id === presetId);
  if (!preset) return undefined;
  const state = iranCustomizerState(presetId);
  for (const key of IRAN_IDENTIFIER_FIELDS) {
    if (parts[key] !== undefined && preset.fields.includes(key)) state[key] = parts[key];
  }
  // Existing D/S routes deliberately call this a mission identifier, not a serial.
  if (parts.mission !== undefined && ['diplomatic', 'service'].includes(state.vehicleClass)) state.serial = parts.mission;
  if (preset.fields.includes('letter')) state.letter = normalizeLetter(state.letter);
  // Existing serial data uses ه; the national plate prints the connected plate-form هـ.
  if (preset.kind === 'national' && state.vehicleClass === 'private' && state.letter === 'ه') state.letter = 'هـ';
  if (zone && preset.fields.includes('zone')) state.zone = zone.id;
  for (const key of IRAN_APPEARANCE_FIELDS) {
    const value = design[key];
    // Only typed appearance overrides are accepted, never serial/class data from Design.
    if (value !== undefined && typeof value === typeof state[key]) Object.assign(state, { [key]: value });
  }
  // Inspector edits arrive as Parts strings and take precedence over Design.
  for (const key of IRAN_APPEARANCE_FIELDS) {
    const value = parts[key];
    if (value === undefined) continue;
    const parsed = parsedAppearance(state, key, value);
    if (parsed !== undefined) Object.assign(state, { [key]: parsed });
  }
  return state;
}

/** Appearance of a state as Parts strings, the inverse of the parsing above. */
export function iranAppearanceParts(state: IranCustomState): Partial<Record<IranAppearanceField, string>> {
  return Object.fromEntries(IRAN_APPEARANCE_FIELDS.filter((key) => state[key] !== undefined)
    .map((key) => [key, typeof state[key] === 'boolean' ? (state[key] ? 'on' : 'off') : String(state[key])]));
}

/** renderIranCustom owns one complete SVG; the React template owns the outer element. Many plates share a
 * page (timeline, gallery), so the embedded settings metadata carries no id. */
export function iranSvgBody(svg: string): string {
  const match = /^<svg\b[^>]*>([\s\S]*)<\/svg>$/.exec(svg);
  if (!match) throw new Error('Iran renderer did not return a complete SVG');
  return match[1].replace('<metadata id="plateforge-iran-settings">', '<metadata data-role="plateforge-iran-settings">');
}
