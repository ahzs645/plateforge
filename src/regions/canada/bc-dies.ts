/**
 * B.C. presets default to source-matched dies: the lettering selector gains a
 * "Source die" option (serial and legends drawn from the period's die
 * profiles); live font text and the four construction categories remain.
 * The 1970–85 bases also gain dated renewal decals for their empty boxes.
 */
import type { FieldDef, PlateFormat } from '../../core/types';
import { bcDieSet } from '../../templates/bc/dies';
import { dieProfile } from '../../templates/dies/profiles';
import { decalId, decalsBetween } from './bc-decals';
import { MONTHS } from './bc-kit';

export function withBcDies(format: PlateFormat): PlateFormat {
  const field = format.fields.find((f) => f.key === 'lettering');
  if (!field?.options || field.options.some((o) => o.value === 'die')) return format;
  const profile = dieProfile(bcDieSet(format.design ?? {}).serial);
  const lettering: FieldDef = { ...field, options: [{ value: 'die', label: `Source die · ${profile.label}` }, ...field.options] };
  return {
    ...format,
    fields: format.fields.map((f) => (f === field ? lettering : f)),
    generate: (rng) => ({ ...format.generate(rng), lettering: 'die' }),
    validate: (parts) => format.validate?.(parts.lettering === 'die' ? { ...parts, lettering: 'default' } : parts) ?? null,
  };
}

/** Adds dated renewal decals (and a month) for bases with a decal box. */
export function withBcDecals(format: PlateFormat, years: readonly [number, number]): PlateFormat {
  const decals = decalsBetween(...years);
  if (!decals.length) return format;
  const months = decals.some((d) => d.year >= 1980);
  const options = [{ value: 'blank', label: 'Empty box' }, ...decals.map((d) => ({ value: decalId(d), label: `${d.year}${d.variant ? ` (${d.variant})` : ''} · ${d.colours}` }))];
  const fields: FieldDef[] = [{ key: 'decal', label: 'Renewal decal', options, preserveOnGenerate: true },
    ...(months ? [{ key: 'decalMonth', label: 'Decal month', options: MONTHS.map((m) => ({ value: m, label: m })), preserveOnGenerate: true }] : [])];
  const at = format.fields.findIndex((f) => f.key === 'finish');
  return {
    ...format,
    fields: [...format.fields.slice(0, at), ...fields, ...format.fields.slice(at)],
    generate: (rng) => ({ ...format.generate(rng), decal: 'blank', ...(months ? { decalMonth: 'JAN' } : {}) }),
    validate: (parts) => {
      if (parts.decal !== undefined && !options.some((o) => o.value === parts.decal)) return 'Choose a listed renewal decal.';
      if (parts.decalMonth !== undefined && !(MONTHS as readonly string[]).includes(parts.decalMonth)) return 'Choose a decal month.';
      return format.validate?.(parts) ?? null;
    },
  };
}
