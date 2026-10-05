/**
 * Places die glyphs as stroked centreline paths. Characters keep their own
 * advances and are scaled uniformly: a run that does not fit is reduced as a
 * whole (and flagged), never stretched or squeezed per glyph.
 */
import { node as n, type SvgNode } from '../svg-scene';
import { skeletonGlyph, type SkeletonGlyph, type SkeletonParams } from './skeleton';
import { researchVariant } from './research-dies';

export interface DieEvidence {
  /** `specimen-matched`: proportions and diagnostic shapes read from BCpl8s die comparisons.
   *  `photo-averaged`: glyph outlines traced from the average of many labelled photo samples.
   *  `legend-approximation`: small legends matched by eye from plate photos.
   *  `category`: a construction category only. */
  status: 'specimen-matched' | 'photo-averaged' | 'legend-approximation' | 'category' | 'research-candidate';
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
  /** Research-only profiles may reject unobserved characters instead of inventing a fallback. */
  allowConstructedFallback?: boolean;
  /** Keep a dedicated source reconstruction when research candidates use incompatible geometry. */
  allowResearchReplacement?: boolean;
  /** Forward slant in degrees (early italic dies). */
  slant?: number;
  /** Research-merged dies: characters drawn from research outlines rather than the production die. */
  researchChars?: ReadonlySet<string>;
  /** Research-merged dies: slant for production fallback glyphs only (research outlines carry their own). */
  fallbackSlant?: number;
  evidence: DieEvidence;
}

// Identity matters: research comparisons can use different revisions of one named die.
const cache = new WeakMap<DieProfile, Map<string, SkeletonGlyph | null>>();
export function dieGlyph(profile: DieProfile, char: string): SkeletonGlyph | null {
  let glyphs = cache.get(profile);
  if (!glyphs) { glyphs = new Map(); cache.set(profile, glyphs); }
  if (!glyphs.has(char)) glyphs.set(char, profile.overrides?.[char]
    ?? (profile.allowConstructedFallback === false ? null : skeletonGlyph(char, profile.params)));
  return glyphs.get(char)!;
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
  /** Pair placement adjustments in cap-height units; glyph outlines and advances stay unchanged. */
  kerning?: Readonly<Record<string, number>>;
}

export interface DieRun { node: SvgNode; width: number; height: number; fit: 'natural' | 'reduced' }

export function buildDieText(props: DieTextProps): DieRun {
  // Inside a plate render, the role picks the matching research lettering for this format.
  const p = { ...props, profile: researchVariant(props.profile, props.role, props.text) };
  if (!dieSupports(p.profile, p.text)) throw new RangeError(`Die ${p.profile.id} has no glyph for part of “${p.text}”.`);
  const spacing = p.profile.params.tracking + (p.letterSpacing ?? 0);
  const glyphs = [...p.text].map((c) => ({ char: c, glyph: dieGlyph(p.profile, c)! }));
  const pairAdjustments = glyphs.slice(0, -1).map((g, i) => p.kerning?.[g.char + glyphs[i + 1].char] ?? 0);
  const natural = glyphs.reduce((sum, g) => sum + g.glyph.advance, 0) + Math.max(0, glyphs.length - 1) * spacing
    + pairAdjustments.reduce((sum, value) => sum + value, 0);
  let scale = p.capHeight / 100;
  const fit = p.maxWidth !== undefined && natural * scale > p.maxWidth ? 'reduced' : 'natural';
  if (fit === 'reduced') scale = p.maxWidth! / natural;
  const width = natural * scale, height = 100 * scale;
  const left = p.anchor === 'start' ? p.x : p.anchor === 'end' ? p.x - width : p.x - width / 2;
  let cursor = 0;
  const children = glyphs.map(({ char, glyph }, i) => {
    const skew = p.profile.fallbackSlant && !p.profile.researchChars?.has(char) ? ` skewX(${-p.profile.fallbackSlant})` : '';
    const item = n('g', { transform: `translate(${round(cursor)} 0)${skew}`, 'data-character': char,
      ...(p.profile.researchChars?.has(char) ? { 'data-source': 'research' } : {}), ...(glyph.stroke ? { strokeWidth: glyph.stroke } : {}),
      ...(glyph.cap ? { strokeLinecap: glyph.cap } : {}),
      // Traced outlines are filled shapes, not centrelines.
      ...(glyph.fill ? { fill: p.ink, stroke: 'none', fillRule: 'evenodd' } : {}) },
      ...glyph.paths.map((d) => n('path', { d })));
    cursor += glyph.advance + spacing + (pairAdjustments[i] ?? 0);
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
