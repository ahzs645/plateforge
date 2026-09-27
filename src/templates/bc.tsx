import { useId, type ReactElement } from 'react';
import type { PlateTemplate, TemplateProps } from '../core/types';
import { SvgScene } from './SvgScene';
import { FONTS } from './fonts';
import { bcGeometry, buildBcScene, type BcDesign } from './bc/scene';
import { bcLaterGeometry, buildBcLaterScene } from './bc/later-scene';

function BcPlate({ design, parts }: TemplateProps<BcDesign>): ReactElement {
  const scope = `bc-${useId()}`;
  return <SvgScene node={design.year >= 1964 ? buildBcLaterScene(design, parts, scope) : buildBcScene(design, parts, scope)} />;
}
export const bcTemplate: PlateTemplate<BcDesign> = {
  id: 'bc-historical', name: 'British Columbia · historical passenger systems',
  size: (design, parts) => design.year >= 1964 ? bcLaterGeometry(design) : bcGeometry(design, parts),
  render: BcPlate,
  fonts: [FONTS.barlow600, FONTS.barlow700],
};
