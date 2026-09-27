/** Shared safe SVG scene contract for React and standalone serializers. */
export interface SvgNode {
  tag: string;
  attrs: Record<string, string | number>;
  children: Array<SvgNode | string>;
}
export const node = (tag: string, attrs: SvgNode['attrs'] = {}, ...children: SvgNode['children']): SvgNode => ({ tag, attrs, children });
const attrNames: Record<string, string> = {
  fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight', fontStyle: 'font-style',
  textAnchor: 'text-anchor', strokeWidth: 'stroke-width', strokeLinejoin: 'stroke-linejoin',
  strokeLinecap: 'stroke-linecap', strokeDasharray: 'stroke-dasharray', fillRule: 'fill-rule', clipRule: 'clip-rule', clipPath: 'clip-path', floodColor: 'flood-color', floodOpacity: 'flood-opacity',
};
export const escapeXml = (value: string): string => value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]!));
export function serializeSvgNode(item: SvgNode | string): string {
  if (typeof item === 'string') return escapeXml(item);
  const attrs = Object.entries(item.attrs).map(([key, value]) => ` ${attrNames[key] ?? key}="${escapeXml(String(value))}"`).join('');
  return `<${item.tag}${attrs}>${item.children.map(serializeSvgNode).join('')}</${item.tag}>`;
}
