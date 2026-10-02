/**
 * Iraq in the main editor: every flat-editor preset is a format, dated by the source-reviewed chronology
 * (templates/iraq-custom-timeline.ts) and drawn by the flat parametric engine (template `iq-flat`).
 * Format ids are the preset ids, so `#/iraq/<preset-id>` opens the same design the standalone editor does.
 */
import type { FieldDef, PlateEra, PlateFormat, Region } from '../../core/types';
import type { Rng } from '../../core/random';
import { IRAQ_FONT_PROFILES } from '../../templates/iraq-custom-fonts';
import {
  IRAQ_CUSTOM_CLASSES, IRAQ_CUSTOM_PRESETS, IRAQ_CUSTOM_PROVINCES, iraqActiveFields, iraqCustomParts,
  iraqCustomStateFromParts, renderIraqCustom, type IraqCustomPreset, type IraqCustomState,
} from '../../templates/iraq-custom-scene';
import {
  IRAQ_TIMELINE_ENTRIES, IRAQ_TIMELINE_ERAS, IRAQ_TIMELINE_EVIDENCE_LABELS, IRAQ_TIMELINE_GAPS,
  type IraqTimelineEntry, type IraqTimelineSource,
} from '../../templates/iraq-custom-timeline';
import { IRAQ_GOVERNORATES, IRAQ_LETTERS } from './iraq-data';
import { asciiDigits, displayDigits } from './plate-script';

const REVIEW_YEAR = 2026; // End of researched coverage, NOT a withdrawal date.
const NOTE = 'Flat parametric reconstruction: lettering is drawn from labelled font profiles (observed, candidate or fallback outlines), not certified manufacturing dies, and palettes are approximate. Validation checks the editor’s layout rules, not whether a registration was issued.';
const KR_LETTERS = [...'ABCDEFGHJKLM'];
const KR_PROVINCES = ['sulaymaniyah', 'erbil', 'halabja', 'dohuk'];
const LEGACY_KR_PROVINCES = ['sulaymaniyah', 'erbil', 'dohuk']; // No invented Halabja legacy allocation.
const BILINGUAL_KINDS = ['bilingual', 'short-bilingual', 'inspection-temporary', 'icts'];
const MODERN_KINDS = ['modern', 'modern-temporary'];

/** Region eras: the chronology's six families, with the divided era split because KRG kept it until 2022. */
const ERAS: (PlateEra & { source: string })[] = [
  { id: 'legacy', source: 'legacy', family: 'federal', period: [1982, 2001], label: 'Divided Arabic plates · 1982/1988 disputed' },
  { id: 'side-2001', source: 'side-2001', family: 'federal', period: [2001, 2008], label: 'Side-stacked legends · attributed 2001' },
  { id: 'bilingual', source: 'bilingual', family: 'federal', period: [2008, 2024], label: 'Bilingual federal system · 2008/2010 reported' },
  { id: 'federal-modern', source: 'federal-modern', family: 'federal', period: [2024, REVIEW_YEAR], label: 'Unified Latin · federal' },
  { id: 'kr-legacy', source: 'legacy', family: 'kurdistan', period: [1982, 2022], label: 'Divided Arabic plates · 1982/1988 disputed' },
  { id: 'international', source: 'international', family: 'kurdistan', period: [2021, 2022], label: 'Erbil international illustration' },
  { id: 'krg-modern', source: 'krg-modern', family: 'kurdistan', period: [2022, REVIEW_YEAR], label: 'Unified Latin · Kurdistan' },
];
const chronology = (id: string) => IRAQ_TIMELINE_ERAS.find((era) => era.id === id)!;
const eraFor = (entry: IraqTimelineEntry) => ERAS.find((era) => era.source === entry.eraId && era.family === entry.region)!;

const option = (value: string, label = value) => ({ value, label });
const arabicOf = (provinceId: string) => IRAQ_GOVERNORATES[IRAQ_CUSTOM_PROVINCES.findIndex((p) => p.id === provinceId)]?.arabic ?? '';
const PROVINCE_OPTIONS = IRAQ_CUSTOM_PROVINCES.map((p) => option(p.id, `${p.label} · ${arabicOf(p.id)}`));
const PROFILE_OPTIONS = Object.values(IRAQ_FONT_PROFILES).map((p) => option(p.id, p.label));
const appearance = (field: FieldDef): FieldDef => ({ ...field, preserveOnGenerate: true });

function letterOptions(preset: IraqCustomPreset) {
  const letters = BILINGUAL_KINDS.includes(preset.kind) ? IRAQ_LETTERS.map((l) => option(l.latin, `${l.latin} · ${l.arabic}`))
    : (preset.kr ? KR_LETTERS : IRAQ_LETTERS.map((l) => l.latin)).map((l) => option(l));
  return letters.some((l) => l.value === preset.defaults.letter) ? letters : [...letters, option(preset.defaults.letter)];
}
const governorateOptions = (preset: IraqCustomPreset) =>
  IRAQ_GOVERNORATES.filter((g) => g.kr === preset.kr).map((g) => option(g.code, `${g.code} — ${g.name} · ${g.arabic}`));

/** Provinces a generated plate may use: the issuing jurisdiction's, narrowed to whole words the font profile has. */
function provincePool(preset: IraqCustomPreset): string[] {
  const legacy = !MODERN_KINDS.includes(preset.kind);
  const jurisdiction = IRAQ_CUSTOM_PROVINCES.map((p) => p.id)
    .filter((id) => preset.kr ? (legacy ? LEGACY_KR_PROVINCES : KR_PROVINCES).includes(id) : !KR_PROVINCES.includes(id));
  const words = IRAQ_FONT_PROFILES[preset.defaults.fontProfile as keyof typeof IRAQ_FONT_PROFILES]?.wordmarks ?? {};
  const covered = jurisdiction.filter((id) => id in words);
  return covered.length ? covered : [preset.defaults.province];
}
/** Digits the preset's own font profile draws, so a strict, observed-only specimen still generates valid serials. */
function digitPool(preset: IraqCustomPreset): string[] {
  const glyphs = IRAQ_FONT_PROFILES[preset.defaults.fontProfile as keyof typeof IRAQ_FONT_PROFILES]?.glyphs ?? {};
  const covered = [...'0123456789'].filter((d) => glyphs[d] || glyphs[displayDigits(d, 'arabic')]);
  return covered.length ? covered : [...'0123456789'];
}

function fields(preset: IraqCustomPreset): FieldDef[] {
  const active = iraqActiveFields(preset);
  const has = (key: keyof IraqCustomState) => active.has(key);
  const list: FieldDef[] = [{ key: 'serial', label: 'Serial (Western, Arabic or Persian digits)', maxLength: 8, uppercase: false, placeholder: preset.defaults.serial }];
  if (has('letter')) list.push(preset.kind === 'international'
    ? { key: 'letter', label: 'Latin city suffix', maxLength: 4, placeholder: preset.defaults.letter }
    : { key: 'letter', label: 'Series letter', options: letterOptions(preset) });
  if (preset.kind === 'modern-temporary') list.push({ key: 'governorate', label: 'Governorate code or range', maxLength: 5, uppercase: false, placeholder: '21-22' });
  else if (preset.kind === 'modern') list.push({ key: 'governorate', label: 'Governorate', options: governorateOptions(preset) });
  if (has('province')) list.push({ key: 'province', label: 'Province', options: PROVINCE_OPTIONS });
  if (has('year')) list.push({ key: 'year', label: 'Year strip', maxLength: 4, uppercase: false, placeholder: '2021' });
  list.push(
    appearance({ key: 'layout', label: 'Plate layout', options: [option('long', 'Long'), option('compact', 'Compact')] }),
    appearance({ key: 'fontProfile', label: 'Font profile', options: PROFILE_OPTIONS }),
    appearance({ key: 'missingPolicy', label: 'Missing glyphs', options: [option('strict', 'Strict · mark missing shapes'), option('fallback', 'Fallback · labelled substitutes')] }),
    appearance({ key: 'mainScale', label: 'Main lettering scale', input: 'range', min: 0.5, max: 1.4, step: 0.01 }),
    appearance({ key: 'tracking', label: 'Letter spacing', input: 'range', min: -2, max: 12, step: 0.5 }),
    appearance({ key: 'bg', label: 'Background', input: 'color' }),
    appearance({ key: 'ink', label: 'Lettering', input: 'color' }),
  );
  if (has('strip')) list.push(appearance({ key: 'strip', label: 'Class strip', input: 'color' }));
  list.push(appearance({ key: 'border', label: 'Plate border', options: [option('on', 'Border'), option('off', 'No border')] }));
  return list;
}

function pattern(preset: IraqCustomPreset): string {
  switch (preset.kind) {
    case 'modern': return preset.kr ? 'GG L 99999 · IRQ/KR strip' : 'GG L 1–5 digits · IRQ strip';
    case 'modern-temporary': return 'GG or GG-GG range · serial';
    case 'bilingual': case 'icts': return 'L 99999 · Arabic above Latin';
    case 'short-bilingual': case 'inspection-temporary': return 'Arabic letter + serial · class legend';
    case 'international': return '99999 · Latin city suffix';
    case 'side': return 'Serial · country and province at left';
    default: return '1–6 Arabic digits · province name';
  }
}
function text(preset: IraqCustomPreset, parts: Record<string, string>): string {
  const serial = asciiDigits(parts.serial ?? '');
  const province = IRAQ_CUSTOM_PROVINCES.find((p) => p.id === parts.province);
  const vehicleClass = IRAQ_CUSTOM_CLASSES.find((c) => c.id === preset.defaults.vehicleClass)?.label ?? '';
  const band = preset.kr ? 'IRQ/KR' : 'IRQ';
  switch (preset.kind) {
    case 'modern': return `${asciiDigits(parts.governorate)} ${parts.letter ?? ''} ${serial} · ${band}`;
    case 'modern-temporary': return `${asciiDigits(parts.governorate)} ${serial} · ${band} temporary`;
    case 'international': return `${serial} ${parts.letter ?? ''} · IRAQ`;
    case 'bilingual': case 'icts': case 'short-bilingual': case 'inspection-temporary':
      return `${parts.letter ?? ''} ${serial} · ${vehicleClass}${iraqActiveFields(preset).has('province') && province ? ` · ${province.label}` : ''}`;
    default: return `${displayDigits(serial, 'arabic')} · ${arabicOf(parts.province ?? '')} · العراق`;
  }
}

const reference = (source: IraqTimelineSource) => ({ title: `${source.label} · ${source.dateLabel}`, url: source.url });
function references(entry: IraqTimelineEntry) {
  const all = [...entry.sources, ...chronology(entry.eraId).sources].filter((s) => s.url).map(reference);
  return all.filter((s, i) => all.findIndex((t) => t.url === s.url) === i);
}
function description(preset: IraqCustomPreset, entry: IraqTimelineEntry): string {
  const evidence = preset.evidence.charAt(0).toUpperCase() + preset.evidence.slice(1);
  return [`${IRAQ_TIMELINE_EVIDENCE_LABELS[entry.evidence]} (${entry.sourceArtworks.length} source ${entry.sourceArtworks.length === 1 ? 'artwork' : 'artworks'}). ${entry.evidenceNote}`,
    `Family dates: ${entry.period}. ${chronology(entry.eraId).dateNote}`, evidence, ...preset.notes, NOTE].join(' ');
}

function format(preset: IraqCustomPreset): PlateFormat {
  const entry = IRAQ_TIMELINE_ENTRIES.find((e) => e.presetId === preset.id)!;
  const era = eraFor(entry);
  const list = fields(preset);
  const pick = (key: string, rng: Rng) => { const options = list.find((f) => f.key === key)?.options; return options ? rng.pick(options).value : undefined; };
  const digits = digitPool(preset), provinces = provincePool(preset);
  return {
    id: preset.id, label: preset.label, family: entry.region, era: era.id, period: era.period,
    ...(entry.evidence === 'unsupported' ? { status: 'uncertain' as const } : {}),
    pattern: pattern(preset), references: references(entry), description: description(preset, entry),
    fields: list, design: { presetId: preset.id },
    generate: (rng) => {
      const parts = iraqCustomParts(preset.defaults);
      parts.serial = Array.from(preset.defaults.serial, () => rng.pick(digits)).join('');
      parts.letter = pick('letter', rng) ?? parts.letter;
      parts.governorate = pick('governorate', rng) ?? parts.governorate;
      if (list.some((f) => f.key === 'province')) parts.province = rng.pick(provinces);
      return parts;
    },
    validate: (parts) => renderIraqCustom(iraqCustomStateFromParts(preset.id, parts)).errors[0] ?? null,
    text: (parts) => text(preset, parts),
  };
}

export const iraq: Region = {
  id: 'iraq', name: 'Iraq', code: 'IRQ', flag: '🇮🇶', group: 'Asia', template: 'iq-flat', design: {},
  notes: `${NOTE} A dated family is not a certified die. Legacy introduction is disputed (1982 / 1988), as is the bilingual rollout (2008 / 2010). Photographs dated 2009, 2015 or 2024 document use, not introduction. ${REVIEW_YEAR} ends the researched coverage; it is not a withdrawal date. Research reviewed 2 October 2026.`,
  families: [
    { id: 'federal', label: 'Federal / earlier national systems', summary: 'Divided, side-legend, bilingual and unified-Latin federal plates, plus motorcycle, inspection-temporary and ICTS layouts.' },
    { id: 'kurdistan', label: 'Kurdistan Region', summary: 'KRG divided plates kept until 2022, the Erbil international illustration and the unified Latin IRQ/KR plates.' },
  ],
  eras: ERAS.map(({ source, ...era }) => {
    const c = chronology(source);
    return { ...era, summary: `${c.summary} ${c.dateNote}` };
  }),
  gaps: IRAQ_TIMELINE_GAPS.map((gap) => {
    const [start, end] = gap.period.match(/\d{4}/g)!.map(Number);
    return { id: `gap-${start}`, label: gap.label, period: [start, end] as const, family: 'federal', note: gap.note, sources: [{ title: gap.source.label, url: gap.source.url }] };
  }),
  formats: IRAQ_CUSTOM_PRESETS.map(format),
};
