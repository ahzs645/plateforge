/**
 * Reusable B.C. plate kit: one data-driven scene builder for every base that is
 * not one of the original 1940–1985 passenger recipes. A recipe lists the shell,
 * artwork, legends, serial die and renewal well; nothing here is drawn per plate.
 * All coordinates are millimetres on the physical plate.
 */
import type { Parts } from '../../core/types';
import { node as n, type SvgNode } from '../svg-scene';
import { buildDieText, dieRunWidth, dieSupports, type DieRun } from '../dies/engine';
import { dieProfile } from '../dies/profiles';
import { artwork } from './art';
import { buildDaySticker, buildDecal, decalBox, type DecalArt } from './decal';

/** Screened legends set in a typeface (e.g. the flag base's serif slogan) rather than a stamping die. */
export interface KitFontText {
  text: string;
  x: number;
  baseline: number;
  /** Font size, mm, and the width the line is spaced to (letter spacing only; glyphs are never stretched). */
  size: number;
  width?: number;
  font: 'serif' | 'sans';
  weight?: number;
  italic?: boolean;
  color?: string;
  role: string;
}
export interface KitText {
  text: string;
  /** Anchor x, baseline y and cap height, mm. */
  x: number;
  baseline: number;
  cap: number;
  maxWidth?: number;
  die: string;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  role: string;
  /** Extra spacing between characters, in cap-height units (100 = one cap height). */
  spacing?: number;
  /** Space the letters out to fill `maxWidth` (legends stamped across the plate); glyphs keep their shape. */
  spread?: boolean;
}
export interface KitArt { art: string; x: number; y: number; width: number; height: number; role?: string; /** For currentColor line art. */ color?: string }
export interface KitSerial {
  x: number;
  baseline: number;
  cap: number;
  maxWidth: number;
  die: string;
  color?: string;
  /** Typeface instead of a die (owner-made plates with house numerals). */
  font?: { family: 'serif' | 'sans'; weight?: number };
  /** Four-digit numbers carry a long leading bar (1933–39 dies). */
  leadingBar?: boolean;
  /** How the stored dash is shown: a dash, a centre dot, a gap, or an artwork (e.g. the flag). */
  separator?: { kind: 'dash' | 'dot' | 'gap' | 'none' } | { kind: 'art'; art: KitArt; gap: number };
}
export interface KitDecal { x: number; y: number; width: number; height: number; rx?: number }
/** Plain drawn elements: frames, rules, stitching, grommets. */
export type KitShape =
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx?: number; stroke?: string; fill?: string; strokeWidth?: number; dash?: string }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; stroke?: string; strokeWidth?: number; dash?: string }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill?: string; stroke?: string; strokeWidth?: number };
/** A separately made piece fixed over the base (riveted renewal tabs). */
export interface KitPanel {
  x: number; y: number; width: number; height: number; radius?: number;
  background: string; ink: string;
  texts?: readonly KitText[]; art?: readonly KitArt[]; shapes?: readonly KitShape[];
  /** Serial repeated in miniature on the tab. */
  serial?: { x: number; baseline: number; cap: number; maxWidth: number; die: string };
  rivets?: readonly (readonly [number, number])[];
  role: string;
}

export interface KitRecipe {
  id: string;
  label: string;
  /** Physical size, mm. */
  width: number;
  height: number;
  radius: number;
  background: string;
  /** Default ink for the serial, legends and rim. */
  ink: string;
  rim?: { inset: number; width: number; color?: string } | null;
  holes?: 'slots' | 'round' | 'none';
  /** Hole centres as fractions of width/height (default x 0.2/0.8, 9 mm from top and bottom). */
  holeAt?: { x: readonly number[]; y: readonly number[] };
  /** Artwork beneath the inscriptions (backgrounds, graphics). */
  art?: readonly KitArt[];
  legends: readonly KitText[];
  fontLegends?: readonly KitFontText[];
  serial: KitSerial;
  /** Renewal wells; several for bases with a separate day sticker. */
  decal?: KitDecal | null;
  extraWells?: readonly KitDecal[];
  shapes?: readonly KitShape[];
  panels?: readonly KitPanel[];
  /** Stamped relief vs. flat screened/printed characters. */
  embossed: boolean;
  status?: string;
  source: { title: string; url: string };
  note: string;
}


export function kitGeometry(recipe: KitRecipe) {
  return { width: recipe.width, height: recipe.height };
}

function text(t: KitText, ink: string): SvgNode {
  const profile = dieProfile(t.die);
  let spacing = t.spacing;
  if (t.spread && t.maxWidth) {
    const natural = (dieRunWidth(profile, t.text) * t.cap) / 100, gaps = [...t.text].length - 1;
    if (gaps > 0 && natural < t.maxWidth) spacing = ((t.maxWidth - natural) / gaps) * (100 / t.cap);
  }
  return buildDieText({ text: t.text, profile, x: t.x, baseline: t.baseline, capHeight: t.cap, maxWidth: t.maxWidth,
    anchor: t.anchor ?? 'middle', ink: t.color ?? ink, role: t.role, letterSpacing: spacing }).node;
}

/** Serial, split around an artwork separator when the recipe asks for one. */
const FONTS = { serif: 'Georgia, "Times New Roman", serif', sans: '"Barlow Condensed", "Arial Narrow", sans-serif' };

function serialNodes(recipe: KitRecipe, serial: string, ink: string): { nodes: SvgNode[]; fit: DieRun['fit'] } {
  const s = recipe.serial, profile = dieProfile(s.die), color = s.color ?? ink;
  if (s.font) {
    // Typeface serials: sized by cap height (0.72 em) and never stretched.
    return { nodes: [n('text', { x: s.x, y: s.baseline, fill: color, fontFamily: FONTS[s.font.family], fontSize: s.cap / 0.72, fontWeight: s.font.weight ?? 700,
      textAnchor: 'middle', 'data-role': 'serial', 'data-lettering': 'typeface-proxy' }, serial.replace('-', ''))], fit: 'natural' };
  }
  if (s.leadingBar && /^\d-\d{3}$/.test(serial)) serial = `‒${serial}`;
  const sep = s.separator ?? { kind: 'dash' };
  if (sep.kind === 'art' && serial.includes('-')) {
    const [left, right] = serial.split('-', 2);
    const measure = (value: string) => buildDieText({ text: value, profile, x: 0, baseline: s.baseline, capHeight: s.cap, ink: color, role: 'x' }).width;
    const natural = measure(left) + measure(right) + sep.art.width + 2 * sep.gap;
    const k = Math.min(1, s.maxWidth / natural);
    const cap = s.cap * k, total = natural * k;
    let x = s.x - total / 2;
    const l = buildDieText({ text: left, profile, x, baseline: s.baseline, capHeight: cap, anchor: 'start', ink: color, role: 'serial-left' });
    x += l.width + sep.gap * k;
    const artNode = artwork(sep.art.art, { x, y: sep.art.y + (sep.art.height * (1 - k)) / 2, width: sep.art.width * k, height: sep.art.height * k }, 'serial-separator');
    x += sep.art.width * k + sep.gap * k;
    const r = buildDieText({ text: right, profile, x, baseline: s.baseline, capHeight: cap, anchor: 'start', ink: color, role: 'serial-right' });
    return { nodes: [n('g', { 'data-role': 'serial', 'aria-label': serial }, l.node, artNode, r.node)], fit: k < 1 ? 'reduced' : 'natural' };
  }
  const shown = sep.kind === 'dot' ? serial.replace('-', '·') : sep.kind === 'gap' ? serial.replace('-', ' ') : sep.kind === 'none' || sep.kind === 'art' ? serial.replace('-', '') : serial;
  const run = buildDieText({ text: shown, profile, x: s.x, baseline: s.baseline, capHeight: s.cap, maxWidth: s.maxWidth, ink: color, role: 'serial' });
  return { nodes: [run.node], fit: run.fit };
}

function shape(sh: KitShape, ink: string): SvgNode {
  const dash: Record<string, string> = 'dash' in sh && sh.dash ? { strokeDasharray: sh.dash } : {};
  if (sh.kind === 'rect') return n('rect', { x: sh.x, y: sh.y, width: sh.width, height: sh.height, rx: sh.rx ?? 0, fill: sh.fill ?? 'none', stroke: sh.stroke ?? (sh.fill ? 'none' : ink), strokeWidth: sh.strokeWidth ?? 1, ...dash });
  if (sh.kind === 'line') return n('path', { d: `M${sh.x1} ${sh.y1} L${sh.x2} ${sh.y2}`, stroke: sh.stroke ?? ink, strokeWidth: sh.strokeWidth ?? 1, ...dash });
  return n('circle', { cx: sh.cx, cy: sh.cy, r: sh.r, fill: sh.fill ?? ink, ...(sh.stroke ? { stroke: sh.stroke, strokeWidth: sh.strokeWidth ?? 1 } : {}) });
}

function panel(p: KitPanel, serial: string, id: string): SvgNode {
  const local = (t: KitText): KitText => ({ ...t, x: p.x + t.x, baseline: p.y + t.baseline });
  return n('g', { 'data-role': p.role, filter: `url(#${id}-lift)` },
    n('rect', { x: p.x, y: p.y, width: p.width, height: p.height, rx: p.radius ?? 3, fill: p.background }),
    n('rect', { x: p.x + 2, y: p.y + 2, width: p.width - 4, height: p.height - 4, rx: Math.max(1, (p.radius ?? 3) - 1), fill: 'none', stroke: p.ink, strokeWidth: 1 }),
    ...(p.art ?? []).map((a) => artwork(a.art, { ...a, x: p.x + a.x, y: p.y + a.y }, a.role ?? 'tab-art')),
    ...(p.shapes ?? []).map((sh) => shape(sh, p.ink)),
    ...(p.texts ?? []).map((t) => text(local(t), p.ink)),
    ...(p.serial && serial ? [text({ text: serial.replace('-', ''), x: p.x + p.serial.x, baseline: p.y + p.serial.baseline, cap: p.serial.cap, maxWidth: p.serial.maxWidth, die: p.serial.die, role: 'tab-serial' }, p.ink)] : []),
    ...(p.rivets ?? []).map(([cx, cy]) => n('circle', { cx: p.x + cx, cy: p.y + cy, r: 2.2, fill: '#8a8a80', stroke: '#3a3a36', strokeWidth: 0.6, 'data-role': 'rivet' })));
}

export interface KitSceneOptions {
  scope?: string;
  /** Optional overrides from the editor. */
  background?: string;
  ink?: string;
  decal?: DecalArt | null;
  metadata?: Record<string, unknown>;
  title?: string;
}

export function buildKitScene(recipe: KitRecipe, parts: Parts, options: KitSceneOptions = {}): SvgNode {
  const w = recipe.width, h = recipe.height;
  const id = (options.scope ?? `kit-${recipe.id}`).replace(/[^a-zA-Z0-9_-]/g, '') || 'kit';
  const ink = options.ink ?? recipe.ink, bg = options.background ?? recipe.background;
  const serial = parts.serial ?? '';
  const serialProfile = dieProfile(recipe.serial.die);
  const printable = serial.replace('-', '');
  if (!recipe.serial.font && !dieSupports(serialProfile, printable)) throw new RangeError(`Serial “${serial}” has characters the ${serialProfile.label} die does not include.`);
  const { nodes: serialNode, fit } = serialNodes(recipe, serial, ink);
  const holes = recipe.holes ?? 'slots';
  const hx = recipe.holeAt?.x.map((v) => v * w) ?? [w * 0.2, w * 0.8];
  const hy = recipe.holeAt?.y.map((v) => v * h) ?? [9, h - 9];
  const holeNodes = holes === 'none' ? [] : hx.flatMap((x) => hy.map((y) => holes === 'round'
    ? n('circle', { cx: x, cy: y, r: 3.2, fill: 'black' })
    : n('rect', { x: x - 10, y: y - 2.6, width: 20, height: 5.2, rx: 2.6, fill: 'black' })));
  const decal = recipe.decal;
  const decalNodes = !decal ? [] : options.decal
    ? [buildDecal(options.decal, decalBox(options.decal, decal)),
      ...(options.decal.day && recipe.extraWells?.[0] ? [buildDaySticker(options.decal.day, { x: recipe.extraWells[0].x + 3, y: recipe.extraWells[0].y + 2.5, width: recipe.extraWells[0].width - 6, height: recipe.extraWells[0].height - 5 })] : [])]
    : [n('rect', { x: decal.x, y: decal.y, width: decal.width, height: decal.height, rx: decal.rx ?? 2, fill: 'none', stroke: recipe.rim?.color ?? ink, strokeWidth: 0.8, 'data-role': 'blank-renewal-box' })];
  const wells = (recipe.extraWells ?? []).map((well) => n('rect', { x: well.x, y: well.y, width: well.width, height: well.height, rx: well.rx ?? 2, fill: 'none', stroke: recipe.rim?.color ?? ink, strokeWidth: 0.8, 'data-role': 'renewal-well' }));
  const rim = recipe.rim === undefined ? { inset: 4, width: 1.5 } : recipe.rim;
  const fonts = FONTS;
  const fontLegends = (recipe.fontLegends ?? []).map((t) => n('text', { x: t.x, y: t.baseline, fill: t.color ?? ink, fontFamily: fonts[t.font], fontSize: t.size,
    fontWeight: t.weight ?? 400, ...(t.italic ? { fontStyle: 'italic' } : {}), textAnchor: 'middle', ...(t.width ? { textLength: t.width, lengthAdjust: 'spacing' } : {}),
    'data-role': t.role, 'data-lettering': 'typeface-proxy' }, t.text));
  const inscriptions = [...(recipe.shapes ?? []).map((sh) => shape(sh, ink)), ...recipe.legends.map((t) => text(t, ink)), ...serialNode];
  const panels = (recipe.panels ?? []).map((p) => panel(p, serial, id));
  const meta = {
    jurisdiction: 'CA-BC', recipe: recipe.id, status: recipe.status ?? 'issued', physicalMm: { width: w, height: h },
    serial, parts, source: recipe.source, construction: recipe.embossed ? 'embossed' : 'flat',
    dies: { serial: serialProfile.id, evidence: serialProfile.evidence.status, fit },
    renewal: decal ? (options.decal ? { rendering: 'dated decal', year: options.decal.year, month: options.decal.month ?? null, style: options.decal.style } : { rendering: 'empty placement box only' }) : null,
    accuracy: { artwork: 'approximate vector reconstruction', dies: serialProfile.evidence.status, paint: 'uncalibrated digital approximation', allocations: 'supported subset only' },
    note: recipe.note, ...options.metadata,
  };
  const label = options.title ?? `British Columbia · ${recipe.label} · ${serial}`;
  return n('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${w} ${h}`, width: w, height: h, role: 'img', 'aria-label': label },
    n('title', {}, label), n('desc', {}, recipe.note), n('metadata', {}, JSON.stringify(meta)),
    n('defs', {},
      n('mask', { id: `${id}-holes`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: w, height: h }, n('rect', { width: w, height: h, fill: 'white' }), ...holeNodes),
      n('clipPath', { id: `${id}-shell` }, n('rect', { width: w, height: h, rx: recipe.radius })),
      n('filter', { id: `${id}-lift`, x: '-10%', y: '-10%', width: '125%', height: '130%' }, n('feDropShadow', { dx: 0.8, dy: 1.1, stdDeviation: 0.8, floodColor: '#000', floodOpacity: 0.4 })),
      n('filter', { id: `${id}-relief`, x: '-5%', y: '-10%', width: '110%', height: '125%' }, n('feDropShadow', { dx: 0.6, dy: 0.7, stdDeviation: 0.25, floodColor: '#000', floodOpacity: 0.3 }))),
    n('g', { mask: `url(#${id}-holes)` },
      n('rect', { width: w, height: h, rx: recipe.radius, fill: bg, 'data-role': 'base' }),
      n('g', { clipPath: `url(#${id}-shell)`, 'data-role': 'artwork' }, ...(recipe.art ?? []).map((a) => artwork(a.art, a, a.role ?? 'artwork'))),
      ...(rim ? [n('rect', { x: rim.inset, y: rim.inset, width: w - 2 * rim.inset, height: h - 2 * rim.inset, rx: Math.max(1, recipe.radius - rim.inset), fill: 'none', stroke: rim.color ?? ink, strokeWidth: rim.width })] : []),
      ...wells, ...decalNodes, ...fontLegends,
      n('g', recipe.embossed && parts.finish === 'embossed' ? { filter: `url(#${id}-relief)` } : {}, ...inscriptions)),
    ...panels);
}
