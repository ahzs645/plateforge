/**
 * Reusable B.C. plate kit: one data-driven scene builder for every base that is
 * not one of the original 1940–1985 passenger recipes. A recipe lists the shell,
 * artwork, legends, serial die and renewal well; nothing here is drawn per plate.
 * All coordinates are millimetres on the physical plate.
 */
import type { Parts } from '../../core/types';
import { node as n, type SvgNode } from '../svg-scene';
import { buildLeatherScene } from './leather-scene';
import { leatherGeometry } from './leather-specimens';
import { buildDieText, dieRunWidth, dieSupports, type DieRun } from '../dies/engine';
import { dieProfile } from '../dies/profiles';
import { withResearchContext } from '../dies/research-dies';
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
  /** Printed small capitals (e.g. "British" → B + small RITISH). */
  smallCaps?: boolean;
  /** Hard drop shadow: a copy of the line in `color`, offset by dx/dy mm, drawn underneath. */
  shadow?: { dx: number; dy: number; color: string };
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
  /** Flat printed outline lettering, outside the serial's optional embossed relief. */
  screened?: boolean;
  /** Extra spacing between characters, in cap-height units (100 = one cap height). */
  spacing?: number;
  /** Adjust the gap for a named adjacent pair without changing either glyph. */
  kerning?: Readonly<Record<string, number>>;
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
  /** Use the corresponding passenger master for a shared manufactured serial alphabet. */
  researchFormats?: Readonly<Record<string, string>>;
  color?: string;
  /** Pair spacing for a documented fixed serial wordmark. */
  kerning?: Readonly<Record<string, number>>;
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
  /** Local cut and inset rim geometry for shaped renewal pieces. */
  bodyPath?: string;
  rimPath?: string;
  holes?: readonly {cx: number; cy: number; r: number}[];
  texts?: readonly KitText[]; art?: readonly KitArt[]; shapes?: readonly KitShape[];
  /** Serial repeated in miniature on the tab. */
  serial?: { x: number; baseline: number; cap: number; maxWidth: number; die: string };
  rivets?: readonly (readonly [number, number])[];
  role: string;
}

export interface KitRecipe {
  /** Pre-provincial specimen renderer. Its coordinates are image-relative, not measured mm. */
  leatherSpecimen?: string;
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
  /** Explicit physical mounting holes for nonrectangular plates. */
  holeGeometry?: readonly ({ cx: number; cy: number; r: number } | { cx: number; cy: number; width: number; height: number; rx: number })[];
  /** Die-cut body outline, shared by the artwork clip and complete-content mask. */
  cutOutline?: { path: string; viewBox: readonly [number, number] };
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
  /** A removable renewal piece, fitted over the base by default. */
  renewalPanel?: KitPanel;
  /** Stamped relief vs. flat screened/printed characters. */
  embossed: boolean;
  status?: string;
  artworkAccuracy?: string;
  source: { title: string; url: string };
  note: string;
}


function kitCanvas(recipe: KitRecipe, parts: Parts = {}) {
  const p = recipe.renewalPanel;
  if (p && parts.renewal === 'loose') return {x: 0, y: 0, width: p.width, height: p.height};
  const fitted = p && parts.renewal !== 'base-only';
  const x = fitted ? Math.min(0, p.x) : 0, y = fitted ? Math.min(0, p.y) : 0;
  return {x, y, width: (fitted ? Math.max(recipe.width, p.x + p.width) : recipe.width) - x,
    height: (fitted ? Math.max(recipe.height, p.y + p.height) : recipe.height) - y};
}

export function kitGeometry(recipe: KitRecipe, parts: Parts = {}) {
  if (recipe.leatherSpecimen || recipe.id === 'early-1904') return leatherGeometry(recipe.leatherSpecimen ?? '1143');
  const {width, height} = kitCanvas(recipe, parts);
  return {width, height};
}

function text(t: KitText, ink: string): SvgNode {
  const profile = dieProfile(t.die);
  let spacing = t.spacing;
  if (t.spread && t.maxWidth) {
    const natural = (dieRunWidth(profile, t.text) * t.cap) / 100, gaps = [...t.text].length - 1;
    if (gaps > 0 && natural < t.maxWidth) spacing = ((t.maxWidth - natural) / gaps) * (100 / t.cap);
  }
  return buildDieText({ text: t.text, profile, x: t.x, baseline: t.baseline, capHeight: t.cap, maxWidth: t.maxWidth,
    anchor: t.anchor ?? 'middle', ink: t.color ?? ink, role: t.role, letterSpacing: spacing, kerning: t.kerning }).node;
}

/** Serial, split around an artwork separator when the recipe asks for one. */
const FONTS = { serif: 'Georgia, "Times New Roman", serif', sans: '"Barlow Condensed", "Arial Narrow", sans-serif' };

function serialNodes(recipe: KitRecipe, serial: string, ink: string): { nodes: SvgNode[]; fit: DieRun['fit'] } {
  return withSerialContext(recipe, () => serialNodesInContext(recipe, serial, ink));
}

function withSerialContext<T>(recipe: KitRecipe, build: () => T): T {
  const format = recipe.serial.researchFormats?.[recipe.serial.die];
  return format ? withResearchContext(format, build) : build();
}

function serialNodesInContext(recipe: KitRecipe, serial: string, ink: string): { nodes: SvgNode[]; fit: DieRun['fit'] } {
  const s = recipe.serial, profile = serialProfile(recipe), color = s.color ?? ink;
  if (s.font) {
    // Typeface serials: sized by cap height (0.72 em) and never stretched.
    return { nodes: [n('text', { x: s.x, y: s.baseline, fill: color, fontFamily: FONTS[s.font.family], fontSize: s.cap / 0.72, fontWeight: s.font.weight ?? 700,
      textAnchor: 'middle', 'data-role': 'serial', 'data-lettering': 'typeface-proxy' }, serial.replace('-', ''))], fit: 'natural' };
  }
  if (s.leadingBar && /^\d-\d{3}$/.test(serial)) serial = `‒${serial}`;
  const sep = s.separator ?? { kind: 'dash' };
  if (sep.kind === 'art' && serial.includes('-')) {
    const [left, right] = serial.split('-', 2);
    const measure = (value: string) => buildDieText({ text: value, profile, x: 0, baseline: s.baseline, capHeight: s.cap, ink: color, role: 'x', kerning: s.kerning }).width;
    const natural = measure(left) + measure(right) + sep.art.width + 2 * sep.gap;
    const k = Math.min(1, s.maxWidth / natural);
    const cap = s.cap * k, total = natural * k;
    let x = s.x - total / 2;
    const l = buildDieText({ text: left, profile, x, baseline: s.baseline, capHeight: cap, anchor: 'start', ink: color, role: 'serial-left', kerning: s.kerning });
    x += l.width + sep.gap * k;
    const artNode = artwork(sep.art.art, { x, y: sep.art.y + (sep.art.height * (1 - k)) / 2, width: sep.art.width * k, height: sep.art.height * k, color: sep.art.color ?? color }, 'serial-separator');
    x += sep.art.width * k + sep.gap * k;
    const r = buildDieText({ text: right, profile, x, baseline: s.baseline, capHeight: cap, anchor: 'start', ink: color, role: 'serial-right', kerning: s.kerning });
    return { nodes: [n('g', { 'data-role': 'serial', 'aria-label': serial }, l.node, artNode, r.node)], fit: k < 1 ? 'reduced' : 'natural' };
  }
  const shown = sep.kind === 'dot' ? serial.replace('-', '·') : sep.kind === 'gap' ? serial.replace('-', ' ') : sep.kind === 'none' || sep.kind === 'art' ? serial.replace('-', '') : serial;
  const run = buildDieText({ text: shown, profile, x: s.x, baseline: s.baseline, capHeight: s.cap, maxWidth: s.maxWidth, ink: color, role: 'serial', kerning: s.kerning });
  return { nodes: [run.node], fit: run.fit };
}

/** Shared manufactured alphabets keep the same glyph when a different number is typed. */
function serialProfile(recipe: KitRecipe) {
  const profile = dieProfile(recipe.serial.die);
  return recipe.serial.researchFormats?.[recipe.serial.die]
    ? {...profile, allowResearchReplacement: false} : profile;
}

function shape(sh: KitShape, ink: string): SvgNode {
  const dash: Record<string, string> = 'dash' in sh && sh.dash ? { strokeDasharray: sh.dash } : {};
  if (sh.kind === 'rect') return n('rect', { x: sh.x, y: sh.y, width: sh.width, height: sh.height, rx: sh.rx ?? 0, fill: sh.fill ?? 'none', stroke: sh.stroke ?? (sh.fill ? 'none' : ink), strokeWidth: sh.strokeWidth ?? 1, ...dash });
  if (sh.kind === 'line') return n('path', { d: `M${sh.x1} ${sh.y1} L${sh.x2} ${sh.y2}`, stroke: sh.stroke ?? ink, strokeWidth: sh.strokeWidth ?? 1, ...dash });
  return n('circle', { cx: sh.cx, cy: sh.cy, r: sh.r, fill: sh.fill ?? ink, ...(sh.stroke ? { stroke: sh.stroke, strokeWidth: sh.strokeWidth ?? 1 } : {}) });
}

function panel(p: KitPanel, serial: string, id: string, lift?: string): SvgNode {
  const mask = `${id}-${p.role}-body`;
  const body = (fill: string) => p.bodyPath ? n('path', {d: p.bodyPath, fill})
    : n('rect', {width: p.width, height: p.height, rx: p.radius ?? 3, fill});
  return n('g', { 'data-role': p.role, transform: `translate(${p.x} ${p.y})`, ...(lift ? {filter: `url(#${lift})`} : {}) },
    n('defs', {}, n('mask', {id: mask, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: p.width, height: p.height},
      body('white'), ...(p.holes ?? []).map(({cx, cy, r}) => n('circle', {cx, cy, r, fill: 'black', 'data-role': 'tab-hole'})))),
    n('g', {mask: `url(#${mask})`, color: p.ink}, body(p.background),
      p.rimPath ? n('path', {d: p.rimPath, fill: 'none', stroke: p.ink, strokeWidth: 1.5, 'data-role': 'tab-rim'})
        : n('rect', {x: 2, y: 2, width: p.width - 4, height: p.height - 4, rx: Math.max(1, (p.radius ?? 3) - 1), fill: 'none', stroke: p.ink, strokeWidth: 1}),
      ...(p.art ?? []).map((a) => artwork(a.art, {...a, color: a.color ?? p.ink}, a.role ?? 'tab-art')),
      ...(p.shapes ?? []).map((sh) => shape(sh, p.ink)),
      ...(p.texts ?? []).map((t) => text(t, p.ink)),
      ...(p.serial && serial ? [text({text: serial.replace('-', ''), ...p.serial, role: 'tab-serial'}, p.ink)] : []),
      ...(p.rivets ?? []).map(([cx, cy]) => n('circle', {cx, cy, r: 2.2, fill: '#8a8a80', stroke: '#3a3a36', strokeWidth: 0.6, 'data-role': 'rivet'}))));
}

export interface KitSceneOptions {
  scope?: string;
  /** Values for {yy}/{yyyy}/{y1}/{y2} tokens in legends (annual palettes; y1/y2 are the year's last two digits). */
  tokens?: Record<string, string>;
  /** Optional overrides from the editor. */
  background?: string;
  ink?: string;
  decal?: DecalArt | null;
  metadata?: Record<string, unknown>;
  title?: string;
}

export function buildKitScene(recipe: KitRecipe, parts: Parts, options: KitSceneOptions = {}): SvgNode {
  if (recipe.leatherSpecimen || recipe.id === 'early-1904') return buildLeatherScene(parts, {
    ...options, specimen: recipe.leatherSpecimen ?? '1143',
  });
  const w = recipe.width, h = recipe.height;
  const id = (options.scope ?? `kit-${recipe.id}`).replace(/[^a-zA-Z0-9_-]/g, '') || 'kit';
  const canvas = kitCanvas(recipe, parts);
  if (recipe.renewalPanel && parts.renewal === 'loose') {
    const p = recipe.renewalPanel;
    return n('svg', {xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${p.width} ${p.height}`, width: p.width, height: p.height, role: 'img', 'aria-label': `${recipe.label} · loose renewal tab`},
      n('title', {}, `${recipe.label} · loose renewal tab`), n('desc', {}, recipe.note),
      n('metadata', {}, JSON.stringify({jurisdiction: 'CA-BC', source: recipe.source, renewal: 'loose', baseSerial: null})),
      panel({...p, x: 0, y: 0}, '', id));
  }
  const ink = options.ink ?? recipe.ink, bg = options.background ?? recipe.background;
  const serial = parts.serial ?? '';
  const profile = withSerialContext(recipe, () => serialProfile(recipe));
  const printable = serial.replace('-', '');
  if (serial && !recipe.serial.font && !dieSupports(profile, printable)) throw new RangeError(`Serial “${serial}” has characters the ${profile.label} die does not include.`);
  const { nodes: serialNode, fit } = serial ? serialNodes(recipe, serial, ink) : { nodes: [], fit: 'natural' as const };
  const holes = recipe.holes ?? 'slots';
  const hx = recipe.holeAt?.x.map((v) => v * w) ?? [w * 0.2, w * 0.8];
  const hy = recipe.holeAt?.y.map((v) => v * h) ?? [9, h - 9];
  const holeNodes = holes === 'none' ? [] : recipe.holeGeometry ? recipe.holeGeometry.map((hole) => 'r' in hole
    ? n('circle', { cx: hole.cx, cy: hole.cy, r: hole.r, fill: 'black', 'data-role': 'mounting-hole' })
    : n('rect', { x: hole.cx - hole.width / 2, y: hole.cy - hole.height / 2, width: hole.width, height: hole.height, rx: hole.rx, fill: 'black', 'data-role': 'mounting-hole' }))
    : hx.flatMap((x) => hy.map((y) => holes === 'round'
    ? n('circle', { cx: x, cy: y, r: 3.2, fill: 'black' })
    : n('rect', { x: x - 10, y: y - 2.6, width: 20, height: 5.2, rx: 2.6, fill: 'black' })));
  const body = (fill?: string) => recipe.cutOutline
    ? n('path', { d: recipe.cutOutline.path, transform: `scale(${w / recipe.cutOutline.viewBox[0]} ${h / recipe.cutOutline.viewBox[1]})`, ...(fill ? { fill } : {}) })
    : n('rect', { width: w, height: h, rx: recipe.radius, ...(fill ? { fill } : {}) });
  const decal = recipe.decal;
  const decalNodes = !decal ? [] : options.decal
    ? [buildDecal(options.decal, decalBox(options.decal, decal)),
      ...(options.decal.day && recipe.extraWells?.[0] ? [buildDaySticker(options.decal.day, { x: recipe.extraWells[0].x + 3, y: recipe.extraWells[0].y + 2.5, width: recipe.extraWells[0].width - 6, height: recipe.extraWells[0].height - 5 })] : [])]
    : [n('rect', { x: decal.x, y: decal.y, width: decal.width, height: decal.height, rx: decal.rx ?? 2, fill: 'none', stroke: recipe.rim?.color ?? ink, strokeWidth: 0.8, 'data-role': 'blank-renewal-box' })];
  const wells = (recipe.extraWells ?? []).map((well) => n('rect', { x: well.x, y: well.y, width: well.width, height: well.height, rx: well.rx ?? 2, fill: 'none', stroke: recipe.rim?.color ?? ink, strokeWidth: 0.8, 'data-role': 'renewal-well' }));
  const rim = recipe.rim === undefined ? { inset: 4, width: 1.5 } : recipe.rim;
  const fonts = FONTS;
  const fontLegend = (t: KitFontText, x: number, y: number, fillColor: string, role: string) => n('text', { x, y, fill: fillColor, fontFamily: fonts[t.font], fontSize: t.size,
    fontWeight: t.weight ?? 400, ...(t.italic ? { fontStyle: 'italic' } : {}), ...(t.smallCaps ? { fontVariant: 'small-caps' } : {}), textAnchor: 'middle',
    ...(t.width ? { textLength: t.width, lengthAdjust: 'spacing' } : {}), 'data-role': role, 'data-lettering': 'typeface-proxy' }, t.text);
  const fontLegends = (recipe.fontLegends ?? []).flatMap((t) => [
    ...(t.shadow ? [fontLegend(t, t.x + t.shadow.dx, t.baseline + t.shadow.dy, t.shadow.color, `${t.role}-shadow`)] : []),
    fontLegend(t, t.x, t.baseline, t.color ?? ink, t.role)]);
  const fill = (value: string) => value.replace(/\{(\w+)\}/g, (m, k: string) => options.tokens?.[k] ?? m);
  const screenedLegends = recipe.legends.filter(t => t.screened).map(t => text({...t, text: fill(t.text)}, ink));
  const inscriptions = [...(recipe.shapes ?? []).map((sh) => shape(sh, ink)), ...recipe.legends.filter(t => !t.screened).map((t) => text({ ...t, text: fill(t.text) }, ink)), ...serialNode];
  const panels = [...(recipe.panels ?? []), ...(recipe.renewalPanel && parts.renewal !== 'base-only' ? [recipe.renewalPanel] : [])]
    .map((p, i) => panel(p, serial, `${id}-panel${i}`, `${id}-lift`));
  const meta = {
    jurisdiction: 'CA-BC', recipe: recipe.id, status: recipe.status ?? 'issued', physicalMm: { width: w, height: h },
    serial, parts, source: recipe.source, construction: recipe.embossed ? 'embossed' : 'flat',
    dies: { serial: profile.id, evidence: profile.evidence.status, fit,
      ...(recipe.serial.researchFormats?.[recipe.serial.die] ? {sharedPassengerFormat: recipe.serial.researchFormats[recipe.serial.die]} : {}) },
    renewal: recipe.renewalPanel ? {rendering: parts.renewal === 'base-only' ? 'base only' : 'separately mounted tab',
      physicalMm: {width: recipe.renewalPanel.width, height: recipe.renewalPanel.height}, independentSerial: 'not supplied'}
      : decal ? (options.decal ? { rendering: 'dated decal', year: options.decal.year, month: options.decal.month ?? null, style: options.decal.style } : { rendering: 'empty placement box only' }) : null,
    accuracy: { artwork: recipe.artworkAccuracy ?? 'approximate vector reconstruction', dies: profile.evidence.status, paint: 'uncalibrated digital approximation', allocations: 'supported subset only' },
    note: recipe.note, ...options.metadata,
  };
  const label = options.title ?? `British Columbia · ${recipe.label} · ${serial}`;
  return n('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `${canvas.x} ${canvas.y} ${canvas.width} ${canvas.height}`, width: canvas.width, height: canvas.height, role: 'img', 'aria-label': label },
    n('title', {}, label), n('desc', {}, recipe.note), n('metadata', {}, JSON.stringify(meta)),
    n('defs', {},
      n('mask', { id: `${id}-holes`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: w, height: h }, recipe.cutOutline ? body('white') : n('rect', {width: w, height: h, fill: 'white'}), ...holeNodes),
      n('clipPath', { id: `${id}-shell` }, body()),
      n('filter', { id: `${id}-lift`, x: '-10%', y: '-10%', width: '125%', height: '130%' }, n('feDropShadow', { dx: 0.8, dy: 1.1, stdDeviation: 0.8, floodColor: '#000', floodOpacity: 0.4 })),
      n('filter', { id: `${id}-relief`, x: '-5%', y: '-10%', width: '110%', height: '125%' }, n('feDropShadow', { dx: 0.6, dy: 0.7, stdDeviation: 0.25, floodColor: '#000', floodOpacity: 0.3 }))),
    n('g', { mask: `url(#${id}-holes)` },
      n('rect', { width: w, height: h, rx: recipe.radius, fill: bg, 'data-role': 'base' }),
      n('g', { clipPath: `url(#${id}-shell)`, color: ink, 'data-role': 'artwork' }, ...(recipe.art ?? []).map((a) => artwork(a.art, a, a.role ?? 'artwork'))),
      ...(rim ? [n('rect', { x: rim.inset, y: rim.inset, width: w - 2 * rim.inset, height: h - 2 * rim.inset, rx: Math.max(1, recipe.radius - rim.inset), fill: 'none', stroke: rim.color ?? ink, strokeWidth: rim.width })] : []),
      ...wells, ...decalNodes, ...fontLegends, ...screenedLegends,
      n('g', recipe.embossed && parts.finish === 'embossed' ? { filter: `url(#${id}-relief)` } : {}, ...inscriptions)),
    ...panels);
}
