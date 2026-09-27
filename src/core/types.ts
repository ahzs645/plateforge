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
}

export interface Region {
  id: string;
  name: string;
  /** Short code shown in lists, e.g. `CA`, `D`, `JP`. */
  code: string;
  /** Top-level grouping in the picker. */
  group: string;
  flag: string;
  template: string;
  design: Design;
  formats: PlateFormat[];
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
  weight?: number;
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
