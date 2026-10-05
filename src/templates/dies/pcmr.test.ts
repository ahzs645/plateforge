import {describe, expect, it} from 'vitest';
import {buildDieText, dieGlyph, dieSupports} from './engine';
import {PCMR_COMPANY_PROFILE, PCMR_PROFILE} from './pcmr';
import {serializeSvgNode} from '../svg-scene';

describe('Company 71 painted lettering', () => {
  it('limits each construction to the actually observed fixed characters', () => {
    expect(dieSupports(PCMR_PROFILE, 'P.C.M.R.')).toBe(true);
    expect(dieSupports(PCMR_COMPANY_PROFILE, 'CO71')).toBe(true);
    expect(dieSupports(PCMR_PROFILE, 'ROYAL')).toBe(false);
    expect(dieSupports(PCMR_COMPANY_PROFILE, 'CO60')).toBe(false);
    for (const ch of 'PCMR.') expect(dieGlyph(PCMR_PROFILE, ch)?.fill).toBe(true);
  });

  it('retains the photographed punctuation positions without narrowing the letter shapes', () => {
    const run = buildDieText({text: 'P.C.M.R.', profile: PCMR_PROFILE, x: 132, baseline: 111.5,
      capHeight: 76, maxWidth: 232, ink: '#23242b', role: 'serial',
      kerning: {'P.': -7, '.C': 22, 'C.': -7, '.M': 7, 'M.': -5, '.R': 9, 'R.': -5}});
    const xml = serializeSvgNode(run.node);
    expect(run.fit).toBe('natural');
    expect(run.height).toBe(76);
    expect(run.width).toBeCloseTo(212.8);
    expect(xml).toContain('translate(65 0)'); // C origin relative to P, punctuation below P bowl.
    expect(xml).toContain('translate(134 0)'); // M origin.
    expect(xml).toContain('translate(214 0)'); // R origin.
    expect(xml).toContain('translate(31 0)'); // First diamond belongs below the P bowl.
    expect(xml).not.toMatch(/NaN|Infinity|data-source="research"/);
    expect(xml).not.toContain('<text');
  });
});
