import type { FieldDef, PlateFormat, Region } from '../../core/types';
import { IRAN_CODES, IRAN_FREE_ZONES, IRAN_MOTORCYCLE_CODES, IRAN_PRIVATE_LETTERS, IRAN_SOURCES } from './iran-data';
import { asciiDigits, displayDigits, isDigits, normalizeLetter, randomDigits } from './plate-script';

const NOTE = 'Original geometric glyph reconstruction; colours and small artwork are approximations. Validation is structural, not proof of issuance or a complete county/letter allocation check.';
const numberField = (key: string, label: string, length: number): FieldDef => ({ key, label, maxLength: length, uppercase: false, placeholder: '1'.repeat(length) });
const areaField: FieldDef = { key: 'code', label: 'Right-hand allocation code', options: IRAN_CODES };
const nationalCode: FieldDef = { key: 'code', label: 'Documented national starting code', options: [{ value: '11', label: '11 — starting national series; later codes not modelled' }] };
const ALL_CODES = new Set(IRAN_CODES.map((c) => c.value));

type Class = { id: string; label: string; letter?: string; bg: string; ink: string; year?: number; national?: boolean; mission?: boolean; accessible?: boolean; note?: string };
const CLASSES: Class[] = [
  { id: 'private', label: 'Private', bg: '#fafaf6', ink: '#141414' },
  { id: 'accessible', label: 'Private · accessibility symbol', bg: '#fafaf6', ink: '#141414', accessible: true, note: 'The printed class mark is a drawn accessibility symbol; ژ is not printed as a substitute.' },
  { id: 'taxi', label: 'Taxi', letter: 'ت', bg: '#f3d344', ink: '#141414' },
  { id: 'public', label: 'Public transport', letter: 'ع', bg: '#f3d344', ink: '#141414' },
  { id: 'agricultural', label: 'Agricultural', letter: 'ک', bg: '#f3d344', ink: '#141414' },
  { id: 'government', label: 'Government', letter: 'الف', bg: '#b5292d', ink: '#ffffff', note: 'The series mark is the complete word الف, not an isolated ا.' },
  { id: 'police', label: 'Police', letter: 'پ', bg: '#17653f', ink: '#ffffff', year: 2012, national: true },
  { id: 'irgc', label: 'IRGC', letter: 'ث', bg: '#17653f', ink: '#ffffff', year: 2016, national: true },
  { id: 'army', label: 'Army', letter: 'ش', bg: '#c7b593', ink: '#141414', year: 2016, national: true },
  { id: 'defence', label: 'Ministry of Defence', letter: 'ز', bg: '#83b9d4', ink: '#ffffff', year: 2016, national: true },
  { id: 'staff', label: 'Armed Forces General Staff', letter: 'ف', bg: '#83b9d4', ink: '#ffffff', year: 2016, national: true },
  { id: 'diplomatic', label: 'Diplomatic · D', letter: 'D', bg: '#84bdd9', ink: '#141414', year: 2016, national: true, mission: true },
  { id: 'service', label: 'Consular / international services · S', letter: 'S', bg: '#84bdd9', ink: '#141414', year: 2016, national: true, mission: true },
];
const standard: PlateFormat[] = CLASSES.map((c) => ({
  id: `national-${c.id}`, label: c.label, family: c.national || c.id === 'government' ? 'official' : 'civilian',
  period: [c.year ?? 2005, 2026], pattern: c.mission ? '99 D/S [mission 999] | 11' : '99 [class] 999 | 99', references: IRAN_SOURCES,
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

export const iran: Region = {
  id: 'iran', name: 'Iran', code: 'IR', flag: '🇮🇷', group: 'Asia', template: 'ir', design: {},
  notes: `${NOTE} 2005 is the cited European-size introduction, not a claim that every class started together. Timeline end 2026 is the research cutoff, not withdrawal.`,
  families: [{ id: 'civilian', label: 'Civilian' }, { id: 'official', label: 'Official / diplomatic' }, { id: 'motorcycle', label: 'Motorcycle' }, { id: 'free-zone', label: 'Free-zone layout studies' }],
  formats: [...standard,
    {
      id: 'protocol', label: 'Protocol · تشریفات', family: 'official', references: IRAN_SOURCES, pattern: '9999 · PROTOCOL',
      description: `Four-digit protocol arrangement with Persian and Latin legends, separate from the ordinary 2+letter+3+code system. Precise issue date is not asserted. ${NOTE}`,
      fields: [numberField('serial', 'Protocol number', 4)], generate: (rng) => ({ serial: randomDigits(rng, 4, false) }),
      validate: (p) => isDigits(p.serial, 4, 4, false) ? null : 'Use four digits from 1–9.', text: (p) => `${displayDigits(p.serial ?? '', 'persian')} · تشریفات / PROTOCOL`,
      design: { system: 'protocol', bg: '#b5292d', ink: '#ffffff' },
    },
    {
      id: 'motorcycle', label: 'Motorcycle · two rows', family: 'motorcycle', references: IRAN_SOURCES, pattern: '999 / 99999',
      description: `Three-digit motorcycle allocation above a five-digit serial. Ranges skip every number containing zero. The 200 × 150 drawing canvas is illustrative: physical dimensions are not verified. Issue date not asserted. ${NOTE}`,
      fields: [{ key: 'code', label: 'Motorcycle allocation', options: IRAN_MOTORCYCLE_CODES }, numberField('serial', 'Five-digit serial', 5)],
      generate: (rng) => ({ code: rng.pick(IRAN_MOTORCYCLE_CODES).value, serial: randomDigits(rng, 5, false) }),
      validate: (p) => !IRAN_MOTORCYCLE_CODES.some((c) => c.value === asciiDigits(p.code)) ? 'Select a documented motorcycle code.' : isDigits(p.serial, 5, 5, false) ? null : 'Use five digits from 1–9.',
      text: (p) => `${displayDigits(p.code ?? '', 'persian')} / ${displayDigits(p.serial ?? '', 'persian')}`, design: { system: 'motorcycle', bg: '#fafaf6', ink: '#141414' },
    },
    {
      id: 'free-zone-study', label: 'Free zone · schematic (logos pending)', family: 'free-zone', status: 'reproduction', references: IRAN_SOURCES, pattern: '99999 / same 99999 in Latin',
      description: `Not a finished reproduction or an official prototype. Seven zone choices share a study layout; official zone emblems, precise lettering, and zone-specific differences are missing. The logo area is explicitly marked pending. ${NOTE}`,
      fields: [{ key: 'zone', label: 'Free zone', options: IRAN_FREE_ZONES.map((value) => ({ value, label: value })) }, numberField('serial', 'Five-digit serial (both rows)', 5)],
      generate: (rng) => ({ zone: rng.pick(IRAN_FREE_ZONES), serial: randomDigits(rng, 5, false) }),
      validate: (p) => !IRAN_FREE_ZONES.some((z) => z === p.zone) ? 'Choose a documented free zone.' : isDigits(p.serial, 5, 5, false) ? null : 'Use five digits from 1–9.',
      text: (p) => `${p.zone ?? ''} · ${displayDigits(p.serial ?? '', 'persian')} / ${asciiDigits(p.serial)}`, design: { system: 'free-zone', bg: '#fafaf6', ink: '#141414' },
    },
  ],
  gaps: [
    { id: 'pre-national', label: 'Pre-national city-name / older issues', period: [1930, 2002], family: 'civilian', sources: IRAN_SOURCES, note: 'Research window, not an established introduction date. No invented historical colour/year sequence.' },
    { id: '2003-2004', label: '2003 system vs 2005 European dimensions', period: [2003, 2004], family: 'civilian', sources: IRAN_SOURCES, note: 'Source descriptions refer to different milestones; early layout requires specimen-based confirmation.' },
    { id: 'temporary', label: 'Temporary passage · گ', period: [2005, 2026], family: 'civilian', sources: IRAN_SOURCES, note: 'Expiry panel and previous arrangement need a separate reference audit; not a recolour of the regular plate.' },
    { id: 'historic-vehicle', label: 'Historic vehicle · تاریخی', period: [2005, 2026], family: 'civilian', sources: IRAN_SOURCES, note: 'Coverage window only, not an issue date. Brown plate and Bagh-e Melli artwork require their own source-grounded vector master.' },
    { id: 'earlier-diplomatic', label: 'Earlier political / service formats', period: [2005, 2015], family: 'official', sources: IRAN_SOURCES, note: 'Do not project the post-March-2016 D/S system backward.' },
  ],
};
