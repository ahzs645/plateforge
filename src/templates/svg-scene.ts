import { portableFamily } from './portable-typefaces';
/** Shared safe SVG scene contract for React and standalone serializers. */
export interface SvgNode {
  tag: string;
  attrs: Record<string, string | number>;
  children: Array<SvgNode | string>;
}
export const node = (tag: string, attrs: SvgNode['attrs'] = {}, ...children: SvgNode['children']): SvgNode => {
  const family = attrs.fontFamily;
  const replacement = typeof family === 'string' ? portableFamily(family) : undefined;
  // Retain the old lookup key so research replacement still resolves the same source-specific master.
  const resolved = replacement && replacement !== family ? { ...attrs, fontFamily: replacement,
    'data-original-font-family': family, 'data-typeface-status': 'portable-substitute' } : attrs;
  return { tag, attrs: resolved, children };
};
const attrNames: Record<string, string> = {
  stopColor: 'stop-color', stopOpacity: 'stop-opacity',
  fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight', fontStyle: 'font-style', fontVariant: 'font-variant',
  textAnchor: 'text-anchor', strokeWidth: 'stroke-width', strokeLinejoin: 'stroke-linejoin',
  strokeLinecap: 'stroke-linecap', strokeDasharray: 'stroke-dasharray', strokeMiterlimit: 'stroke-miterlimit', fillRule: 'fill-rule', clipRule: 'clip-rule', clipPath: 'clip-path', floodColor: 'flood-color', floodOpacity: 'flood-opacity',
};
export const escapeXml = (value: string): string => value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]!));
export function serializeSvgNode(item: SvgNode | string): string {
  if (typeof item === 'string') return escapeXml(item);
  const attrs = Object.entries(item.attrs).map(([key, value]) => ` ${attrNames[key] ?? key}="${escapeXml(String(value))}"`).join('');
  return `<${item.tag}${attrs}>${item.children.map(serializeSvgNode).join('')}</${item.tag}>`;
}
