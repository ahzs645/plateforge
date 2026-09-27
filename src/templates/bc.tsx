import { createElement, useId, type ReactElement, type ReactNode } from 'react';
import type { PlateTemplate, TemplateProps } from '../core/types';
import { FONTS } from './fonts';
import { bcGeometry, buildBcScene, type BcDesign, type SvgNode } from './bc/scene';

function toReact(node: SvgNode | string, key = 'root'): ReactNode {
  return typeof node === 'string' ? node : createElement(node.tag, { ...node.attrs, key },
    ...node.children.map((child, index) => toReact(child, `${key}-${index}`)));
}
function BcPlate({ design, parts }: TemplateProps<BcDesign>): ReactElement {
  const scope = `bc-${useId()}`;
  return toReact(buildBcScene(design, parts, scope)) as ReactElement;
}
export const bcTemplate: PlateTemplate<BcDesign> = {
  id: 'bc-historical', name: 'British Columbia · historical passenger systems',
  size: (design, parts) => bcGeometry(design, parts),
  render: BcPlate,
  fonts: [FONTS.barlow600, FONTS.barlow700],
};
