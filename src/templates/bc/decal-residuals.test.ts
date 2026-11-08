import {describe, expect, it} from 'vitest';
import {BC_DECALS, decalId} from '../../regions/canada/bc-decals';
import {decalArt} from '../../regions/canada/bc-kit';
import {buildDecal} from './decal';
import {decalTypography} from './decal-typography';
import type {SvgNode} from '../svg-scene';

function scene(id: string, month = 'JAN'): SvgNode {
  const decal = BC_DECALS.find(d => decalId(d) === id)!;
  const art = decalArt(decal, {decalMonth: month, decalSerial: '00001234'});
  return buildDecal(art, {x: 0, y: 0, width: art.aspect * 100, height: 100});
}

function runs(node: SvgNode, role: string): SvgNode[] {
  return [
    ...(node.attrs['data-role'] === role ? [node] : []),
    ...node.children.flatMap(child => typeof child === 'string' ? [] : runs(child, role)),
  ];
}

describe('Second-pass decal evidence corrections', () => {
  it('keeps the photographed square substrates and the July 2017 corner transition', () => {
    const radius = (id: string, month = 'JAN') => {
      const substrate = scene(id, month).children[0] as SvgNode;
      expect(substrate.tag).toBe('rect');
      return Number(substrate.attrs.rx ?? 0);
    };
    for (const year of ['2010', '2011', '2012', '2013', '2014', '2015', '2016']) {
      expect(radius(year)).toBe(0);
    }
    expect(radius('2004')).toBe(8);
    for (const year of ['2005', '2006', '2007', '2008', '2009']) {
      expect(radius(year)).toBe(10);
    }
    expect(radius('2017', 'JUN')).toBe(0);
    expect(radius('2017', 'JUL')).toBe(10);
    expect(radius('2017', 'NOV')).toBe(10);
    expect(radius('2018')).toBe(10);
  });

  it('uses complete observed year strings naturally across all later month selections', () => {
    for (const year of ['2019', '2020', '2021', '2022', '2023']) {
      for (const month of ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']) {
        const yearRun = runs(scene(year, month), 'decal-year')[0];
        expect(yearRun.attrs['data-die']).toBe('bc-decal-print-modern-late-year-reconstruction');
        expect(yearRun.attrs['data-fit']).toBe('natural');
        expect(yearRun.attrs['aria-label']).toBe(year);
        const characters: string[] = [];
        const collect = (node: SvgNode) => {
          if (node.attrs['data-character']) characters.push(String(node.attrs['data-character']));
          node.children.forEach(child => { if (typeof child !== 'string') collect(child); });
        };
        collect(yearRun);
        expect(characters.join('')).toBe(year);
      }
    }
    expect(runs(scene('2018'), 'decal-year')[0].attrs['data-die'])
      .toBe('bc-decal-print-modern-year-reconstruction');
  });

  it('confines older specimen control placements to the observed month', () => {
    for (const [id, observed, adjacent] of [['1990', 'JAN', 'FEB'], ['1991', 'JUN', 'JUL'], ['1992', 'OCT', 'NOV']]) {
      const selected = decalTypography(id, observed)!;
      const retained = decalTypography(id, adjacent)!;
      expect(selected.runs['decal-serial'][0].baseline).not.toBe(retained.runs['decal-serial'][0].baseline);
      for (const role of ['decal-month', 'decal-year', 'decal-legend']) {
        expect(selected.runs[role]).toEqual(retained.runs[role]);
      }
    }
  });
});
