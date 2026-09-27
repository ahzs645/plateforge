import { createElement, type ReactNode, type ReactElement } from 'react';
import type { SvgNode } from './svg-scene';
function toReact(item: SvgNode | string, key: string): ReactNode {
  return typeof item === 'string' ? item : createElement(item.tag, { ...item.attrs, key },
    ...item.children.map((child, index) => toReact(child, `${key}-${index}`)));
}
/** Text children stay text nodes; never inserts raw user HTML. */
export function SvgScene({ node }: { node: SvgNode }): ReactElement {
  return toReact(node, 'scene') as ReactElement;
}
