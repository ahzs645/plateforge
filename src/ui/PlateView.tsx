import { memo, type Ref } from 'react';
import { resolveDesign, templateFor } from '../core/registry';
import type { Design, Plate } from '../core/types';

interface Props {
  plate: Plate;
  overrides?: Design;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/** Renders any plate through its format's (or region's) template. */
export const PlateView = memo(function PlateView({ plate, overrides, className, ref }: Props) {
  const template = templateFor(plate.region, plate.format);
  const design = resolveDesign(plate.region, plate.format, overrides);
  const Render = template.render;
  return (
    <div ref={ref} className={className}>
      <Render parts={plate.parts} design={design} text={plate.text} />
    </div>
  );
});
