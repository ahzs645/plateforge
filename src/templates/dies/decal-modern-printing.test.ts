import {describe, expect, it} from 'vitest';
import {buildDieText, dieGlyph, dieSupports} from './engine';
import {dieProfile} from './profiles';
import {serializeSvgNode} from '../svg-scene';

describe('Modern decal numeral constructions',()=>{
  it('renders leading-zero controls and all ten editable numerals without a font fallback',()=>{
    for(const id of ['modern-year-reconstruction','modern-control-reconstruction']) {
      const profile=dieProfile('bc-decal-print-'+id);
      expect(dieSupports(profile,'0123456789')).toBe(true);
      expect(dieSupports(profile,'A')).toBe(false);
      const run=buildDieText({profile,text:'00001234',x:0,baseline:100,capHeight:100,ink:'#246',role:'decal-serial'});
      const svg=serializeSvgNode(run.node);
      expect(svg).toContain('aria-label="00001234"');
      expect(svg).not.toContain('<text');
      expect(svg).not.toContain('data-provenance="constructed"');
      expect(run.fit).toBe('natural');
    }
  });
  it('preserves native control outlines and tabular advances while replacing only the observed 1 shoulder',()=>{
    const native=dieProfile('bc-decal-print-control-bold');
    const corrected=dieProfile('bc-decal-print-modern-control-reconstruction');
    for(const c of '0123456789') {
      expect(dieGlyph(corrected,c)?.advance).toBe(dieGlyph(native,c)?.advance);
      if(c!=='1')expect(dieGlyph(corrected,c)).toEqual(dieGlyph(native,c));
    }
    expect(dieGlyph(corrected,'1')?.paths).not.toEqual(dieGlyph(native,'1')?.paths);
    expect(corrected.filledStroke).toBeUndefined();
  });
  it('limits the MAY construction to its observed letters and applies pair spacing without changing outlines',()=>{
    const profile=dieProfile('bc-decal-print-bordered-may-reconstruction');
    expect(dieSupports(profile,'MAY')).toBe(true);
    expect(dieSupports(profile,'MAR')).toBe(false);
    const settings={profile,text:'MAY',x:0,baseline:100,capHeight:100,ink:'#123',role:'decal-month'};
    const plain=buildDieText(settings),kerned=buildDieText({...settings,kerning:{AY:-14}});
    expect(plain.width-kerned.width).toBeCloseTo(14);
    expect(kerned.height).toBe(plain.height);
    expect(kerned.fit).toBe('natural');
  });
  it('keeps the late OCT reconstruction bounded to the observed letters',()=>{
    const profile=dieProfile('bc-decal-print-late-oct-reconstruction');
    expect(dieSupports(profile,'OCT')).toBe(true);
    expect(dieSupports(profile,'NOV')).toBe(false);
    const run=buildDieText({profile,text:'OCT',x:0,baseline:59,capHeight:59,ink:'#111',role:'decal-month'});
    expect(run.fit).toBe('natural');
    expect(run.height).toBe(59);
    expect(serializeSvgNode(run.node)).not.toContain('<text');
  });
});
