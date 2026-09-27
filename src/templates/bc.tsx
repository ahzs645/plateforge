import { useId, type ReactElement } from 'react';
import type { PlateTemplate, TemplateProps } from '../core/types';
import { SvgScene } from './SvgScene';
import { FONTS } from './fonts';
import { bcGeometry, buildBcScene, type BcDesign } from './bc/scene';
import { bcLaterGeometry, buildBcLaterScene } from './bc/later-scene';
import { buildKitScene, kitGeometry } from './bc/kit';
import { kitDecal, kitPalette, kitRecipe } from '../regions/canada/bc-kit';

function kitScene(design: BcDesign, parts: Parameters<typeof buildKitScene>[1], scope: string) {
  const recipe = kitRecipe(String(design.kit));
  const withDie = typeof parts.die === 'string' ? { ...recipe, serial: { ...recipe.serial, die: parts.die } } : recipe;
  const palette = kitPalette(recipe.id, parts.palette);
  return buildKitScene(withDie, parts, { scope, decal: kitDecal(recipe.id, parts), ...palette,
    ...(typeof design.background === 'string' ? { background: design.background } : {}), ...(typeof design.ink === 'string' ? { ink: design.ink } : {}) });
}

function BcPlate({ design, parts }: TemplateProps<BcDesign>): ReactElement {
  const scope = `bc-${useId()}`;
  return <SvgScene node={design.kit ? kitScene(design, parts, scope) : design.year >= 1964 ? buildBcLaterScene(design, parts, scope) : buildBcScene(design, parts, scope)} />;
}
export const bcTemplate: PlateTemplate<BcDesign> = {
  id: 'bc-historical', name: 'British Columbia · historical passenger systems',
  size: (design, parts) => design.kit ? kitGeometry(kitRecipe(String(design.kit))) : design.year >= 1964 ? bcLaterGeometry(design) : bcGeometry(design, parts),
  render: BcPlate,
  fonts: [FONTS.barlow600, FONTS.barlow700],
};
