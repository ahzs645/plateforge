import type { FieldDef, PlateFormat, Region } from '../../core/types';
import { IRAQ_CLASSES, IRAQ_GOVERNORATES, IRAQ_LETTERS, IRAQ_SOURCES, iraqGovernorate } from './iraq-data';
import { asciiDigits, displayDigits, isDigits, randomDigits } from './plate-script';

const REVIEW_YEAR = 2026; // End of researched coverage, NOT a withdrawal date.
const NOTE = 'Original recipe preview: editable reconstruction: original approximate glyphs and screen colours, not measured manufacturing dies. Validation checks the documented pattern, not whether a registration was issued.';
const layout: FieldDef = { key: 'layout', label: 'Plate layout', preserveOnGenerate: true, options: [
  { value: 'long', label: 'Long · 520 × 110 mm' }, { value: 'compact', label: 'Compact · 335 × 155 mm' },
] };
const serial = (min: number, max: number): FieldDef => ({ key: 'serial', label: 'Serial (Latin or Arabic digits)', maxLength: max, uppercase: false, placeholder: '1'.repeat(min) });
const governors = (kr?: boolean, legacy = false) => IRAQ_GOVERNORATES.filter((g) =>
  (kr === undefined || g.kr === kr) && (!legacy || g.code !== '23'));
const provinceField = (kr?: boolean, legacy = false): FieldDef => ({ key: 'governorate', label: 'Governorate',
  options: governors(kr, legacy).map((g) => ({ value: g.code, label: `${g.code} — ${g.name} · ${g.arabic}` })),
});
const letterField = (letters: readonly string[]): FieldDef => ({ key: 'letter', label: 'Series letter', options: letters.map((value) => ({ value, label: value })) });
const MODERN_CLASSES = [...IRAQ_CLASSES, { id: 'temporary', label: 'Temporary', arabic: 'فحص مؤقت', colour: '#f8f8f3', ink: '#ad1e2b' }];

function modern(kr: boolean): PlateFormat[] {
  // Federal transitions retain the existing bilingual plate letter. KRG conversion is intentionally NOT implemented.
  const letters = kr ? [...'ABCDEFGHJKLM'] : IRAQ_LETTERS.map((l) => l.latin);
  return MODERN_CLASSES.map((c): PlateFormat => ({
    id: `${kr ? 'kr' : 'federal'}-modern-${c.id}`, label: `${kr ? 'Kurdistan · 2022' : 'Federal · 2024'} · ${c.label}`,
    family: kr ? 'kurdistan' : 'federal', era: kr ? 'kr-unified' : 'federal-unified', period: [kr ? 2022 : 2024, REVIEW_YEAR],
    pattern: kr ? 'GG L 99999' : 'GG L 1–5 digits', references: IRAQ_SOURCES,
    description: `${kr ? 'KRG introduction: April 2022; IRQ + KR strip. Five-digit number. No automatic conversion from the legacy six-digit system.' : 'Federal introduction: June 2024. Modern white face with class-coloured IRQ strip; short carried-over numbers are permitted.'} ${NOTE}`,
    fields: [provinceField(kr), letterField(letters), serial(kr ? 5 : 1, 5), layout],
    generate: (rng) => ({ governorate: rng.pick(governors(kr)).code, letter: rng.pick(letters), serial: randomDigits(rng, 5), layout: 'long' }),
    validate: (p) => {
      if (!governors(kr).some((g) => g.code === asciiDigits(p.governorate))) return 'Select a governorate from this issuing jurisdiction.';
      if (!letters.includes(p.letter)) return 'Select a documented series letter.';
      if (!isDigits(p.serial, kr ? 5 : 1, 5)) return kr ? 'Kurdistan serials need exactly five digits, including leading zeros.' : 'Use one to five digits; do not remove a carried-over leading zero.';
      return ['long', 'compact'].includes(p.layout) ? null : 'Choose long or compact layout.';
    },
    text: (p) => `${asciiDigits(p.governorate)} ${p.letter ?? ''} ${asciiDigits(p.serial)}${kr ? ' · IRQ/KR' : ' · IRQ'}`,
    design: { system: 'modern', kr, strip: c.colour, stripInk: c.ink, ink: c.id === 'temporary' ? c.ink : '#151515', vehicleClass: c.id },
  }));
}

const bilingualClasses = [...IRAQ_CLASSES,
  { id: 'construction', label: 'Construction', arabic: 'إنشائية', colour: '#247447', ink: '#ffffff' },
  { id: 'customs', label: 'Temporary customs clearance', arabic: 'ادخال كمرکي مؤقت', colour: '#e69331', ink: '#151515' },
];
const bilingual: PlateFormat[] = bilingualClasses.map((c) => {
  const national = ['government', 'customs'].includes(c.id);
  return {
    id: `bilingual-2008-${c.id}`, label: `2008 bilingual · ${c.label}`, family: 'federal', era: 'bilingual', period: [2008, 2024],
    pattern: 'L 99999 · Arabic + Latin', references: [IRAQ_SOURCES[0]],
    description: `335 × 155 mm; large Arabic serial, smaller matching Latin serial and lower class legend.${national ? ' No province name on this class.' : ''} ${NOTE}`,
    fields: [...(national ? [] : [provinceField(false)]), letterField(IRAQ_LETTERS.map((l) => l.latin)), serial(5, 5)],
    generate: (rng) => ({ ...(national ? {} : { governorate: rng.pick(governors(false)).code }), letter: rng.pick(IRAQ_LETTERS).latin, serial: randomDigits(rng, 5) }),
    validate: (p) => {
      if (!national && !governors(false).some((g) => g.code === asciiDigits(p.governorate))) return 'Select a federal governorate.';
      if (!IRAQ_LETTERS.some((l) => l.latin === p.letter)) return 'Select one of the 17 documented bilingual letter pairs.';
      return isDigits(p.serial, 5) ? null : 'Use exactly five digits.';
    },
    text: (p) => `${p.letter ?? ''} ${asciiDigits(p.serial)} · ${national ? c.label : iraqGovernorate(asciiDigits(p.governorate))?.name ?? ''}`,
    design: { system: 'bilingual', bg: c.colour, ink: c.ink, classLabel: c.arabic, national },
  };
});

function historical(id: string, label: string, period: readonly [number, number], system: 'legacy' | 'side', kr: boolean, bg = '#f8f8f3', ink = '#151515'): PlateFormat {
  const pool = governors(kr ? true : system === 'side' ? false : undefined, true);
  return {
    id, label, period, family: kr ? 'kurdistan' : 'federal', era: kr ? 'kr-legacy' : system === 'side' ? 'side-2001' : 'legacy-1988',
    references: [IRAQ_SOURCES[0]], pattern: '1–6 Arabic digits · province name',
    description: `${system === 'side' ? 'Attributed 2001 arrangement (family, not a verified issue date for every specimen): country above province at left; serial at right. Long geometry uses an illustrative 520 × 110 canvas, not a verified historical dimension.' : 'Legacy arrangement (introduction disputed: 1982 versus 1988): serial above a horizontal divider; province lower left and country lower right. Representative 335 × 155 canvas; historical dimensions varied.'} ${kr ? 'Erbil, Sulaymaniyah and Duhok only; no invented Halabja legacy allocation. ' : ''}${NOTE}`,
    fields: [{ key: 'governorate', label: 'Province', options: pool.map((g) => ({ value: g.code, label: `${g.name} · ${g.arabic}` })) }, serial(1, 6)],
    generate: (rng) => ({ governorate: rng.pick(pool).code, serial: randomDigits(rng, 6) }),
    validate: (p) => !pool.some((g) => g.code === asciiDigits(p.governorate)) ? 'Choose a documented province for this period.' : isDigits(p.serial, 1, 6) ? null : 'Use one to six digits.',
    text: (p) => `${displayDigits(p.serial ?? '', 'arabic')} · ${iraqGovernorate(asciiDigits(p.governorate))?.arabic ?? ''} · العراق`,
    design: { system, bg, ink, kr },
  };
}

/**
 * The original 27 Iraq recipes and their `iq` renderer (westasia-scene), kept for the Iraq/Iran research
 * preview and its tests. The app's Iraq region (./iraq) draws every design with the flat editor engine.
 */
export const iraqRecipes: Region = {
  id: 'iraq', name: 'Iraq', code: 'IRQ', flag: '🇮🇶', group: 'Asia', template: 'iq', design: {},
  notes: `${NOTE} Timeline ranges below are legacy recipe indexing, not proven introduction/withdrawal boundaries. Legacy start is disputed (1982/1988), and bilingual rollout is reported as 2008/2010. End 2026 means researched through 2026, not a retirement date.`,
  families: [{ id: 'federal', label: 'Federal / earlier national systems' }, { id: 'kurdistan', label: 'Kurdistan Region' }],
  eras: [
    { id: 'legacy-1988', label: 'Legacy divided · 1982/1988 disputed', period: [1988, 2001], family: 'federal' },
    { id: 'side-2001', label: 'Side legends · attributed 2001', period: [2001, 2008], family: 'federal' },
    { id: 'bilingual', label: 'Bilingual · 2008/2010 reported', period: [2008, 2024], family: 'federal' },
    { id: 'federal-unified', label: 'Unified Latin · federal', period: [2024, REVIEW_YEAR], family: 'federal' },
    { id: 'kr-legacy', label: 'Legacy divided · start disputed', period: [1988, 2022], family: 'kurdistan' },
    { id: 'kr-unified', label: 'Unified Latin · KRG', period: [2022, REVIEW_YEAR], family: 'kurdistan' },
  ],
  formats: [
    ...modern(false), ...modern(true), ...bilingual,
    historical('private-1988', 'Legacy divided · Private (attributed range)', [1988, 2001], 'legacy', false),
    historical('private-2001', 'Side legends · Private (attributed range)', [2001, 2008], 'side', false),
    historical('kr-legacy-private', 'KRG legacy · Private', [1988, 2022], 'legacy', true),
    historical('kr-legacy-hire', 'KRG legacy · For hire', [1988, 2022], 'legacy', true, '#ba242b', '#ffffff'),
    historical('kr-legacy-commercial', 'KRG legacy · Commercial', [1988, 2022], 'legacy', true, '#f1cb31'),
    historical('kr-legacy-police', 'KRG legacy · Police', [1988, 2022], 'legacy', true, '#2366ac', '#ffffff'),
    historical('kr-legacy-military', 'KRG legacy · Military', [1988, 2022], 'legacy', true, '#16452b', '#d8b754'),
    historical('kr-legacy-temporary', 'KRG legacy · Temporary', [1988, 2022], 'legacy', true, '#f8f8f3', '#ad1e2b'),
  ],
  gaps: [
    { id: 'pre-1988', label: 'Earlier Iraqi issues: reference audit pending', period: [1930, 1987], family: 'federal', sources: [IRAQ_SOURCES[0]], note: 'Research window only; this is not a claimed introduction date. WorldLicensePlates could not be retrieved in this review.' },
    { id: 'special-2008', label: 'Motorcycle / ICTS / further temporary issues', period: [2008, 2024], family: 'federal', sources: [IRAQ_SOURCES[0]], note: 'Illustration-based editable motorcycle, inspection-temporary and ICTS presets are now available through Iraq history. Exact physical dimensions and manufacturing dies remain unverified.' },
    { id: 'kr-international', label: 'KRG international and motorcycle variants', period: [1988, 2022], family: 'kurdistan', sources: [IRAQ_SOURCES[0]], note: 'Flat source-derived motorcycle and illustration-based international Erbil presets are available through Iraq history. Their date range is uncertain; this legacy interval is only an index.' },
  ],
};
