import {describe, expect, it} from 'vitest';
import {buildDieText, dieGlyph, dieSupports} from './engine';
import {ROYAL_1951_PROFILE} from './royal-1951';
import {APEC_SCREENED_LEGENDS_PROFILE} from './apec-screened-legends';
import {serializeSvgNode} from '../svg-scene';

describe('Photograph-checked ceremonial inscriptions', () => {
  it('limits the royal construction to observed year numerals and keeps both pairs at one scale', () => {
    expect(dieSupports(ROYAL_1951_PROFILE, '1951')).toBe(true);
    expect(dieSupports(ROYAL_1951_PROFILE, '1952')).toBe(false);
    const runs = [buildDieText({text:'19', profile:ROYAL_1951_PROFILE, x:66.8, baseline:95,
      capHeight:33, ink:'#c8b070', role:'year-left', kerning:{'19':29}}),
    buildDieText({text:'51', profile:ROYAL_1951_PROFILE, x:240.7, baseline:95,
      capHeight:33, ink:'#c8b070', role:'year-right', kerning:{'51':33}})];
    for (const run of runs) {
      expect(run.fit).toBe('natural'); expect(run.height).toBe(33);
      const xml=serializeSvgNode(run.node);
      expect(xml).toContain('scale(0.33)'); expect(xml).toContain('fill-rule="evenodd"');
      expect(xml).not.toMatch(/NaN|Infinity|<text|data-source="research"/);
    }
    expect(runs[0].width).toBeCloseTo(44.55);
    expect(runs[1].width).toBeCloseTo(45.87);
  });

  it('uses mixed-case fixed outlines for all four APEC inscriptions without font fallback', () => {
    const texts=['Vancouver','British Columbia','Canada','Nov. 19 - 25 1997'];
    for(const text of texts) {
      expect(dieSupports(APEC_SCREENED_LEGENDS_PROFILE,text)).toBe(true);
      const run=buildDieText({text,profile:APEC_SCREENED_LEGENDS_PROFILE,x:152,
        baseline:38.1,capHeight:11.8,ink:'#222',role:'legend'});
      const xml=serializeSvgNode(run.node);
      expect(run.fit).toBe('natural'); expect(xml).not.toContain('<text');
      expect(xml).toContain(`aria-label="${text}"`);
      for(const char of text) expect(dieGlyph(APEC_SCREENED_LEGENDS_PROFILE,char)?.fill).toBe(true);
    }
    expect(dieSupports(APEC_SCREENED_LEGENDS_PROFILE,'ROYAL')).toBe(false);
    expect(dieGlyph(APEC_SCREENED_LEGENDS_PROFILE,'a')).not.toEqual(dieGlyph(APEC_SCREENED_LEGENDS_PROFILE,'C'));
  });

  it('adjusts line tracking without stretching or reducing photographed glyph proportions', () => {
    const run=buildDieText({text:'British Columbia',profile:APEC_SCREENED_LEGENDS_PROFILE,
      x:152,baseline:38.1,capHeight:11.8,ink:'#222',role:'legend',letterSpacing:-3});
    expect(run.fit).toBe('natural'); expect(run.width).toBeCloseTo(117.129,2);
    expect(serializeSvgNode(run.node)).toContain('scale(0.118)');
  });
});

describe('Royal motorcade screened slogan', () => {
  it('exports the complete mixed-case phrase without runtime fonts or stretched glyphs', async () => {
    const {ROYAL_SCREENED_SLOGAN_PROFILE:profile}=await import('./royal-screened-slogan');
    const text='Beautiful British Columbia';
    expect(dieSupports(profile,text)).toBe(true);
    expect(dieSupports(profile,'ROYAL')).toBe(false);
    const run=buildDieText({text,profile,x:153,baseline:37,capHeight:16.5,
      letterSpacing:-4,ink:'#174db7',role:'slogan'});
    expect(run.fit).toBe('natural'); expect(run.height).toBe(16.5);
    expect(run.width).toBeCloseTo(255,0);
    const xml=serializeSvgNode(run.node);
    expect(xml).toContain('scale(0.165)');
    expect(xml).not.toMatch(/<text|font-family|NaN|Infinity|data-source="research"/);
    for(const c of text) expect(dieGlyph(profile,c)?.fill).toBe(true);
  });
});
