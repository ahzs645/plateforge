import { createElement } from 'react';
import type { PlateTemplate } from '../core/types';
import { iranScene, iranSize } from './westasia-scene';
import { iranCustomSize, renderIranCustom } from './iran-custom-scene';
import { iranStateForPlate, iranSvgBody } from './iran-region-bridge';

export const irTemplate: PlateTemplate = {
  id: 'ir', name: 'Iran · source-aware SVG reconstruction',
  size: (design, parts) => {
    const state = iranStateForPlate(design, parts);
    return state ? iranCustomSize(state) : iranSize(design);
  },
  render: ({ design, parts, text }) => {
    const state = iranStateForPlate(design, parts);
    if (state) {
      const scene = renderIranCustom(state);
      return createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${scene.width} ${scene.height}`,
        role: 'img', 'aria-label': text, 'data-canonical': 'true', 'data-preset': state.presetId,
        dangerouslySetInnerHTML: { __html: iranSvgBody(scene.svg) } });
    }
    const scene = iranScene(design, parts, text);
    return createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${scene.width} ${scene.height}`,
      role: 'img', 'aria-label': text, dangerouslySetInnerHTML: { __html: scene.body } });
  },
};
