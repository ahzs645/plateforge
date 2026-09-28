/**
 * Stand-in plates: Not a Tesla App's published raster artwork plus its text settings, shown until an SVG
 * reconstruction exists. `manifest.json` and `assets/` are written by `scripts/import-stand-ins.mjs`.
 */
import manifest from './manifest.json';

/** The placeholder a reader types (or the separator button inserts) where the plate prints its emblem. */
export const MARK = '·';

export interface StandInText {
  /** Width of the reference plate the other measurements are authored against. */
  space: number;
  size: number;
  weight: number;
  color: string;
  /** Vertical centre of the glyph ink, not a baseline. */
  y: number;
  x?: number | null;
  align: 'center' | 'left' | 'right';
  letterSpacing: number;
  maxLength: number;
  outline: { color: string; width: number } | null;
  font: string;
}

export interface StandInSeparator {
  available: boolean;
  /** Width of the separator artwork's own authored plate. */
  space: number;
  gap: number;
  height: number | null;
  max: number;
  /** Emblem artwork: a whole transparent plate with the emblem in place. */
  file?: string;
  url?: string;
  imageWidth?: number;
  imageHeight?: number;
  /** x, y, w, h of the emblem inside the separator artwork. */
  bounds?: readonly [number, number, number, number];
}

export interface StandIn {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  category: string;
  customizable: boolean;
  sourceUrl: string;
  artwork: { file: string; width: number; height: number; sha256: string; url: string };
  separator: StandInSeparator;
  text: StandInText;
}

type RawStandIn = Omit<StandIn, 'artwork'> & { artwork: Omit<StandIn['artwork'], 'url'> };

const urls = import.meta.glob<string>('./assets/*/*', { eager: true, query: '?url', import: 'default' });
const urlOf = (file: string) => {
  const url = urls[`./assets/${file}`];
  if (!url) throw new Error(`Stand-in asset missing: ${file} (rerun scripts/import-stand-ins.mjs)`);
  return url;
};

const resolve = (raw: RawStandIn): StandIn => ({
  ...raw,
  artwork: { ...raw.artwork, url: urlOf(raw.artwork.file) },
  separator: raw.separator.file ? { ...raw.separator, url: urlOf(raw.separator.file) } : raw.separator,
});

export const CREDIT: string = manifest.credit;
export const STAND_INS: readonly StandIn[] = (manifest.plates as unknown as RawStandIn[]).map(resolve);
const BY_ID = new Map(STAND_INS.map((p) => [p.id, p]));
export const getStandIn = (id: unknown): StandIn | undefined => (typeof id === 'string' ? BY_ID.get(id) : undefined);

/** Themed and famous designs live in their own region rather than under the state they imitate. */
export const isThemed = (p: StandIn): boolean => p.category === 'Themed' || p.category === 'Famous Plate';

/**
 * Uppercases and caps the entry the way the source editor does: letters (spaces included) up to
 * `text.maxLength`, emblem marks up to `separator.max`, and no marks when the plate has no separator.
 */
export function normalizeStandIn(p: StandIn, text: string): string {
  if (!p.customizable) return '';
  const markLimit = p.separator.available ? Math.max(1, p.separator.max || 1) : 0;
  let letters = 0, marks = 0, out = '';
  for (const ch of text.toUpperCase()) {
    if (ch === MARK) { if (marks < markLimit) { marks++; out += ch; } }
    else if (letters < p.text.maxLength) { letters++; out += ch; }
  }
  return out.trim();
}

export interface Glyph { char: string; x: number; width: number; mark: boolean }
export interface StandInLayout {
  /** Font size and letter spacing after shrinking to fit, in artwork pixels. */
  size: number;
  /** Baseline for the letters; `middle` is the centre line the emblem is hung on. */
  baseline: number;
  middle: number;
  mark: { width: number; height: number };
  glyphs: Glyph[];
  outlineWidth: number;
}

/** Text metrics the layout needs; the template passes canvas-backed ones, tests pass fixed ones. */
export interface Metrics {
  width(char: string, size: number): number;
  ink(text: string, size: number): { ascent: number; descent: number };
}

/**
 * Port of the source editor's placement: scale everything from `text.space` to the artwork, shrink by 5%
 * steps until the line fits 86% of the plate, centre the ink on `text.y`, and pin the line by its
 * alignment. Emblem marks ride the same shrink and keep a gap either side.
 */
export function layoutStandIn(p: StandIn, value: string, metrics: Metrics): StandInLayout | null {
  if (!value) return null;
  const W = p.artwork.width;
  const t = p.text, s = p.separator;
  const scale = W / t.space;
  const base = t.size * scale;
  const box = s.bounds ? { w: s.bounds[2], h: s.bounds[3] } : null;
  const markSize = (size: number) => {
    const shrink = size / base;
    const gap = s.gap * scale * shrink;
    if (box && !s.height) {
      const factor = (W / s.space) * shrink;
      return { width: box.w * factor, height: box.h * factor, gap };
    }
    const height = (s.height || 58) * scale * shrink;
    return { height, width: box ? (height * box.w) / box.h : height * 0.22, gap };
  };

  // The source only caps the line at 86% of the plate; an anchored line (Illinois EV, beside its printed
  // "EL") must also fit the room the anchor leaves, keeping the same 7% margin, or it runs off the edge.
  const anchor = t.x == null ? null : t.x * scale;
  const room = anchor === null ? W * 0.86
    : t.align === 'right' ? anchor - W * 0.07
    : t.align === 'left' ? W * 0.93 - anchor
    : 2 * Math.min(anchor - W * 0.07, W * 0.93 - anchor);
  const limit = Math.min(W * 0.86, room);
  const chars = [...value];
  let size = base, spacing = t.letterSpacing * scale;
  let m = markSize(size), total = 0;
  for (let i = 0; i < 24; i++) {
    m = markSize(size);
    total = chars.reduce((sum, c) => sum + (c === MARK ? m.width + m.gap * 2 : metrics.width(c, size)), 0) + spacing * Math.max(0, chars.length - 1);
    if (total <= limit) break;
    size *= 0.95;
    spacing *= 0.95;
  }

  // measured off the letters alone: a lone mark has almost no ascent and would throw the line off centre
  const ink = metrics.ink(value.split(MARK).join('') || value, size);
  const middle = t.y * scale;
  const baseline = middle + (ink.ascent - ink.descent) / 2;
  let x = t.align === 'right' ? (anchor ?? W * 0.93) - total
    : t.align === 'left' ? (anchor ?? W * 0.07)
    : (anchor ?? W / 2) - total / 2;

  const glyphs: Glyph[] = chars.map((char) => {
    if (char === MARK) {
      const glyph = { char, x: x + m.gap, width: m.width, mark: true };
      x += m.width + m.gap * 2 + spacing;
      return glyph;
    }
    const width = metrics.width(char, size);
    const glyph = { char, x, width, mark: false };
    x += width + spacing;
    return glyph;
  });
  return {
    size, baseline, middle, glyphs,
    mark: { width: m.width, height: m.height },
    outlineWidth: t.outline ? t.outline.width * scale * (size / base) : 0,
  };
}
