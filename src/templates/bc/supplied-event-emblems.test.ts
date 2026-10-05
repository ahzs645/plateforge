import {describe, expect, it} from 'vitest';
import {BC_OFFICIAL_FORMATS} from '../../regions/canada/bc-official';
import {kitRecipe} from '../../regions/canada/bc-kit';
import {buildKitScene} from './kit';
import {serializeSvgNode} from '../svg-scene';
import asiaPacific from './supplied-asia-pacific.json';
import gateway from './supplied-pacific-gateway.json';
import royal from './supplied-royal-1994.json';

const render = (id: string, serial: string) => serializeSvgNode(buildKitScene(kitRecipe(id), {serial}));
describe('supplied event emblems', () => {
  it('uses both supplied corner logos with the existing supplied APEC globe', () => {
    const svg = render('events-apec-1997', '126');
    expect(svg).toContain('user-supplied-canada-asia-pacific-1997-vector-package');
    expect(svg).toContain('user-supplied-maple-leaf-emblem-vector-package');
    expect(svg).toContain('user-supplied-apec-vector-kit');
    expect(svg).toContain('bc-supplied-pacific-gateway-fish-symbol');
    expect(svg).not.toMatch(/<(image|script|foreignObject)\b/);
  });
  it('preserves every supplied path on the plate, including the outlined Royal cypher', () => {
    const walk = (nodes: unknown[]): string[] => nodes.flatMap(raw => {
      const n = raw as {tag: string; attrs: {d?: string}; children: unknown[]};
      return typeof raw === 'string' ? [] : [...(n.tag === 'path' ? [n.attrs.d!] : []), ...walk(n.children)];
    });
    const apec = render('events-apec-1997', '126');
    for (const data of [asiaPacific, gateway]) for (const path of walk(data.nodes)) expect(apec).toContain(path);
    for (const id of ['events-royal-1994', 'events-royal-1994-proto']) {
      const svg = render(id, id.endsWith('proto') ? '94' : 'R1');
      for (const path of walk(royal.nodes)) expect(svg).toContain(path);
      expect(svg).toContain('clip-path="url(#bc-supplied-royal-1994-badge-clip)"');
      expect(svg).toContain('id="bc-supplied-royal-1994-badge-clip"');
      expect(svg).toContain('user-supplied-crowned-eiir-maple-emblem');
    }
  });
  it('exposes the designer context and its contemporary publication source', () => {
    const format = BC_OFFICIAL_FORMATS.find(f => f.id === 'events-apec-1997')!;
    expect(format.description).toContain('Amy Ho');
    expect(format.description).toContain('1995–96');
    expect(format.references?.some(r => r.url.includes('A22-165-1997-eng.pdf'))).toBe(true);
  });
});
