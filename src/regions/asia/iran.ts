import type { FieldDef, Parts, PlateFormat, Region } from '../../core/types';
import { IRAN_CODES, IRAN_FREE_ZONES, IRAN_MOTORCYCLE_CODES, IRAN_PRIVATE_LETTERS, IRAN_SOURCES } from './iran-data';
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_PRESET_ALIASES, IRAN_CUSTOM_CITIES, IRAN_CUSTOM_ZONES } from '../../templates/iran-custom-data';
import { IRAN_FONT_PROFILES } from '../../templates/iran-custom-fonts';
import { generateIranNumber, iranNumberFormat, validateIranNumberState } from '../../templates/iran-number-generation';
import type { IranCustomPreset } from '../../templates/iran-custom-types';
import { iranCustomizerState, renderIranCustom } from '../../templates/iran-custom-scene';
import {
  IRAN_IDENTIFIER_FIELDS, iranActiveFields, iranAppearanceParts, iranAvailableFontProfiles, iranStateForPlate, type IranIdentifierField,
} from '../../templates/iran-region-bridge';
import { asciiDigits, displayDigits, isDigits, normalizeLetter, randomDigits } from './plate-script';

const NOTE = 'Source-guided flat SVG reconstruction with licensed candidate glyphs and reconstructed artwork; dimensions and palettes are not certified production specifications. Validation is structural, not proof of issuance or a complete county/letter allocation check.';
const numberField = (key: string, label: string, length: number): FieldDef => ({ key, label, maxLength: length, uppercase: false, placeholder: '1'.repeat(length) });
const areaField: FieldDef = { key: 'code', label: 'Right-hand allocation code', options: IRAN_CODES };
const nationalCode: FieldDef = { key: 'code', label: 'Documented national starting code', options: [{ value: '11', label: '11 — starting national series; later codes not modelled' }] };
const ALL_CODES = new Set(IRAN_CODES.map((c) => c.value));

type Class = { id: string; label: string; letter?: string; bg: string; ink: string; national?: boolean; mission?: boolean; accessible?: boolean; note?: string };
const CLASSES: Class[] = [
  { id: 'private', label: 'Private', bg: '#fafaf6', ink: '#141414' },
  { id: 'accessible', label: 'Private · accessibility symbol', bg: '#fafaf6', ink: '#141414', accessible: true, note: 'The printed class mark is a drawn accessibility symbol; ژ is not printed as a substitute.' },
  { id: 'taxi', label: 'Taxi', letter: 'ت', bg: '#f3d344', ink: '#141414' },
  { id: 'public', label: 'Public transport', letter: 'ع', bg: '#f3d344', ink: '#141414' },
  { id: 'agricultural', label: 'Agricultural', letter: 'ک', bg: '#f3d344', ink: '#141414' },
  { id: 'government', label: 'Government', letter: 'الف', bg: '#b5292d', ink: '#ffffff', note: 'The series mark is the complete word الف, not an isolated ا.' },
  { id: 'police', label: 'Police', letter: 'پ', bg: '#17653f', ink: '#ffffff', national: true },
  { id: 'irgc', label: 'IRGC', letter: 'ث', bg: '#17653f', ink: '#ffffff', national: true },
  { id: 'army', label: 'Army', letter: 'ش', bg: '#c7b593', ink: '#141414', national: true },
  { id: 'defence', label: 'Ministry of Defence', letter: 'ز', bg: '#83b9d4', ink: '#ffffff', national: true },
  { id: 'staff', label: 'Armed Forces General Staff', letter: 'ف', bg: '#83b9d4', ink: '#ffffff', national: true },
  { id: 'diplomatic', label: 'Diplomatic · D', letter: 'D', bg: '#84bdd9', ink: '#141414', national: true, mission: true },
  { id: 'service', label: 'Consular / international services · S', letter: 'S', bg: '#84bdd9', ink: '#141414', national: true, mission: true },
];
const standard: PlateFormat[] = CLASSES.map((c) => ({
  id: `national-${c.id}`, label: c.label, family: c.national || c.id === 'government' ? 'official' : 'civilian',
  pattern: c.mission ? '99 D/S [mission 999] | 11' : '99 [class] 999 | 99', references: IRAN_SOURCES,
  description: `${c.note ?? ''} ${c.national ? 'This recipe models the documented starting national code 11, not a province; subsequent national series are not modelled.' : 'Codes may be shared, reallocated or depend on county and series letter.'} ${c.mission ? 'The three-digit block identifies a mission; it is not randomly generated. 214 is the documented German mission example; other mission identities remain unverified.' : 'Main serial digits exclude zero; allocated right-hand codes can contain zero.'} ${NOTE}`.trim(),
  fields: [
    numberField('prefix', 'First two serial digits', 2),
    ...(c.id === 'private' ? [{ key: 'letter', label: 'Private series', options: IRAN_PRIVATE_LETTERS.map((value) => ({ value, label: value })) }] : []),
    numberField(c.mission ? 'mission' : 'serial', c.mission ? 'Mission code (identity not verified)' : 'Three serial digits', 3),
    c.national ? nationalCode : areaField,
  ],
  generate: (rng) => ({ prefix: randomDigits(rng, 2, false), ...(c.id === 'private' ? { letter: rng.pick(IRAN_PRIVATE_LETTERS) } : {}),
    ...(c.mission ? { mission: '214' } : { serial: randomDigits(rng, 3, false) }), code: c.national ? '11' : rng.pick(IRAN_CODES).value }),
  validate: (p) => {
    if (!isDigits(p.prefix, 2, 2, false)) return 'Use two digits from 1–9; zero is excluded from the main serial.';
    if (c.id === 'private' && !IRAN_PRIVATE_LETTERS.some((letter) => letter === normalizeLetter(p.letter))) return 'Choose one of the 13 documented private-series letters.';
    if (!isDigits(c.mission ? p.mission : p.serial, 3, 3, !!c.mission)) return c.mission ? 'Use three digits for the mission identifier; its assignment is not verified here.' : 'Use three digits from 1–9; zero is excluded from the main serial.';
    if (c.national) return asciiDigits(p.code) === '11' ? null : 'This recipe covers the documented starting national code 11 only.';
    return ALL_CODES.has(asciiDigits(p.code)) ? null : 'Select an allocation code in the researched table.';
  },
  text: (p) => `${displayDigits(p.prefix ?? '', 'persian')} ${c.accessible ? '♿' : c.letter ?? normalizeLetter(p.letter)} ${displayDigits((c.mission ? p.mission : p.serial) ?? '', 'persian')} | ${displayDigits(p.code ?? '', 'persian')}`,
  design: { system: 'standard', vehicleClass: c.id, bg: c.bg, ink: c.ink, classLetter: c.letter, accessible: !!c.accessible, mission: !!c.mission },
}));

const retainedFormats: PlateFormat[] = [...standard,
    {
      id: 'protocol', label: 'Protocol · تشریفات', family: 'official', references: IRAN_SOURCES, pattern: '9999 · PROTOCOL',
      description: `Four-digit protocol arrangement with Persian and Latin legends, separate from the ordinary 2+letter+3+code system. Precise issue date is not asserted. ${NOTE}`,
      fields: [numberField('serial', 'Protocol number', 4)], generate: (rng) => ({ serial: randomDigits(rng, 4) }),
      validate: (p) => isDigits(p.serial, 4) ? null : 'Use four digits from 0–9 for this reconstruction.', text: (p) => `${displayDigits(p.serial ?? '', 'persian')} · تشریفات / PROTOCOL`,
      design: { system: 'protocol', bg: '#b5292d', ink: '#ffffff' },
    },
    {
      id: 'motorcycle', label: 'Motorcycle · two rows', family: 'motorcycle', references: IRAN_SOURCES, pattern: '999 / 99999',
      description: `Three-digit motorcycle allocation above a five-digit serial. Ranges skip every number containing zero. The drawing canvas is illustrative: physical dimensions are not verified. Issue date not asserted. ${NOTE}`,
      fields: [{ key: 'code', label: 'Motorcycle allocation', options: IRAN_MOTORCYCLE_CODES }, numberField('serial', 'Five-digit serial', 5)],
      generate: (rng) => ({ code: rng.pick(IRAN_MOTORCYCLE_CODES).value, serial: randomDigits(rng, 5, false) }),
      validate: (p) => !IRAN_MOTORCYCLE_CODES.some((c) => c.value === asciiDigits(p.code)) ? 'Select a documented motorcycle code.' : isDigits(p.serial, 5, 5, false) ? null : 'Use five digits from 1–9.',
      text: (p) => `${displayDigits(p.code ?? '', 'persian')} / ${displayDigits(p.serial ?? '', 'persian')}`, design: { system: 'motorcycle', bg: '#fafaf6', ink: '#141414' },
    },
    {
      id: 'free-zone-study', label: 'Free zone · local designs (legacy route)', family: 'free-zone', status: 'reproduction', references: IRAN_SOURCES, pattern: '99999 / same 99999 in Latin',
      description: `Legacy route retained for saved links. Seven zone choices now select their corresponding source-guided local composition and reconstructed emblem. These are local-generation designs, not the separate 2017 redesign. ${NOTE}`,
      fields: [{ key: 'zone', label: 'Free zone', options: IRAN_FREE_ZONES.map((value) => ({ value, label: value })) }, numberField('serial', 'Five-digit serial (both rows)', 5)],
      generate: (rng) => ({ zone: rng.pick(IRAN_FREE_ZONES), serial: randomDigits(rng, 5) }),
      validate: (p) => !IRAN_FREE_ZONES.some((z) => z === p.zone) ? 'Choose a documented free zone.' : isDigits(p.serial, 5) ? null : 'Use five digits from 0–9 for this local reconstruction.',
      text: (p) => `${p.zone ?? ''} · ${displayDigits(p.serial ?? '', 'persian')} / ${asciiDigits(p.serial)}`, design: { system: 'free-zone', bg: '#fafaf6', ink: '#141414' },
    },
];

/** These are evidence/coverage windows, not inferred redesigns or fleet-wide replacement dates. */
function chronology(preset: IranCustomPreset): Pick<PlateFormat, 'period' | 'era'> {
  if (preset.id.startsWith('historical-')) {
    const year = Number(preset.defaults.year) + 621;
    return { period: [year, year + 1], era: 'dated-city-initials' };
  }
  const windows: Record<string, readonly [number, number]> = {
    'full-city-1964': [1964, 1964], 'full-city-gilan': [1969, 1969], 'full-city-numeric': [1969, 1969],
    'full-city-letter': [1969, 1993], 'full-city-commercial': [1970, 1970],
    'consular-1960s': [1960, 1969], 'public-2002': [2002, 2003],
    'international-teh': [1969, 1998], 'international-teh-green': [1969, 1998],
    'international-thr': [1998, 2005], 'international-2010': [2010, 2010],
    'us-military': [1950, 1979], 'us-topographical': [1963, 1971], 'un-observer': [1988, 1991],
    'free-zone-old-qeshm': [2010, 2010],
  };
  if (preset.kind === 'national') {
    const classYear: Record<string, number> = { private: 2004, public: 2004, police: 2012, irgc: 2016, army: 2016, defence: 2016, staff: 2016, diplomatic: 2016, service: 2016 };
    const year = classYear[preset.defaults.vehicleClass];
    return year ? { period: [year, 2026], era: year === 2004 ? 'national-rollout' : 'national-official' } : {};
  }
  if (preset.kind === 'city-band') return { period: [1993, 2003], era: 'city-band' };
  const period = windows[preset.id];
  if (!period) return {}; // sortYear is a UI grouping hint, never evidence of an issue date.
  const era = preset.id.startsWith('full-city-') ? 'full-city'
    : preset.kind === 'international' ? 'foreign-travel'
    : preset.kind === 'military-old' || preset.kind === 'observer' ? 'foreign-forces'
    : preset.kind === 'consular-old' ? 'earlier-official'
    : preset.id === 'public-2002' ? 'parallel-transport' : 'local-free-zone';
  return { period, era };
}

function familyFor(preset: IranCustomPreset): string {
  if (preset.kind === 'motorcycle') return 'motorcycle';
  if (preset.kind.startsWith('free-zone-')) return 'free-zone';
  if (preset.kind === 'international') return 'foreign-travel';
  if (preset.kind === 'observer' || preset.kind === 'military-old') return 'foreign-forces';
  if (preset.kind === 'bilingual-2002') return 'parallel-transport';
  if (preset.kind === 'diplomatic-old' || preset.kind === 'consular-old' || preset.id === 'old-government' || preset.id === 'city-band-government') return 'official';
  return 'civilian';
}

function dateDescription(preset: IranCustomPreset): string {
  if (preset.kind === 'national') {
    if (['diplomatic', 'service'].includes(preset.defaults.vehicleClass)) return 'Unveiled 6 March 2016; operation was planned for Ordibehesht 1395 (April–May 2016). Unveiling is not proof of fleet-wide replacement completion.';
    if (['private', 'public'].includes(preset.defaults.vehicleClass)) return '2003 is a collector catalogue label. Radio Farda on 26 April 2004 reported rollout since Esfand 1382 (February–March 2004) and dimensions 520 × 110 mm. The dated span ends at the 2026 research cutoff, not withdrawal.';
    if (!chronology(preset).period) return 'National-era family; this class has no independently established launch date in the inspected sources. No shared introduction date is asserted.';
  }
  return `Source period: ${preset.period}. ${preset.dateNote}`;
}

const referencesFor = (preset: IranCustomPreset) => preset.sources.map(({ label: title, url }) => ({ title, url }));
const identifiersFor = (preset: IranCustomPreset): IranIdentifierField[] => IRAN_IDENTIFIER_FIELDS.filter((key) =>
  preset.fields.includes(key) && !(preset.id === 'full-city-gilan' && key === 'prefix'));

function identifierField(preset: IranCustomPreset, key: IranIdentifierField): FieldDef {
  if (key === 'city') return { key, label: 'Source-covered joined city legend', options: IRAN_CUSTOM_CITIES.filter(c => IRAN_FONT_PROFILES[preset.defaults.fontProfile].wordmarks[c.id]).map(c => ({ value: c.id, label: c.label })) };
  if (key === 'zone') return { key, label: 'Local free-zone design', options: IRAN_CUSTOM_ZONES.map((z) => ({ value: z.id, label: z.label })) };
  if (key === 'letter') {
    return { key, label: 'Source series / legend (assignment unverified)', options: iranNumberFormat(preset.defaults).letters.map(value => ({ value, label: value })) };
  }
  const labels: Record<Exclude<IranIdentifierField, 'city' | 'zone' | 'letter'>, string> = {
    serial: 'Serial number', prefix: preset.kind === 'temporary-old' ? 'Expiry month' : 'Prefix / numeric extension',
    code: preset.kind === 'temporary' ? 'Temporary code (assignment unverified)' : 'Numeric extension (assignment unverified)',
    year: 'Solar Hijri specimen / expiry year', expiry: 'Solar Hijri expiry (YYYY/MM)',
  };
  const rule = iranNumberFormat(preset.defaults).numeric.find(rule => rule.field === key);
  return { key, label: labels[key], maxLength: rule?.maxLength ?? 7, uppercase: false, placeholder: preset.defaults[key] };
}

function validateIdentifiers(preset: IranCustomPreset, fields: FieldDef[], parts: Parts): string | null {
  for (const field of fields) {
    if (parts[field.key] === undefined) return `Enter ${field.label.toLowerCase()}.`;
    const value = field.key === 'letter' ? normalizeLetter(parts[field.key]) : parts[field.key];
    if (field.options && !field.options.some((option) => option.value === value)) return `Choose a supplied ${field.label.toLowerCase()}.`;
  }
  return validateIranNumberState({ ...preset.defaults, ...parts }).errors[0] ?? null;
}

function recipeFor(preset: IranCustomPreset): PlateFormat {
  const fields = identifiersFor(preset).map((key) => identifierField(preset, key));
  return {
    id: preset.id, label: preset.label, family: familyFor(preset), ...chronology(preset),
    status: preset.confidence === 'disputed' || preset.confidence === 'provisional' ? 'uncertain' : 'reproduction',
    references: referencesFor(preset), pattern: preset.period,
    description: `${preset.evidence} ${dateDescription(preset)} ${NOTE} Generation uses the full format-permitted digit repertoire. Source-observed and stylistically inferred numeral forms are labelled separately. The Iran workshop offers explicit fallback for other supplied wordforms.`,
    fields,
    generate: (rng) => {
      const state = generateIranNumber(preset.defaults, rng);
      return Object.fromEntries(identifiersFor(preset).map(key => [key, state[key]]));
    },
    validate: (parts) => validateIdentifiers(preset, fields, parts),
    text: (parts) => fields.map((field) => {
      const value = parts[field.key] ?? '';
      if (field.key === 'city') return IRAN_CUSTOM_CITIES.find((c) => c.id === value)?.text ?? value;
      if (field.key === 'zone') return IRAN_CUSTOM_ZONES.find((z) => z.id === value)?.label ?? value;
      return displayDigits(value, preset.kind === 'international' || preset.kind === 'observer' ? 'latin' : 'persian');
    }).join(' · '),
    design: { customPreset: preset.id, missingPolicy: 'strict' },
  };
}

/** Typography, layout and palette controls from the Iran workshop, as Style fields kept through Generate. */
function appearanceFields(preset: IranCustomPreset): FieldDef[] {
  const state = iranCustomizerState(preset.id), active = iranActiveFields(state);
  const option = (value: string, label = value) => ({ value, label });
  const profiles = iranAvailableFontProfiles(state);
  const fonts = profiles.some((p) => p.id === state.fontProfile) ? profiles : [IRAN_FONT_PROFILES[state.fontProfile], ...profiles].filter(Boolean);
  const list: FieldDef[] = [
    { key: 'fontProfile', label: 'Main glyph profile', options: fonts.map((p) => option(p.id, p.label)) },
    { key: 'missingPolicy', label: 'Missing glyphs', options: [option('strict', 'Strict · mark missing shapes'), option('fallback', 'Fallback · labelled substitutes')] },
    { key: 'layout', label: 'Plate layout', options: [option('source', 'Source layout'), option('long', 'Long'), option('compact', 'Compact')] },
    ...(active.has('nationalVariant') && ['private', 'public'].includes(state.vehicleClass)
      ? [{ key: 'nationalVariant', label: 'National reference arrangement', options: [option('diagram', 'Class diagram'), option('early-photo', 'Early photograph')] }] : []),
    { key: 'aspectRatio', label: 'Width / height ratio (0 uses the preset)', input: 'range', min: 0, max: 6, step: 0.01 },
    { key: 'mainScale', label: 'Main lettering scale', input: 'range', min: 0.5, max: 1.4, step: 0.01 },
    { key: 'tracking', label: 'Letter spacing', input: 'range', min: -2, max: 60, step: 0.5 },
    { key: 'bg', label: 'Background', input: 'color' },
    { key: 'ink', label: 'Lettering', input: 'color' },
    ...(active.has('strip') ? [{ key: 'strip', label: 'Side / class band', input: 'color' as const }] : []),
    { key: 'border', label: 'Plate border', options: [option('on', 'Border'), option('off', 'No border')] },
  ];
  return list.map((field) => ({ ...field, preserveOnGenerate: true }));
}
function withAppearance(format: PlateFormat): PlateFormat {
  const requested = String(format.design?.customPreset ?? format.id);
  const preset = IRAN_CUSTOM_PRESETS.find((p) => p.id === (IRAN_CUSTOM_PRESET_ALIASES[requested] ?? requested))!;
  const extra = appearanceFields(preset), defaults = iranAppearanceParts(iranCustomizerState(preset.id));
  const appearance = Object.fromEntries(extra.map((field) => [field.key, defaults[field.key as keyof typeof defaults] ?? '']));
  return {
    ...format, fields: [...format.fields, ...extra],
    generate: (rng) => ({ ...appearance, ...format.generate(rng) }),
    // The scene also checks the chosen profile and palette, e.g. strict-mode glyphs the profile lacks.
    validate: (parts) => {
      const error = format.validate?.(parts) ?? null;
      if (error) return error;
      const state = iranStateForPlate(format.design ?? {}, parts);
      return state ? renderIranCustom(state).errors[0] ?? null : null;
    },
  };
}

const retainedIds = new Set(retainedFormats.map((format) => format.id));
export const iran: Region = {
  id: 'iran', name: 'Iran', code: 'IR', flag: '🇮🇷', group: 'Asia', template: 'ir', design: {},
  notes: `${NOTE} Dates distinguish specimen/tab years, collector attributions and documented announcements; they are not all issue intervals. Undated layouts stay undated. No general 1979 domestic redesign is inferred. 2026 is the research cutoff.`,
  families: [
    { id: 'civilian', label: 'Domestic / civilian', summary: 'City-initial specimens, full-city and city-band layouts, then the national system; undated special classes remain separate.' },
    { id: 'official', label: 'Official / diplomatic', summary: 'Earlier political/service layouts and separately reported modern class milestones.' },
    { id: 'motorcycle', label: 'Motorcycle' },
    { id: 'free-zone', label: 'Local free-zone designs', summary: 'Seven local compositions and a preserved legacy route. The 2017 common redesign still has a geometry barrier.' },
    { id: 'parallel-transport', label: 'Parallel bilingual transport' },
    { id: 'foreign-travel', label: 'Foreign-travel additional plates', summary: 'Supplementary Latin plates used alongside domestic registration, not replacements for it.' },
    { id: 'foreign-forces', label: 'Foreign forces / UN observers', summary: 'Collector-attributed foreign forces and UN mission periods are not domestic plate-era boundaries.' },
  ],
  eras: [
    { id: 'dated-city-initials', label: 'Dated city-initial specimens', period: [1947, 1964], family: 'civilian', summary: 'Solar Hijri year tabs span two Gregorian years; these are specimen dates, not annual nationwide redesigns.' },
    { id: 'full-city', label: 'Full-city domestic layouts', period: [1964, 1993], family: 'civilian', summary: 'Collector attributions with disputed boundaries. 1979 is not treated as an automatic domestic redesign.' },
    { id: 'city-band', label: 'City-band layouts', period: [1993, 2003], family: 'civilian', summary: '1993 and 1998 source labels conflict; old plates persisted during the phased national rollout.' },
    { id: 'city-band-official', label: 'City-band government layout', period: [1993, 2003], family: 'official', summary: 'Collector attribution, not a verified fleet-wide introduction.' },
    { id: 'national-rollout', label: 'National system · operational 2004', period: [2004, 2026], family: 'civilian', summary: '2003 catalogue label; contemporary reporting documents operation from February–March 2004 at 520 × 110 mm. Class-specific dates are not inferred.' },
    { id: 'earlier-official', label: 'Earlier official specimens', period: [1960, 1969], family: 'official' },
    { id: 'national-official', label: 'Modern official class milestones', period: [2012, 2026], family: 'official', summary: 'Police: 2012 report. Military: 2016 report. D/S: 6 March 2016 unveiling, April–May 2016 planned operation.' },
    { id: 'local-free-zone', label: 'Qeshm · circa 2010 specimen', period: [2010, 2010], family: 'free-zone' },
    { id: 'parallel-transport', label: 'AA bilingual public transport', period: [2002, 2003], family: 'parallel-transport' },
    { id: 'foreign-travel', label: 'Additional foreign-travel systems', period: [1969, 2010], family: 'foreign-travel', summary: 'Collector period labels and circa-2010 specimen attribution; domestic registration runs in parallel.' },
    { id: 'foreign-forces', label: 'Foreign forces and observer specimens', period: [1950, 1991], family: 'foreign-forces' },
  ],
  formats: [
    ...retainedFormats.map((format): PlateFormat => {
      const preset = IRAN_CUSTOM_PRESETS.find((p) => p.id === format.id);
      if (!preset) return {
        ...format,
        generate: (rng) => {
          const selected = format.generate(rng);
          const local = IRAN_CUSTOM_PRESETS.find(item => item.id === `free-zone-old-${selected.zone.toLowerCase()}`)!;
          return { ...selected, serial: generateIranNumber(local.defaults, rng).serial };
        },
        design: { system: 'free-zone', customPreset: 'free-zone-study' },
      };
      return { ...format, ...chronology(preset), references: referencesFor(preset),
        description: `${format.description} ${dateDescription(preset)}`,
        generate: (rng) => {
          // Retain original code/letter selection and mission semantics while using
          // the same full-repertoire numeric generator as the workshop.
          const selected = format.generate(rng);
          const state = generateIranNumber({ ...preset.defaults, ...selected, ...(selected.mission ? { serial: selected.mission } : {}) }, rng);
          return Object.fromEntries(format.fields.map(field => [field.key, field.key === 'mission' ? state.serial : state[field.key as IranIdentifierField]]));
        },
        validate: (parts) => format.validate?.(parts) ?? validateIranNumberState({ ...preset.defaults, ...parts, ...(parts.mission ? { serial: parts.mission } : {}) }).errors[0] ?? null,
        design: { ...format.design, bg: preset.defaults.bg, ink: preset.defaults.ink, customPreset: preset.id } };
    }),
    ...IRAN_CUSTOM_PRESETS.filter((preset) => !retainedIds.has(preset.id)).map((preset) => {
      const format = recipeFor(preset);
      return preset.id === 'city-band-government' ? { ...format, era: 'city-band-official' } : format;
    }),
  ].map(withAppearance),
  gaps: [
    { id: 'earliest-registration', label: 'Earliest registration · specimen barrier', period: [1920, 1946], family: 'civilian', sources: IRAN_SOURCES, note: 'Research window only. Early-registration claims do not supply authenticated plate geometry; earliest dated inspected specimen is 1326 SH (1947/48). No invented 1920s template.' },
    { id: 'free-zone-2017', label: '2017 common free-zone redesign · geometry barrier', period: [2017, 2026], family: 'free-zone', sources: [{ title: '2017 Qeshm pilot report', url: 'https://www.sarpoosh.com/car-news/automobile/automobile960502629.html' }], note: 'The 1 August 2017 pilot establishes 360 × 150 mm, bilingual numbers, emblem and class colours. The inspected report image is a generic placeholder, not a plate. Exact geometry, code arrangement and later zone-by-zone rollout remain unverified.' },
  ],
};
