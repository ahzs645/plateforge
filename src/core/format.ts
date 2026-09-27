/** Builders that turn short declarations into full `PlateFormat`s. */
import { compilePattern, type PatternOptions } from './pattern';
import type { Rng } from './random';
import type { Design, FieldDef, FieldOption, Parts, PlateFormat } from './types';

const SERIAL_FIELD: FieldDef = { key: 'serial', label: 'Serial', maxLength: 12 };

interface Common {
  id: string;
  label: string;
  description?: string;
  design?: Design;
}

/**
 * A format fully described by a pattern (or several — one is picked at random,
 * any may match on validation).
 */
export function patternFormat(
  spec: Common & { pattern: string | string[]; options?: PatternOptions; maxLength?: number },
): PlateFormat {
  const sources = Array.isArray(spec.pattern) ? spec.pattern : [spec.pattern];
  const compiled = sources.map((p) => compilePattern(p, spec.options));
  return {
    id: spec.id,
    label: spec.label,
    description: spec.description,
    design: spec.design,
    pattern: sources.join('  |  '),
    fields: [{ ...SERIAL_FIELD, maxLength: spec.maxLength ?? Math.max(...compiled.map((c) => c.tokens.length)) }],
    generate: (rng) => ({ serial: rng.pick(compiled).generate(rng) }),
    validate: ({ serial = '' }) =>
      compiled.some((c) => c.test(serial)) ? null : `Expected ${sources.join(' or ')}`,
  };
}

/**
 * A format with a hand-written generator (for rule-heavy formats such as the
 * US state issuing ranges). `shape` is an optional validation regex.
 */
export function serialFormat(
  spec: Common & { generate: (rng: Rng) => string; pattern?: string; shape?: RegExp; maxLength?: number },
): PlateFormat {
  return {
    id: spec.id,
    label: spec.label,
    description: spec.description,
    design: spec.design,
    pattern: spec.pattern,
    fields: [{ ...SERIAL_FIELD, maxLength: spec.maxLength ?? 9 }],
    generate: (rng) => ({ serial: spec.generate(rng) }),
    validate: spec.shape
      ? ({ serial = '' }) => (spec.shape!.test(serial) ? null : `Doesn't match ${spec.pattern ?? 'the format'}`)
      : undefined,
  };
}

/**
 * A format built from a code picked from a list (district, canton, county, …)
 * followed by a pattern serial. `join` controls the printed text.
 */
export function codedFormat(
  spec: Common & {
    code: { key?: string; label: string; values: readonly (string | FieldOption)[] };
    pattern: string | string[];
    options?: PatternOptions;
    join?: (code: string, serial: string) => string;
    /** Extra validation on the combined parts (e.g. max total length). */
    check?: (parts: Parts) => string | null;
  },
): PlateFormat {
  const key = spec.code.key ?? 'code';
  const options: FieldOption[] = spec.code.values.map((v) =>
    typeof v === 'string' ? { value: v, label: v } : v,
  );
  const sources = Array.isArray(spec.pattern) ? spec.pattern : [spec.pattern];
  const compiled = sources.map((p) => compilePattern(p, spec.options));
  const join = spec.join ?? ((c, s) => `${c} ${s}`);
  return {
    id: spec.id,
    label: spec.label,
    description: spec.description,
    design: spec.design,
    pattern: `${spec.code.label} + ${sources.join(' | ')}`,
    fields: [
      { key, label: spec.code.label, options },
      { key: 'serial', label: 'Serial', maxLength: Math.max(...compiled.map((c) => c.tokens.length)) },
    ],
    generate: (rng) => ({ [key]: rng.pick(options).value, serial: rng.pick(compiled).generate(rng) }),
    validate: (parts) =>
      !compiled.some((c) => c.test(parts.serial ?? ''))
        ? `Serial should look like ${sources.join(' or ')}`
        : (spec.check?.(parts) ?? null),
    text: (parts) => join(parts[key] ?? '', parts.serial ?? ''),
  };
}

export function formatText(format: PlateFormat, parts: Parts): string {
  return format.text ? format.text(parts) : (parts.serial ?? '');
}
