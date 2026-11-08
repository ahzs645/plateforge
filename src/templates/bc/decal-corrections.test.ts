import {describe, expect, it} from 'vitest';
import {BC_DECALS, decalId} from '../../regions/canada/bc-decals';
import {decalArt} from '../../regions/canada/bc-kit';
import {serializeSvgNode, type SvgNode} from '../svg-scene';
import {buildDecal} from './decal';
import {decalTypography} from './decal-typography';

function find(scene: SvgNode, role: string): SvgNode[] {
  return [
    ...(scene.attrs['data-role'] === role ? [scene] : []),
    ...scene.children.flatMap(child => typeof child === 'string' ? [] : find(child, role)),
  ];
}

function luminance(hex: string): number {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

describe('Source-supported renewal decal corrections', () => {
  it('uses the selected two-digit barcode layout and preserves its exact control', () => {
    const decal = BC_DECALS.find(d => decalId(d) === '2011')!;
    for (const [month, top, height] of [['MAY', 66, 20], ['JUN', 75, 16]] as const) {
      const art = decalArt(decal, {decalMonth: month, decalSerial: '00001234'});
      const scene = buildDecal(art, {x: 0, y: 0, width: 230, height: 100});
      const barcode = find(scene, 'decal-barcode')[0];
      expect(barcode.attrs['data-control']).toBe('00001234');
      const bars = barcode.children.filter((child): child is SvgNode => typeof child !== 'string');
      expect(bars.length).toBeGreaterThan(20);
      expect(bars.every(bar => bar.attrs.y === top && bar.attrs.height === height)).toBe(true);
      expect(bars.every(bar => Number(bar.attrs.x) >= 0 && Number(bar.attrs.x) + Number(bar.attrs.width) <= 230)).toBe(true);
    }
  });

  it.each(['1998-type-ii', '1999'])('%s confines the observed MAY reconstruction to May', id => {
    const ordinary = decalTypography(id, 'APR')!.runs['decal-month'][0].profile;
    expect(decalTypography(id, 'MAY')!.runs['decal-month'][0].profile).not.toBe(ordinary);
    expect(decalTypography(id, 'JUN')!.runs['decal-month'][0].profile).toBe(ordinary);
    const decal = BC_DECALS.find(d => decalId(d) === id)!;
    for (const month of ['APR', 'MAY', 'JUN']) {
      const art = decalArt(decal, {decalMonth: month});
      const scene = buildDecal(art, {x: 0, y: 0, width: 330, height: 100});
      const run = find(scene, 'decal-month')[0];
      expect([...serializeSvgNode(run).matchAll(/data-character="([^"]+)"/g)].map(match => match[1]).join('')).toBe(month);
      if (month === 'MAY') expect(run.attrs['data-fit']).toBe('natural');
    }
  });

  it('prints the 1984 vertical control in dark ink independently of the pale date', () => {
    const decal = BC_DECALS.find(d => decalId(d) === '1984')!;
    const art = decalArt(decal, {decalMonth: 'MAY', decalSerial: '42144483'});
    const scene = buildDecal(art, {x: 0, y: 0, width: art.aspect * 100, height: 100});
    const control = find(scene, 'decal-serial')[0];
    expect(control.attrs['aria-label']).toBe('42144483');
    expect(serializeSvgNode(control)).toContain(`fill="${art.serialInk}"`);
    expect(serializeSvgNode(find(scene, 'decal-month')[0])).toContain(`fill="${art.ink}"`);
    const strip = '#f4f1e7';
    expect((luminance(strip) + .05) / (luminance(art.serialInk) + .05)).toBeGreaterThan(7);
    expect(luminance(art.ink)).toBeGreaterThan(.5);
  });

  it.each(['1999-white', '2000', '2001', '2002', '2003'])('%s has concentric rounded outline corners', id => {
    const decal = BC_DECALS.find(d => decalId(d) === id)!;
    const art = decalArt(decal, {decalMonth: 'OCT'});
    const scene = buildDecal(art, {x: 13, y: 21, width: art.aspect * 80, height: 80});
    const outer = find(scene, 'decal-outer-border')[0].attrs;
    const inner = find(scene, 'decal-inner-border')[0].attrs;
    expect(Number(outer.rx)).toBeGreaterThan(Number(inner.rx));
    expect(Number(inner.rx)).toBeGreaterThan(0);
    expect(Number(outer.x) + Number(outer.rx)).toBeCloseTo(Number(inner.x) + Number(inner.rx));
    expect(Number(outer.y) + Number(outer.rx)).toBeCloseTo(Number(inner.y) + Number(inner.rx));
  });

  it('keeps the separate thick-border 1999 frame square', () => {
    const decal = BC_DECALS.find(d => decalId(d) === '1999')!;
    const art = decalArt(decal, {decalMonth: 'MAY', decalSerial: '54174570'});
    const scene = buildDecal(art, {x: 0, y: 0, width: 330, height: 100});
    expect(find(scene, 'decal-outer-border')[0].attrs.rx).toBe(0);
    expect(find(scene, 'decal-inner-border')).toHaveLength(0);
  });
});
