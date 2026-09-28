import { describe, it, expect } from 'vitest';
import { dieProfile } from './profiles';
import { dieGlyph } from './engine';
import { skeletonGlyph, type SkeletonParams } from './skeleton';

// Checks from the 28 September 2026 comparison against BCpl8s photographs
// (098 SJF, 976 SKP, JA7 91L): only the 0 and the 7 change.
const waldale = dieProfile('bc-waldale');
const previous: SkeletonParams = { ...waldale.params, zeroCurve: undefined, seven: 'straight' };
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ- ';

describe('Waldale serial die', () => {
  it('draws a straight-sided 0 while other bowls stay oval', () => {
    const zero = dieGlyph(waldale, '0')!.paths[0];
    expect(zero).toContain('A21 21');
    expect(zero).toMatch(/V\d/);
    expect(zero).not.toContain('C');
    expect(dieGlyph(waldale, 'O')!.paths[0]).toContain('C');
  });

  it('draws the bent 7: the bar turns down early and the stem ends near-vertical', () => {
    expect(dieGlyph(waldale, '7')!.paths).toEqual(['M5.5 5.5 H47.5 C31 30 23 57 23 94.5']);
    expect(skeletonGlyph('7', { ...waldale.params, seven: 'curved' })!.paths).toEqual(['M5.5 5.5 H47.5 C43.26 38 24.5 62 22.5 94.5']);
  });

  it('leaves every other glyph unchanged, including the 6, 8, 9 and P bowls', () => {
    for (const c of CHARS.replace(/[07]/g, '')) expect(dieGlyph(waldale, c), c).toEqual(skeletonGlyph(c, previous));
  });

  it('keeps advances and does not change the global bowl style', () => {
    expect(waldale.params.curve).toBe('oval');
    for (const c of CHARS) expect(dieGlyph(waldale, c)!.advance, c).toBe(skeletonGlyph(c, previous)!.advance);
  });

  it('applies zeroCurve to the 0 only', () => {
    const p: SkeletonParams = { width: 50, stroke: 12, curve: 'oval', tracking: 8, zeroCurve: 'box', boxRadius: 9 };
    expect(skeletonGlyph('0', p)!.paths[0]).toContain('A9 9');
    expect(skeletonGlyph('O', p)).toEqual(skeletonGlyph('O', { ...p, zeroCurve: undefined }));
  });
});
