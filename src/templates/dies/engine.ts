/**
 * Places die glyphs as stroked centreline paths. Characters keep their own
 * advances and are scaled uniformly: a run that does not fit is reduced as a
 * whole (and flagged), never stretched or squeezed per glyph.
 */
import { node as n, type SvgNode } from '../svg-scene';
import { skeletonGlyph, type SkeletonGlyph, type SkeletonParams } from './skeleton';

export interface DieEvidence {
  /** `specimen-matched`: proportions and diagnostic shapes read from BCpl8s die comparisons.
   *  `legend-approximation`: small legends matched by eye from plate photos.
   *  `category`: a construction category only. */
  status: 'specimen-matched' | 'legend-approximation' | 'category';
  specimens: readonly { title: string; url: string }[];
  notes: string;
}

export interface DieProfile {
  id: string;
  label: string;
  maker?: string;
  params: SkeletonParams;
  /** Hand-drawn replacements for individual glyphs. */
  overrides?: Readonly<Record<string, SkeletonGlyph>>;
  /** Forward slant in degrees (early italic dies). */
  slant?: number;
  evidence: DieEvidence;
}

const cache = new Map<string, SkeletonGlyph | null>();
export function dieGlyph(profile: DieProfile, char: string): SkeletonGlyph | null {
  const key = `${profile.id}:${char}`;
  if (!cache.has(key)) cache.set(key, profile.overrides?.[char] ?? skeletonGlyph(char, profile.params));
  return cache.get(key)!;
}
export const dieSupports = (profile: DieProfile, text: string): boolean => [...text].every((c) => dieGlyph(profile, c) !== null);

/** Natural run width in cap-height units (100). */
export function dieRunWidth(profile: DieProfile, text: string): number {
  const glyphs = [...text].map((c) => dieGlyph(profile, c)!);
  return glyphs.reduce((sum, g) => sum + g.advance, 0) + Math.max(0, glyphs.length - 1) * profile.params.tracking;
}

export interface DieTextProps {
  text: string;
  profile: DieProfile;
  /** Anchor point in plate units. */
  x: number;
  baseline: number;
  capHeight: number;
  /** Maximum rendered width; the whole run is reduced uniformly when exceeded. */
  maxWidth?: number;
  anchor?: 'start' | 'middle' | 'end';
  ink: string;
  role: string;
  /** Extra space between glyphs, in cap-height units, e.g. for spaced legends. */
  letterSpacing?: number;
}

export interface DieRun { node: SvgNode; width: number; height: number; fit: 'natural' | 'reduced' }

export function buildDieText(p: DieTextProps): DieRun {
  if (!dieSupports(p.profile, p.text)) throw new RangeError(`Die ${p.profile.id} has no glyph for part of “${p.text}”.`);
  const spacing = p.profile.params.tracking + (p.letterSpacing ?? 0);
  const glyphs = [...p.text].map((c) => ({ char: c, glyph: dieGlyph(p.profile, c)! }));
  const natural = glyphs.reduce((sum, g) => sum + g.glyph.advance, 0) + Math.max(0, glyphs.length - 1) * spacing;
  let scale = p.capHeight / 100;
  const fit = p.maxWidth !== undefined && natural * scale > p.maxWidth ? 'reduced' : 'natural';
  if (fit === 'reduced') scale = p.maxWidth! / natural;
  const width = natural * scale, height = 100 * scale;
  const left = p.anchor === 'start' ? p.x : p.anchor === 'end' ? p.x - width : p.x - width / 2;
  let cursor = 0;
  const children = glyphs.map(({ char, glyph }) => {
    const item = n('g', { transform: `translate(${round(cursor)} 0)`, 'data-character': char, ...(glyph.stroke ? { strokeWidth: glyph.stroke } : {}),
      ...(glyph.cap ? { strokeLinecap: glyph.cap } : {}) },
      ...glyph.paths.map((d) => n('path', { d })));
    cursor += glyph.advance + spacing;
    return item;
  });
  const slant = p.profile.slant ? ` skewX(${-p.profile.slant})` : '';
  // Reduced runs keep the baseline; the cap height shrinks with the width.
  const node = n('g', { 'data-role': p.role, 'data-die': p.profile.id, 'data-fit': fit, role: 'img', 'aria-label': p.text },
    n('title', {}, p.text),
    n('g', { transform: `translate(${round(left)} ${round(p.baseline - height)}) scale(${round(scale, 5)})${slant}`,
      fill: 'none', stroke: p.ink, strokeWidth: p.profile.params.stroke, strokeLinecap: 'square', strokeLinejoin: 'round' }, ...children));
  return { node, width, height, fit };
}

const round = (v: number, digits = 3) => Math.round(v * 10 ** digits) / 10 ** digits;
