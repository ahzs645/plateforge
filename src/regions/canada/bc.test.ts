import { describe, it } from 'vitest';
import { equal, deepEqual, ok, throws } from 'node:assert/strict';
import { createRng } from '../../core/random';
import { britishColumbia, compactBcSerial, displayBcSerial, validateBcSerial } from './bc';
import { BC_YEARS, bcYear } from './bc-data';
import { bcGeometry, buildBcScene, renderBcSvg, type BcDesign, type SvgNode } from '../../templates/bc/scene';

function nodes(root: SvgNode, role: string): SvgNode[] {
  return [root, ...root.children.flatMap((child) => typeof child === 'string' ? [] : nodes(child, role))]
    .filter((node) => node.attrs['data-role'] === role);
}
function metadata(year: number, serial: string) {
  const root = buildBcScene({ year }, { serial, finish: 'flat' });
  const node = root.children.find((child) => typeof child !== 'string' && child.tag === 'metadata') as SvgNode;
  return JSON.parse(node.children[0] as string);
}

describe('British Columbia passenger system', () => {
  it('covers every chart year with five families and a separate 1962 variant', () => {
    equal(BC_YEARS.length, 24);
    equal(britishColumbia.formats.length, 25);
    equal(new Set(BC_YEARS.map((r) => r.layout)).size, 5);
    deepEqual(BC_YEARS.map((r) => r.year), Array.from({ length: 24 }, (_, i) => 1940 + i));
    equal(new Set(britishColumbia.formats.map((f) => f.id)).size, 25);
    throws(() => bcYear(1939), RangeError);
    throws(() => bcYear(1964), RangeError);
  });
  for (const format of britishColumbia.formats) {
    it(`${format.id}: 400 seeded samples validate and render deterministically`, () => {
      const a = createRng(`bc-${format.id}`), b = createRng(`bc-${format.id}`);
      for (let i = 0; i < 400; i++) {
        const parts = format.generate(a);
        deepEqual(parts, format.generate(b));
        equal(format.validate?.(parts), null, JSON.stringify(parts));
        for (const field of format.fields) {
          equal(typeof parts[field.key], 'string');
          if (field.options) ok(field.options.some((option) => option.value === parts[field.key]));
        }
        const svg = renderBcSvg(format.design as BcDesign, parts, `test-${format.id}-${i}`);
        ok(svg.startsWith('<svg'));
        ok(svg.includes('<metadata>'));
        ok(!svg.includes('NaN'));
        ok(!svg.includes('Infinity'));
        ok(!svg.includes('<image'));
        ok(!svg.includes('data:font'));
      }
    });
  }
  it('accepts every supplied chart sample', () => {
    for (const recipe of BC_YEARS) equal(validateBcSerial(recipe.sample, recipe), null, `${recipe.year}`);
  });
  it('normalizes only supported separator positions and rejects dirty input', () => {
    for (const [input, display] of [['12345', '12-345'], ['1877', '1-877'], ['999', '999'], ['A1234', 'A1-234'], ['A12', 'A-12'], ['1A123', '1A-123']]) {
      equal(displayBcSerial(input), display);
      equal(displayBcSerial(display), display);
    }
    for (const dirty of ['', '0123', '12-34', 'ABC123', '123--456', '123 456', '<script>', '1234567']) equal(compactBcSerial(dirty), null);
  });
  it('distinguishes 1947 farm-prefix use from 1948 passenger replacements', () => {
    equal(validateBcSerial('F-123', bcYear(1947)), null);
    ok(validateBcSerial('F-123', bcYear(1948)));
    equal(validateBcSerial('W-123', bcYear(1948)), null);
    ok(validateBcSerial('T-123', bcYear(1948)));
  });
  it('keeps supported 1952-base letter positions separate from later all-numeric plates', () => {
    for (const value of ['99999', 'A1-234', '1A-123', 'T-123', 'U1-234']) equal(validateBcSerial(value, bcYear(1952)), null);
    for (const value of ['100000', 'W-123', '12345A', '0A-123', '1A-000']) ok(validateBcSerial(value, bcYear(1952)));
    ok(validateBcSerial('A1-234', bcYear(1955)));
    equal(validateBcSerial('350-770', bcYear(1961)), null);
  });
  it('resolves pre-standard dimensions and the 99999/100000 boundary', () => {
    equal(bcGeometry({ year: 1940 }, { serial: '12345' }).width, 290);
    equal(bcGeometry({ year: 1947 }, { serial: '12345' }).width, 287);
    for (const year of [1949, 1950, 1951]) {
      deepEqual(bcGeometry({ year }, { serial: '99-999' }), { width: 287, height: 137, long: false });
      deepEqual(bcGeometry({ year }, { serial: '100-000' }), { width: 335, height: 137, long: true });
    }
    deepEqual(bcGeometry({ year: 1952 }, { serial: '12345' }), { width: 350, height: 140, long: false });
    deepEqual(bcGeometry({ year: 1955 }, { serial: '12345' }), { width: 300, height: 150, long: false });
  });
  it('retains the 1950 date under a separately numbered 1951 strip', () => {
    const scene = buildBcScene({ year: 1951 }, { serial: '79-583', tabSerial: '250001', finish: 'flat' });
    equal(nodes(scene, 'base-year-tens')[0].children[0], '5');
    equal(nodes(scene, 'base-year-ones')[0].children[0], '0');
    equal(nodes(scene, 'renewal-legend')[0].children[0], 'BRITISH·51·COLUMBIA');
    equal(nodes(scene, 'tab-serial')[0].children[0], '250001');
    equal(metadata(1951, '79-583').baseYear, 1950);
    equal(metadata(1951, '79-583').renewal.widthMm, 270);
    equal(metadata(1951, '123-456').renewal.widthMm, 318);
    equal(metadata(1951, '230-001').material, 'aluminum');
  });
  it('reuses one totem master across the 1952 base and 1953/54 overlays', () => {
    for (const year of [1953, 1954]) {
      const scene = buildBcScene({ year }, { serial: '12345' }, `year-${year}`);
      equal(nodes(scene, 'base-year')[0].children[0], '5·2');
      equal(nodes(scene, 'renewal-year')[0].children[0], `5·${year % 10}`);
      equal(nodes(scene, 'base-emblem')[0].attrs.href, nodes(scene, 'tab-emblem')[0].attrs.href);
      equal(metadata(year, '12345').renewal.widthMm, 90);
      equal(metadata(year, '12345').baseYear, 1952);
    }
  });
  it('uses the independent centenary inscriptions and plate date', () => {
    const scene = buildBcScene({ year: 1958 }, { serial: '126175' });
    equal(nodes(scene, 'centenary')[0].children[0], '1858   CENTENARY   1958');
    equal(nodes(scene, 'province')[0].attrs.y, 28);
    equal(metadata(1958, '126175').baseYear, 1958);
  });
  it('restricts the explicit no-dash variant without claiming every 1962 plate was dashless', () => {
    const format = britishColumbia.formats.find((f) => f.id === '1962-no-dash')!;
    equal(format.validate?.({ serial: '1877' }), null);
    ok(format.validate?.({ serial: '1-877' }));
    ok(format.validate?.({ serial: '2000' }));
    equal(format.text?.({ serial: '1877' }), '1877');
    equal(britishColumbia.formats.find((f) => f.id === '1962')!.text?.({ serial: '207861' }), '207-861');
  });
  it('keeps tab IDs optional, separately validated, and out of copied serials', () => {
    const f = britishColumbia.formats.find((f) => f.id === '1953')!;
    equal(f.text?.({ serial: '33-638', tabSerial: '148879' }), '33-638');
    equal(f.validate?.({ serial: '33-638', tabSerial: '' }), null);
    ok(f.validate?.({ serial: '33-638', tabSerial: '012345' }));
    ok(f.validate?.({ serial: '33-638', finish: 'invalid' }));
  });
  it('escapes user text and scopes SVG references independently', () => {
    const hostile = '<script>alert("x")</script>';
    const svg = renderBcSvg({ year: 1953 }, { serial: hostile, tabSerial: hostile }, '"<unsafe>');
    ok(!svg.includes('<script>'));
    ok(svg.includes('&lt;script&gt;'));
    ok(svg.includes('id="unsafe-holes"'));
    ok(renderBcSvg({ year: 1953 }, { serial: '12345' }, 'left').includes('href="#left-totem"'));
    ok(renderBcSvg({ year: 1953 }, { serial: '12345' }, 'right').includes('href="#right-totem"'));
  });
  it('keeps flat artwork font-editable and makes embossing optional', () => {
    const flat = renderBcSvg({ year: 1963 }, { serial: '1877', finish: 'flat' });
    const raised = renderBcSvg({ year: 1963 }, { serial: '1877', finish: 'embossed' });
    ok(flat.includes('<text'));
    ok(!flat.includes('filter="url('));
    ok(raised.includes('filter="url('));
    ok(flat.includes('not original dies'));
  });
});
