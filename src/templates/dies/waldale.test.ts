import { describe, it, expect } from 'vitest';
import { dieProfile } from './profiles';
import { dieGlyph } from './engine';
import { skeletonGlyph, type SkeletonParams } from './skeleton';
import '../../regions/canada/bc-specialty';

// Checks from the September 2026 comparison against BCpl8s photographs
// (098 SJF, 976 SKP, JA7 91L; Memorial Cross MC000R, MC1000, MC127R).
const waldale = dieProfile('bc-waldale');
const previous: SkeletonParams = { width: 53, stroke: 11, curve: 'oval', tracking: 8, one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.58, wide: 1.2 };
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ- ';
const CHANGED = '017AJP';

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

  it('draws the P bowl as a rounded rectangle', () => {
    const bowl = dieGlyph(waldale, 'P')!.paths[1];
    expect(bowl).toContain('A16 16');
    expect(bowl).not.toContain('C');
    expect(bowl).toMatch(/V\d/);
  });

  it('gives the J a short spur at the top', () => {
    expect(dieGlyph(waldale, 'J')!.paths[0]).toMatch(/^M43.65 5.5 H47.5 M47.5 5.5 V/);
  });

  it('draws the A with a flat top and a lower bar that stays inside the legs', () => {
    const [legs, bar] = dieGlyph(waldale, 'A')!.paths;
    expect(legs).toBe('M5.5 94.5 L23.32 5.5 H29.68 L47.5 94.5');
    expect(bar).toBe('M15.91 70 H37.09');
  });

  it('draws the 1 with a short, shallow flag', () => {
    const one = dieGlyph(waldale, '1')!;
    expect(one.paths).toEqual(['M12.06 11.5 L19.06 5.5 V94.5']);
    expect(one.advance).toBe(skeletonGlyph('1', previous)!.advance);
  });

  it('leaves every other glyph unchanged', () => {
    for (const c of CHARS) if (!CHANGED.includes(c)) expect(dieGlyph(waldale, c), c).toEqual(skeletonGlyph(c, previous));
  });

  it('keeps advances and the global oval bowl style', () => {
    expect(waldale.params.curve).toBe('oval');
    for (const c of CHARS) expect(dieGlyph(waldale, c)!.advance, c).toBe(skeletonGlyph(c, previous)!.advance);
  });

  it('applies glyphCurve to the named glyphs only', () => {
    const p: SkeletonParams = { width: 50, stroke: 12, curve: 'oval', tracking: 8, glyphCurve: { '0': 'box' }, boxRadius: 9 };
    expect(skeletonGlyph('0', p)!.paths[0]).toContain('A9 9');
    expect(skeletonGlyph('O', p)).toEqual(skeletonGlyph('O', { ...p, glyphCurve: undefined }));
  });
});

describe('Waldale “Mississippi” die', () => {
  const mississippi = dieProfile('bc-mississippi');
  it('draws straight-sided O, 0, C and R bowls', () => {
    for (const c of '0OCR') expect(dieGlyph(mississippi, c)!.paths.join(' '), c).not.toContain('C');
    expect(dieGlyph(mississippi, '0')!.paths[0]).toMatch(/V\d/);
  });
  it('draws the 1 with a flag and a base, and keeps the straight 7', () => {
    expect(dieGlyph(mississippi, '1')!.paths).toHaveLength(2);
    expect(dieGlyph(mississippi, '7')!.paths[0]).toMatch(/ L[\d.]+ 94.75$/);
  });
});
