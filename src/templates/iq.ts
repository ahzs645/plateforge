import { createElement } from 'react';
import type { PlateTemplate } from '../core/types';
import { iraqScene, iraqSize } from './westasia-scene';

export const iqTemplate: PlateTemplate = {
  id: 'iq', name: 'Iraq · era-aware SVG reconstruction', size: iraqSize,
  render: ({ design, parts, text }) => {
    const scene = iraqScene(design, parts, text);
    // Only the escaping scene builder supplies markup; no remote SVG or raw user HTML is accepted.
    return createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${scene.width} ${scene.height}`,
      role: 'img', 'aria-label': text, dangerouslySetInnerHTML: { __html: scene.body } });
  },
};
