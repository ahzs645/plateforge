import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { britishColumbia } from '../../regions/canada';
import { kitDecal, kitPalette, kitRecipe } from '../../regions/canada/bc-kit';
import { createRng } from '../../core/random';
import type { Parts } from '../../core/types';
import { buildKitScene } from '../bc/kit';
import { buildBcLaterScene } from '../bc/later-scene';
import { buildBcScene, type BcDesign } from '../bc/scene';
import { serializeSvgNode, type SvgNode } from '../svg-scene';
import { dieGlyph } from './engine';
import { dieProfile } from './profiles';
import { installResearchRegistry, setResearchDiesEnabled, withResearchContext, type ResearchRegistry } from './research-dies';
import { applyResearchTypefaces } from './research-text';

const registry: ResearchRegistry = JSON.parse(readFileSync('src/templates/dies/research-registry.json', 'utf8'));
beforeAll(() => installResearchRegistry(registry));
afterAll(() => { setResearchDiesEnabled(true); installResearchRegistry(null); });

function scene(design: BcDesign, parts: Parts): SvgNode {
  if (!design.kit) return design.year >= 1964 ? buildBcLaterScene(design, parts, 't') : buildBcScene(design, parts, 't');
  const recipe = kitRecipe(String(design.kit));
  const selected = typeof parts.die === 'string' ? { ...recipe, serial: { ...recipe.serial, die: parts.die } } : recipe;
  return buildKitScene(selected, parts, { scope: 't', decal: kitDecal(recipe.id, parts), ...kitPalette(recipe.id, parts.palette) });
}
function byRole(root: SvgNode, role: string): SvgNode | undefined {
  if (root.attrs['data-role'] === role) return root;
  for (const child of root.children) {
    if (typeof child === 'string') continue;
    const found = byRole(child, role);
    if (found) return found;
  }
}
const render = (design: BcDesign, parts: Parts) => serializeSvgNode(withResearchContext(design.formatId, () => applyResearchTypefaces(scene(design, parts))));
const designOf = (id: string) => {
  const format = britishColumbia.formats.find((f) => f.id === id)!;
  return { format, design: { ...britishColumbia.design, ...format.design } as unknown as BcDesign };
};
const glyphPath = (unit: string, char: string) => registry.glyphs[registry.units[unit].glyphs[char]][1] as string;

describe('research dies in the B.C. renderer', () => {
  it('renders every format with research lettering, falling back for unobserved characters', () => {
    const withResearch = new Set<string>();
    for (const format of britishColumbia.formats) {
      const design = { ...britishColumbia.design, ...format.design } as unknown as BcDesign;
      for (let i = 0; i < 6; i++) {
        const parts = format.generate(createRng(`research-dies:${format.id}:${i}`));
        if (format.validate?.(parts)) continue;
        const svg = render(design, parts);
        expect(svg).not.toMatch(/NaN|Infinity/);
        if (svg.includes('data-source="research"')) withResearch.add(format.id);
      }
    }
    expect(withResearch.size).toBeGreaterThan(300);
  });

  it('uses the best-ranked unit for the format and keeps production glyphs elsewhere', () => {
    const { design } = designOf('1940');
    const unit = registry.bindings['1940']['bc-early-1940'][0];
    const char = Object.keys(registry.units[unit].glyphs).find((c) => /\d/.test(c))!;
    const p = withResearchContext(design.formatId, () => dieProfile('bc-early-1940'));
    expect(p.evidence.status).toBe('research-candidate');
    expect(dieGlyph(p, char)!.paths[0]).toBe(glyphPath(unit, char));
    const unobserved = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].find((c) => !p.researchChars!.has(c))!;
    expect(dieGlyph(p, unobserved)).toEqual(dieGlyph(dieProfile('bc-early-1940'), unobserved));
  });

  it('leaves dies untouched outside a plate render or when switched off', () => {
    const { format, design } = designOf('1940');
    expect(dieProfile('bc-early-1940').evidence.status).not.toBe('research-candidate');
    const parts = format.generate(createRng('research-toggle'));
    const on = render(design, parts);
    setResearchDiesEnabled(false);
    const off = render(design, parts);
    expect(off).toBe(serializeSvgNode(scene(design, parts)));
    setResearchDiesEnabled(true);
    expect(on).not.toBe(off);
  });

  it('keeps the 1951 strip alphabet independent of serial fonts and research candidates in every mounting view', () => {
    const { design } = designOf('1951');
    // Exercise the real registry binding that previously replaced the strip alphabet.
    expect(registry.bindings['1951']['bc-strip-1951'].length).toBeGreaterThan(0);
    try {
      for (const serial of ['79-583', '217-639']) {
        setResearchDiesEnabled(false);
        const reference = byRole(scene(design, { serial, lettering: 'die', renewal: 'loose' }), 'renewal-legend')!;
        const expected = serializeSvgNode(reference);
        for (const research of [false, true]) {
          setResearchDiesEnabled(research);
          for (const lettering of ['die', 'default', 'semicircular', 'squarish', 'oval', 'hybrid']) {
            for (const renewal of ['on-plate', 'loose', 'top']) {
              const root = withResearchContext(design.formatId, () => applyResearchTypefaces(scene(design,
                { serial, lettering, renewal, tabSerial: '250001' })));
              const legend = byRole(root, 'renewal-legend')!;
              expect(legend.tag).toBe('g');
              expect(serializeSvgNode(legend)).toBe(expected);
              expect(byRole(root, 'tab-serial')!.children[0]).toBe('250001');
            }
          }
        }
      }
    } finally { setResearchDiesEnabled(true); }
  });

  it('skews only production fallbacks on slanted dies', () => {
    const id = Object.keys(registry.bindings).find((fid) => Object.keys(registry.bindings[fid]).some((k) => dieProfileSafe(k)?.slant))!;
    const key = Object.keys(registry.bindings[id]).find((k) => dieProfileSafe(k)?.slant)!;
    const p = withResearchContext(id, () => dieProfile(key));
    expect(p.slant).toBeUndefined();
    expect(p.fallbackSlant).toBe(dieProfile(key).slant);
  });
});

function dieProfileSafe(id: string) {
  try { return dieProfile(id); } catch { return null; }
}
