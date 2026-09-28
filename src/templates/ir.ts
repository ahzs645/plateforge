import { createElement } from 'react';
import type { PlateTemplate } from '../core/types';
import { iranScene, iranSize } from './westasia-scene';

export const irTemplate: PlateTemplate = {
  id: 'ir', name: 'Iran · script-aware SVG reconstruction', size: iranSize,
  render: ({ design, parts, text }) => {
    const scene = iranScene(design, parts, text);
    return createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${scene.width} ${scene.height}`,
      role: 'img', 'aria-label': text, dangerouslySetInnerHTML: { __html: scene.body } });
  },
};
