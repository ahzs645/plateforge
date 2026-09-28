/**
 * The standard plate contract.
 *
 *   Region  ─┬─ Format ── Fields      (what the serial is made of)
 *            └─ Template + Design     (how the plate looks)
 *
 * A Region (US state, country, …) owns one or more Formats. A Format knows how
 * to generate a random set of Parts and how to validate user-edited Parts. A
 * Template turns Parts + Design into an SVG. Adding a new plate type means
 * writing a Region object — no UI or renderer code needs to change.
 */
import type { ReactElement } from 'react';
import type { Rng } from './random';

/** Named pieces of a plate, e.g. `{ serial: 'ABC-1234' }` or `{ province: '京', city: 'A', serial: '12345' }`. */
export type Parts = Record<string, string>;

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  /** Present → rendered as a select. */
  options?: readonly FieldOption[];
  maxLength?: number;
  /** Uppercase input automatically. Defaults to true. */
  uppercase?: boolean;
  placeholder?: string;
  /** Keep appearance controls when generating a new serial. */
  preserveOnGenerate?: boolean;
}

/** Design values are template-specific; each template exports its own type. */
export type Design = Record<string, unknown>;

export interface PlateFormat {
  id: string;
  label: string;
  description?: string;
  /** Public historical/specification references; optional for existing formats. */
  references?: readonly { title: string; url: string }[];
  /** Human readable shape, e.g. `AAA-9999`. */
  pattern?: string;
  fields: FieldDef[];
  generate(rng: Rng): Parts;
  /** Returns an error message, or null when parts are valid. */
  validate?(parts: Parts): string | null;
  /** Plain-text serial used for copy / CSV export. Defaults to `parts.serial`. */
  text?(parts: Parts): string;
  /** Merged over the region's design. */
  design?: Design;
  /** Template id when this format is drawn differently from the rest of its region (e.g. stand-in artwork). */
  template?: string;
  /** Years this format was issued or valid (inclusive). Enables the timeline. */
  period?: readonly [number, number];
  /** Id of the region era this format belongs to; inferred from `period` when omitted. */
  era?: string;
  /** Plate family within the region (passenger, motorcycle, …); defaults to the region's first family. */
  family?: string;
  /** Issue status; anything other than `issued` is shown with a badge. */
  status?: PlateStatus;
}

export type PlateStatus = 'issued' | 'official-sample' | 'prototype' | 'proposal' | 'souvenir' | 'prop' | 'reproduction' | 'uncertain'
  /** Third-party raster artwork shown until an SVG reconstruction exists. */
  | 'stand-in';

/** A group of related formats with its own timeline, e.g. passenger or motorcycle plates. */
export interface PlateFamily {
  id: string;
  label: string;
  summary?: string;
}

/** A named span of a region's plate history, used to group the timeline and gallery. */
export interface PlateEra {
  id: string;
  label: string;
  period: readonly [number, number];
  summary?: string;
  /** Family this era belongs to; defaults to the region's first family. */
  family?: string;
}

/** A documented period with no editable reconstruction yet; shown so gaps are explicit. */
export interface PlateGap {
  id: string;
  label: string;
  period: readonly [number, number];
  note?: string;
  sources: readonly { title: string; url: string }[];
  family?: string;
}

export interface Region {
  id: string;
  name: string;
  /** Short code shown in lists, e.g. `CA`, `D`, `JP`. */
  code: string;
  /** Continent-level grouping in the picker, e.g. `North America`, `Europe`. */
  group: string;
  /** Issuing country. Defaults to `name` for national regions. */
  country?: string;
  /** Country flag when it differs from the region's own flag. */
  countryFlag?: string;
  flag: string;
  template: string;
  design: Design;
  formats: PlateFormat[];
  /** Plate families; each gets its own timeline. The first is the default. */
  families?: readonly PlateFamily[];
  /** Chronological eras; together with format periods these drive the timeline. */
  eras?: readonly PlateEra[];
  /** Documented but unbuilt periods, placed on the timeline as placeholders. */
  gaps?: readonly PlateGap[];
  /** In-app route to a fuller coverage checklist, e.g. `#/library/coverage`. */
  coverageRoute?: string;
  notes?: string;
}

export interface TemplateProps<D extends Design = Design> {
  parts: Parts;
  design: D;
  text: string;
}

export interface FontAsset {
  family: string;
  url: string;
  /** A number, or a range such as `'400 700'` for variable fonts. */
  weight?: number | string;
  format?: 'woff2' | 'truetype';
}

export interface PlateTemplate<D extends Design = Design> {
  id: string;
  name: string;
  size(design: D, parts?: Parts): { width: number; height: number };
  render(props: TemplateProps<D>): ReactElement;
  /** Fonts to inline when exporting SVG / PNG. */
  fonts?: FontAsset[];
}

/** A fully resolved plate, ready to render. */
export interface Plate {
  region: Region;
  format: PlateFormat;
  parts: Parts;
  text: string;
}
