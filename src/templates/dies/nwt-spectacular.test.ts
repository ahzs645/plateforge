import {describe, expect, it} from 'vitest';
import {buildNwtSpectacularSerial, NWT_SPECTACULAR_PROFILE} from './nwt-spectacular';
import {dieGlyph, dieRunWidth, dieSupports} from './engine';
import type {SvgNode} from '../svg-scene';

function allNodes(node: SvgNode): SvgNode[] {
  return [node, ...node.children.flatMap(child => typeof child === 'string' ? [] : allNodes(child))];
}

describe('NWT Spectacular serial', () => {
  it('keeps the narrow painted 1 in the same serial cell as every other digit', () => {
    for (const c of '0123456789NWT') expect(dieGlyph(NWT_SPECTACULAR_PROFILE, c)?.advance).toBe(48);
    expect(dieSupports(NWT_SPECTACULAR_PROFILE, 'NWT123')).toBe(true);
    expect(dieRunWidth(NWT_SPECTACULAR_PROFILE, '111111')).toBe(dieRunWidth(NWT_SPECTACULAR_PROFILE, '888888'));
  });
  it('outlines filled observed glyphs and stroked fallback glyphs without thickening their paint bodies', () => {
    const run = buildNwtSpectacularSerial({text: '12', x: 257, baseline: 195.5, capHeight: 106,
      ink: '#21566d', role: 'serial', anchor: 'middle'});
    const layers = run.node.children as SvgNode[];
    expect(run.height).toBe(106);
    for (const layer of layers.slice(0,2)) expect(layer.attrs['aria-hidden']).toBe('true');
    const painted = allNodes(layers[2]).filter(n => n.attrs['data-character']);
    expect(painted.every(n => n.attrs.stroke === 'none')).toBe(true);
    const genericRun = buildNwtSpectacularSerial({text: '40', x: 257, baseline: 195.5, capHeight: 106,
      ink: '#21566d', role: 'serial', anchor: 'middle'});
    const genericLayers = genericRun.node.children as SvgNode[];
    for (const [layer, expected] of [[genericLayers[0],15.5],[genericLayers[1],14]] as const) {
      const chars = allNodes(layer).filter(n => n.attrs['data-character']);
      expect(chars.every(n => n.attrs.fill === 'none' && n.attrs.strokeWidth === expected)).toBe(true);
    }
  });
});
