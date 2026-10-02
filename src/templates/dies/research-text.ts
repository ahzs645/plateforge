/** Swaps proxy-typeface text in a scene for research outlines where every character was observed. */
import { node as n, type SvgNode } from '../svg-scene';
import { buildDieText } from './engine';
import { researchTypeface } from './research-dies';

const KEEP = ['transform', 'opacity', 'clipPath', 'filter', 'data-lettering'] as const;
const ANCHORS = { start: 'start', middle: 'middle', end: 'end' } as const;

export function applyResearchTypefaces(item: SvgNode): SvgNode {
  if (item.tag === 'text') return researchText(item) ?? item;
  if (!item.children.some((c) => typeof c !== 'string')) return item;
  return { ...item, children: item.children.map((c) => (typeof c === 'string' ? c : applyResearchTypefaces(c))) };
}

function researchText(t: SvgNode): SvgNode | null {
  const { fontFamily, fontSize, fill } = t.attrs;
  if (typeof fontFamily !== 'string' || typeof fontSize !== 'number' || !t.children.every((c) => typeof c === 'string')) return null;
  const text = (t.children as string[]).join('');
  const role = String(t.attrs['data-role'] ?? 'legend');
  if (!text.trim()) return null;
  const profile = researchTypeface(fontFamily, text, role);
  if (!profile) return null;
  // Proxy fonts are sized so their caps are about 0.72 of the font size.
  const cap = fontSize * 0.72;
  const spacing = typeof t.attrs.letterSpacing === 'number' ? (t.attrs.letterSpacing * 100) / cap : 0;
  const run = buildDieText({
    text, profile, role, capHeight: cap, letterSpacing: spacing,
    x: Number(t.attrs.x ?? 0), baseline: Number(t.attrs.y ?? 0),
    anchor: ANCHORS[t.attrs.textAnchor as keyof typeof ANCHORS] ?? 'start',
    maxWidth: typeof t.attrs.textLength === 'number' ? t.attrs.textLength : undefined,
    ink: typeof fill === 'string' ? fill : 'currentColor',
  });
  const kept = Object.fromEntries(KEEP.filter((k) => t.attrs[k] !== undefined).map((k) => [k, t.attrs[k]]));
  return Object.keys(kept).length ? n('g', kept, run.node) : run.node;
}
