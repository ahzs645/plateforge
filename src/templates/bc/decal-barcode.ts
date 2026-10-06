import { node, type SvgNode } from '../svg-scene';
import patterns from './code128-patterns.json';

/** Code 128 C: four inspected originals decode to their printed control number. */
export function code128Codes(value: string): number[] {
  if (!/^\d{8}$/.test(value)) throw new RangeError('Decal barcode requires eight control digits.');
  const codes = [105, ...value.match(/\d{2}/g)!.map(Number)];
  const check = codes.reduce((sum, code, index) => sum + code * (index || 1), 0) % 103;
  return [...codes, check, 106];
}

export function buildCode128(value: string, box: {x: number; y: number; width: number; height: number}, ink: string): SvgNode {
  const widths = code128Codes(value).flatMap(code => patterns[code]);
  const modules = widths.reduce((sum, width) => sum + width, 0);
  const scale = box.width / (modules + 20); // Ten-module quiet zone on each side.
  let cursor = 10;
  const bars: SvgNode[] = [];
  widths.forEach((width, index) => {
    if (index % 2 === 0) bars.push(node('rect', {x: box.x + cursor * scale, y: box.y, width: width * scale, height: box.height, fill: ink}));
    cursor += width;
  });
  return node('g', {'data-role':'decal-barcode', 'data-encoding':'Code128C', 'data-control':value, role:'img', 'aria-label':`Control barcode ${value}`}, ...bars);
}
