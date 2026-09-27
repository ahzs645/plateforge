import { memo, type Ref } from 'react';
import { getTemplate, resolveDesign } from '../core/registry';
import type { Design, Plate } from '../core/types';

interface Props {
  plate: Plate;
  overrides?: Design;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/** Renders any plate through its region's template. */
export const PlateView = memo(function PlateView({ plate, overrides, className, ref }: Props) {
  const template = getTemplate(plate.region.template);
  const design = resolveDesign(plate.region, plate.format, overrides);
  const Render = template.render;
  return (
    <div ref={ref} className={className}>
      <Render parts={plate.parts} design={design} text={plate.text} />
    </div>
  );
});
