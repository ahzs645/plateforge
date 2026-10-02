import { createElement } from 'react';
import type { Design, Parts, PlateTemplate } from '../core/types';
import { iraqCustomSize, iraqCustomStateFromParts, renderIraqCustom } from './iraq-custom-scene';

const presetOf = (design: Design) => String(design.presetId ?? '');

/** The flat Iraq editor engine behind the standard template contract: one renderer for the editor, timeline and gallery. */
export const iqFlatTemplate: PlateTemplate = {
  id: 'iq-flat', name: 'Iraq · flat parametric outlines',
  size: (design, parts: Parts = {}) => iraqCustomSize(iraqCustomStateFromParts(presetOf(design), parts)),
  render: ({ design, parts, text }) => {
    const scene = renderIraqCustom(iraqCustomStateFromParts(presetOf(design), parts));
    // The scene escapes every edited value and draws text as outline paths; no font files are needed for export.
    return createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${scene.width} ${scene.height}`,
      role: 'img', 'aria-label': text, 'data-preset': presetOf(design), dangerouslySetInnerHTML: { __html: scene.body } });
  },
};
