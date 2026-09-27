import type { FieldDef, Parts, PlateFormat } from './types';
import type { Rng } from './random';

/** Classification, not a font download or a claim of jurisdiction-specific dies. */
export const LETTERING_SOURCE = {
  title: 'Leeward Productions · North American font design types',
  url: 'https://www.leewardpro.com/articles/licplatefonts/licplate-fonts-nam-class.html',
};
export const LETTERING_TYPES = [
  { id: 'semicircular', label: 'Semicircular / DIN-style', description: 'Straight sides with circular caps.', letters: 'semicircular', numbers: 'semicircular' },
  { id: 'squarish', label: 'Squarish', description: 'Box-like bowls with rounded corners.', letters: 'squarish', numbers: 'squarish' },
  { id: 'oval', label: 'Oval curves', description: 'Elliptical bowls and curves.', letters: 'oval', numbers: 'oval' },
  { id: 'hybrid', label: 'Hybrid', description: 'This example combines squarish letters with oval numerals.', letters: 'squarish', numbers: 'oval' },
] as const;
export type LetteringType = typeof LETTERING_TYPES[number]['id'];
export type CurveType = Exclude<LetteringType, 'hybrid'>;
export function isLetteringType(value: unknown): value is LetteringType {
  return LETTERING_TYPES.some((type) => type.id === value);
}
export const LETTERING_NOTE = 'Original procedural lettering, not exact plate dies or licensed replica fonts. These choices change the serial only. Default retains editable font text; vector modes export the serial as paths with its text in metadata.';
export const LETTERING_SCOPE_NOTE = 'Leeward lists general passenger B.C. lettering as DIN-style; that is not evidence for every 1940–1963 die. Historical defaults are unchanged. No current state-by-state font assignments are inferred from this reference.';

export const LETTERING_FIELD: FieldDef = {
  key: 'lettering', label: 'Serial lettering', preserveOnGenerate: true,
  options: [
    { value: 'default', label: 'Default · editable font text' },
    ...LETTERING_TYPES.map((type) => ({ value: type.id, label: `${type.label} · vector` })),
  ],
};
/** Enriches a format without changing serial generation, validation or RNG use. */
export function withLettering(format: PlateFormat): PlateFormat {
  if (format.fields.some((field) => field.key === 'lettering')) return format;
  return {
    ...format,
    fields: [...format.fields, LETTERING_FIELD],
    references: [...(format.references ?? []).filter((source) => source.url !== LETTERING_SOURCE.url), LETTERING_SOURCE],
    generate: (rng) => ({ ...format.generate(rng), lettering: 'default' }),
    validate: (parts) => {
      const error = format.validate?.(parts);
      if (error) return error;
      return parts.lettering === undefined || parts.lettering === 'default' || isLetteringType(parts.lettering)
        ? null : 'Choose one of the supported lettering types.';
    },
  };
}
/** Appearance choices persist through Generate; identifiers do not. */
export function regenerateParts(format: PlateFormat, previous: Parts, rng: Rng): Parts {
  const next = format.generate(rng);
  for (const field of format.fields) {
    const value = previous[field.key];
    if (field.preserveOnGenerate && value !== undefined &&
      (!field.options || field.options.some((option) => option.value === value))) next[field.key] = value;
  }
  return next;
}
export function letteringMetadata(value: unknown) {
  return isLetteringType(value)
    ? { mode: 'procedural-svg', category: value, accuracy: 'category-inspired; not an original jurisdiction die', source: LETTERING_SOURCE }
    : { mode: 'font-text', category: null, accuracy: 'existing template font; historical BC uses a proxy', source: null };
}
