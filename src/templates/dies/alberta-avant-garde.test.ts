import {describe,it,expect} from 'vitest';
import {dieGlyph,dieSupports} from './engine';
import {ALBERTA_AVANT_GARDE_PROFILE as plate,ALBERTA_AVANT_GARDE_DEFAULT_PROFILE as supplied,buildAlbertaSlogan} from './alberta-avant-garde';

describe('Alberta fixed slogan outlines',()=>{
  it('changes only the four missing alternates and rejects unrelated characters',()=>{
    const word='Wild Rose Country';
    expect(dieSupports(plate,word)).toBe(true);
    expect(dieSupports(plate,'XYZ')).toBe(false);
    for(const c of new Set(word)) {
      if('Wety'.includes(c)) expect(dieGlyph(plate,c)).not.toEqual(dieGlyph(supplied,c));
      else expect(dieGlyph(plate,c)).toEqual(dieGlyph(supplied,c));
    }
    expect(plate.allowResearchReplacement).toBe(false);
    expect(plate.evidence.notes).toContain('not extracted Pro glyphs');
  });
  it('fits the complete word uniformly while retaining the y descender inside the plate',()=>{
    const natural=buildAlbertaSlogan({baseline:282,capHeight:24,ink:'#1c3c85'});
    const fitted=buildAlbertaSlogan({baseline:282,capHeight:24,maxWidth:275,ink:'#1c3c85'});
    expect(natural.width).toBeGreaterThan(275);
    expect(fitted.fit).toBe('reduced');
    expect(fitted.width).toBeCloseTo(275);
    expect(fitted.height/natural.height).toBeCloseTo(fitted.width/natural.width);
    // Actual outline coordinates include the descender, beyond the nominal cap.
    expect(dieGlyph(plate,'y')!.paths[0]).toContain('126.757');
    expect(282+fitted.height*(198/740)).toBeLessThan(290);
  });
});
