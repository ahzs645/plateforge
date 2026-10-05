/**
 * Formats for plates drawn by the reusable kit (src/templates/bc/kit.ts).
 * A spec pairs one recipe with a serial grammar, die choices and optional
 * dated decals; artwork, serial rules and dies stay independent.
 */
import { compilePattern, type CompiledPattern } from '../../core/pattern';
import type { FieldDef, FieldOption, Parts, PlateFormat, PlateStatus } from '../../core/types';
import type { Rng } from '../../core/random';
import type { KitRecipe } from '../../templates/bc/kit';
import type { DecalArt } from '../../templates/bc/decal';
import { BC_DECALS, decalId, decalsBetween, type BcDecal } from './bc-decals';
import { dieProfile } from '../../templates/dies/profiles';
import { dieSupports } from '../../templates/dies/engine';

/**
 * Numeric registration numbers in documented ranges. With `dash`, numbers of
 * four or more figures carry a dash between thousands and hundreds (1924 on);
 * without it the plate shows plain figures.
 */
export function numericGrammar(ranges: readonly (readonly [number, number])[], dash: boolean): SerialGrammar {
  const show = (n: number) => { const t = String(n); return dash && t.length > 3 ? `${t.slice(0, -3)}-${t.slice(-3)}` : t; };
  const valid = (serial: string) => {
    if (!(dash ? /^(?:[1-9]\d{0,2}|[1-9]\d{0,2}-\d{3})$/ : /^[1-9]\d{0,5}$/).test(serial)) return false;
    if (dash && serial.replace('-', '').length > 3 && !serial.includes('-')) return false;
    const n = Number(serial.replace('-', ''));
    return ranges.some(([lo, hi]) => n >= lo && n <= hi);
  };
  const hint = ranges.map(([lo, hi]) => `${show(lo)}–${show(hi)}`).join(', ');
  return { blocks: [], hint: `${hint}${dash ? ' (dash before the last three figures)' : ''}`,
    custom: { generate: (rng) => { const [lo, hi] = rng.pick(ranges); return show(rng.int(lo, hi)); }, test: valid } };
}

/** For plates that carry no number (crests, event logos): no serial field, nothing drawn. */
export const NO_SERIAL: SerialGrammar = { blocks: [], hint: 'No number on this plate', custom: { generate: () => '', test: (s) => s === '' } };

/** B.C. letter groups used by the serial allocations: A–K and L–X, each skipping look-alikes. */
export const BC_AK = 'ABCDEFGHJK';
export const BC_LX = 'LMNPRSTVWX';

export interface SerialBlock { pattern: string; label?: string }
export interface SerialGrammar {
  blocks: readonly SerialBlock[];
  /** Rule-based serials (e.g. numeric ranges) instead of, or besides, pattern blocks. */
  custom?: { generate(rng: Rng): string; test(serial: string): boolean };
  sets?: Record<string, string>;
  /** Serials a generator must avoid (e.g. withheld numbers); still valid when typed. */
  avoid?: (serial: string) => boolean;
  /** Human-readable summary used in validation messages. */
  hint: string;
}

/** An annual colour scheme on a shared layout; `year` fills {yy}/{yyyy} legend tokens. */
export interface KitPalette { id: string; label: string; background: string; ink: string; year?: number }

export interface KitFormatSpec {
  id: string;
  label: string;
  family: string;
  /** Omit when the source does not date the design. Never invent an issue period. */
  period?: readonly [number, number];
  era?: string;
  status?: PlateStatus;
  recipe: KitRecipe;
  grammar: SerialGrammar;
  /** Die profiles offered for the serial; the first is the default. */
  dies?: readonly { id: string; label?: string }[];
  /** Years of dated renewal decals offered for the well (inclusive). */
  decals?: readonly [number, number];
  /** Annual colours for one layout; the first is the default. */
  palettes?: readonly KitPalette[];
  description: string;
  references?: readonly { title: string; url: string }[];
}

const recipes = new Map<string, { recipe: KitRecipe; palettes: readonly KitPalette[] }>();
/** Colour and token overrides for the chosen palette, if any. */
export function kitPalette(recipeId: string, paletteId: string | undefined): { background?: string; ink?: string; tokens?: Record<string, string> } {
  const entry = recipes.get(recipeId);
  const p = entry?.palettes.find((x) => x.id === paletteId) ?? entry?.palettes[0];
  if (!p) return {};
  const yy = p.year ? String(p.year).slice(2) : '';
  return { background: p.background, ink: p.ink, ...(p.year ? { tokens: { yy, yyyy: String(p.year), y1: yy[0], y2: yy[1] } } : {}) };
}
export function kitRecipe(id: string): KitRecipe {
  const entry = recipes.get(id);
  if (!entry) throw new RangeError(`Unknown B.C. kit recipe: ${id}`);
  return entry.recipe;
}
export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

/** Stable pseudo-random digits derived from the plate serial, so a decal does not change between renders. */
function derived(seed: string, digits: number): string {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  let out = '';
  for (let i = 0; i < digits; i++) { h = Math.imul(h ^ (h >>> 13), 1274126177); out += String((h >>> 0) % 10); }
  return out;
}
export function decalArt(decal: BcDecal, parts: Record<string, string | undefined>): DecalArt {
  const month = MONTHS.includes(parts.decalMonth as typeof MONTHS[number]) ? parts.decalMonth : 'JAN';
  const seed = parts.serial ?? '';
  return {
    style: decal.style, background: decal.background, ink: decal.ink, serialInk: decal.serialInk,
    aspect: decal.style === 'annual' ? 1.9 : decal.style === 'solid' && decal.year >= 2005 ? 2.3 : 3.3,
    ...(decal.year >= 1980 ? { month } : {}), year: String(decal.year).slice(2),
    ...(decal.digits ? { serial: derived(`${seed}/${decal.year}`, decal.digits) } : {}),
    ...(decal.year >= 1993 ? { day: String(1 + (Number(derived(seed, 2)) % 28)) } : {}),
  };
}
export function kitDecal(_recipeId: string, parts: Record<string, string | undefined>): DecalArt | null {
  const decal = BC_DECALS.find((d) => decalId(d) === parts.decal);
  return decal ? decalArt(decal, parts) : null;
}

function compile(grammar: SerialGrammar): CompiledPattern[] {
  return grammar.blocks.map((b) => compilePattern(b.pattern, { sets: grammar.sets }));
}

export function kitFormat(spec: KitFormatSpec): PlateFormat {
  if (recipes.has(spec.recipe.id) && recipes.get(spec.recipe.id)!.recipe !== spec.recipe) throw new Error(`Duplicate kit recipe id ${spec.recipe.id}`);
  // A single declared choice has no selector/parts.die. Apply it to the stored
  // recipe too, rather than silently rendering an inherited maker's alphabet.
  const recipe = spec.dies?.length === 1
    ? {...spec.recipe, serial: {...spec.recipe.serial, die: spec.dies[0].id}}
    : spec.recipe;
  recipes.set(recipe.id, { recipe, palettes: spec.palettes ?? [] });
  const paletteOptions: FieldOption[] = (spec.palettes ?? []).map((p) => ({ value: p.id, label: p.label }));
  const blocks = compile(spec.grammar);
  const dies = spec.dies ?? [{ id: spec.recipe.serial.die }];
  const dieOptions: FieldOption[] = dies.map((d) => ({ value: d.id, label: d.label ?? dieProfile(d.id).label }));
  const decals = spec.decals && spec.recipe.decal ? decalsBetween(...spec.decals) : [];
  const decalOptions: FieldOption[] = decals.length ? [{ value: 'blank', label: 'Empty well' },
    ...decals.map((d) => ({ value: decalId(d), label: `${d.year}${d.variant ? ` (${d.variant})` : ''} · ${d.colours}` }))] : [];
  const monthField = decals.some((d) => d.year >= 1980);
  const numbered = spec.grammar !== NO_SERIAL;
  const fields: FieldDef[] = [
    ...(numbered ? [{ key: 'serial', label: 'Plate serial', maxLength: 9 }] : []),
    ...(paletteOptions.length > 1 ? [{ key: 'palette', label: 'Year / colours', options: paletteOptions, preserveOnGenerate: true }] : []),
    ...(dieOptions.length > 1 ? [{ key: 'die', label: 'Serial die', options: dieOptions, preserveOnGenerate: true }] : []),
    ...(decalOptions.length ? [{ key: 'decal', label: 'Renewal decal', options: decalOptions, preserveOnGenerate: true }] : []),
    ...(monthField ? [{ key: 'decalMonth', label: 'Decal month', options: MONTHS.map((m) => ({ value: m, label: m })), preserveOnGenerate: true }] : []),
    ...(spec.recipe.renewalPanel ? [{key: 'renewal', label: 'Renewal tab', preserveOnGenerate: true, options: [
      {value: 'on-plate', label: 'Mounted over the 1952 base'}, {value: 'base-only', label: 'Show 1952 base only'}, {value: 'loose', label: 'Tab on its own'},
    ]}] : []),
    ...(spec.recipe.embossed ? [{ key: 'finish', label: 'Rendering', preserveOnGenerate: true, options: [{ value: 'flat', label: 'Flat / editable SVG' }, { value: 'embossed', label: 'Subtle embossed preview' }] }] : []),
  ];
  const generateSerial = (rng: Rng): string => {
    const one = () => spec.grammar.custom && (!blocks.length || rng.chance(0.5)) ? spec.grammar.custom.generate(rng) : rng.pick(blocks).generate(rng);
    for (let tries = 0; tries < 50; tries++) {
      const serial = one();
      if (!spec.grammar.avoid?.(serial)) return serial;
    }
    return one();
  };
  return {
    id: spec.id,
    label: spec.label,
    family: spec.family,
    period: spec.period,
    ...(spec.era ? { era: spec.era } : {}),
    status: spec.status,
    pattern: spec.grammar.hint,
    description: spec.description,
    references: [spec.recipe.source, ...(spec.references ?? [])],
    fields,
    design: { kit: spec.recipe.id, ...(spec.period ? {year: spec.period[0]} : {}) },
    generate: (rng): Parts => ({
      serial: generateSerial(rng),
      ...(paletteOptions.length > 1 ? { palette: paletteOptions[0].value } : {}),
      ...(dieOptions.length > 1 ? { die: dieOptions[0].value } : {}),
      ...(decalOptions.length ? { decal: 'blank' } : {}),
      ...(monthField ? { decalMonth: 'JAN' } : {}),
      ...(spec.recipe.renewalPanel ? {renewal: 'on-plate'} : {}),
      ...(spec.recipe.embossed ? { finish: 'flat' } : {}),
    }),
    validate: (parts) => {
      const serial = parts.serial ?? '';
      if (!blocks.some((b) => b.test(serial)) && !spec.grammar.custom?.test(serial)) return `Supported serials: ${spec.grammar.hint}. This checks the documented format, not a real registration.`;
      const die = parts.die ?? dies[0].id;
      if (!dies.some((d) => d.id === die)) return 'Choose one of the listed dies.';
      if (!spec.recipe.serial.font && !dieSupports(dieProfile(die), serial.replace('-', ''))) return 'This die has no glyph for one of these characters.';
      if (parts.palette !== undefined && paletteOptions.length && !paletteOptions.some((o) => o.value === parts.palette)) return 'Choose a listed year.';
      if (parts.decal !== undefined && !decalOptions.some((o) => o.value === parts.decal)) return 'Choose a listed renewal decal.';
      if (parts.decalMonth !== undefined && !(MONTHS as readonly string[]).includes(parts.decalMonth)) return 'Choose a decal month.';
      if (parts.finish !== undefined && !['flat', 'embossed'].includes(parts.finish)) return 'Choose flat or embossed rendering.';
      if (spec.recipe.renewalPanel && parts.renewal !== undefined && !['on-plate', 'base-only', 'loose'].includes(parts.renewal)) return 'Choose how the renewal tab is shown.';
      return null;
    },
    text: (parts) => (numbered ? parts.serial ?? '' : spec.label),
  };
}
