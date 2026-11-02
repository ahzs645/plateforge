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
import { buildDieText, dieGlyph } from './engine';
import { dieProfile } from './profiles';
import { installResearchRegistry, researchVariant, setResearchDiesEnabled, withResearchContext, type ResearchRegistry } from './research-dies';
import { applyResearchTypefaces } from './research-text';
import { BC_PASSENGER_RESEARCH_BINDINGS } from './research-policy';

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
const all = (node: SvgNode): SvgNode[] => [node, ...node.children.flatMap(c => typeof c === 'string' ? [] : all(c))];

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

  it('uses shared passenger alphabets for collector numbering while preserving its Harrington inscriptions', () => {
    const ids = ['collector-passenger', 'collector-passenger-dual', 'collector-multi',
      'collector-motorcycle', 'collector-motorcycle-multi'];
    for (const id of ids) {
      const {format, design} = designOf(id);
      const recipe = kitRecipe(String(design.kit));
      for (const die of ['bc-astro-4', 'bc-waldale']) {
        const parts = {...format.generate(createRng(id)), die};
        const selected = {...recipe, serial: {...recipe.serial, die}};
        const root = withResearchContext(id, () => applyResearchTypefaces(buildKitScene(selected, parts, {scope: 'collector-test'})));
        const passenger = withResearchContext(die === 'bc-astro-4' ? '1985-flag' : '2001-flag', () => dieProfile(die));
        for (const role of ['legend-top', 'legend-left', 'legend-right']) {
          const legend = byRole(root, role)!;
          expect(legend.attrs['data-die']).toBe('bc-harrington-collector');
          expect(all(legend).some(n => n.attrs['data-source'] === 'research')).toBe(false);
        }
        const serial = byRole(root, 'serial')!;
        for (const glyph of all(serial).filter(n => n.attrs['data-character'])) {
          const char = String(glyph.attrs['data-character']);
          const paths = glyph.children.filter((n): n is SvgNode => typeof n !== 'string' && n.tag === 'path').map(n => n.attrs.d);
          expect(paths, `${id} ${die} ${char}`).toEqual(dieGlyph(passenger, char)!.paths);
        }
        const separator = byRole(root, 'serial-separator');
        expect(all(separator!).some(n => n.attrs['data-part'] === 'collector-wave' && n.attrs.fill === 'currentColor')).toBe(true);
      }
    }
  });

  it.each([1, 2, 3, 4])('keeps Astrographic type %i within its own reviewed candidate pool', (type) => {
    const die = `bc-astro-${type}`;
    const { format, design } = designOf('1985-flag');
    const parts = { ...format.generate(createRng(`astro-pool-${type}`)), serial: 'ABC-067', die };
    const root = withResearchContext('1985-flag', () => scene(design, parts));
    const serial = byRole(root, 'serial')!;
    const glyphs = all(serial).filter(n => n.attrs['data-character']);
    const allowed = BC_PASSENGER_RESEARCH_BINDINGS['1985-flag'][die];
    const selected = withResearchContext('1985-flag', () => dieProfile(die));
    const units = glyphs.map(n => n.attrs['data-research-unit']).filter(Boolean);
    expect(units.length).toBeGreaterThan(0);
    for (const unit of units) expect(allowed).toContain(unit);
    for (const glyph of glyphs) {
      const char = String(glyph.attrs['data-character']);
      const paths = glyph.children.filter((n): n is SvgNode => typeof n !== 'string' && n.tag === 'path').map(n => n.attrs.d);
      expect(paths, `${die} ${char}`).toEqual(dieGlyph(selected, char)!.paths);
      if (!selected.researchChars?.has(char)) {
        expect(glyph.attrs['data-source']).toBeUndefined();
        expect(paths).toEqual(dieGlyph(dieProfile(die), char)!.paths);
      }
    }
  });

  it('keeps a digit contour and advance stable when the serial is edited, measured or split', () => {
    withResearchContext('1985-flag', () => {
      const profile = dieProfile('bc-astro-1');
      // The broad registry's whole-run heuristic previously picked Classic for
      // "0", its type-1 chart for "06", and its type-1 plate for "A0".
      // Filtering families alone still lets "0" switch from chart to plate.
      const zero = dieGlyph(profile, '0')!;
      for (const text of ['0', '06', 'A0', '0A']) {
        for (const role of ['x', 'serial-left', 'serial-right', 'serial']) {
          const run = buildDieText({ text, profile, x: 0, baseline: 100, capHeight: 100, anchor: 'start', ink: '#000', role });
          const glyph = all(run.node).find(n => n.attrs['data-character'] === '0')!;
          expect(glyph.attrs['data-research-unit']).toBe(profile.researchSourceUnits!['0']);
          expect(glyph.children.filter((n): n is SvgNode => typeof n !== 'string' && n.tag === 'path').map(n => n.attrs.d)).toEqual(zero.paths);
          const expectedWidth = [...text].reduce((sum, char) => sum + dieGlyph(profile, char)!.advance, 0)
            + (text.length - 1) * profile.params.tracking;
          expect(run.width).toBeCloseTo(expectedWidth, 8);
        }
      }
    });
  });

  it('uses the separately labelled Waldale trial-run source for the 1985 option', () => {
    const { format, design } = designOf('1985-flag');
    const parts = { ...format.generate(createRng('waldale-trial')), serial: 'KRL-018', die: 'bc-waldale' };
    const root = withResearchContext('1985-flag', () => scene(design, parts));
    const glyphs = all(byRole(root, 'serial')!).filter(n => n.attrs['data-character']);
    const sources = glyphs.map(n => n.attrs['data-research-unit']).filter(Boolean);
    expect(new Set(sources)).toEqual(new Set(['research-bc-waldale-trial-run-1998-1999']));
    // R/L are not observed in this trial-run subset and must not be borrowed
    // from ACME, Hi-Signs, modern passenger or another plate class.
    for (const char of ['R', 'L']) {
      const glyph = glyphs.find(n => n.attrs['data-character'] === char)!;
      expect(glyph.attrs['data-research-unit']).toBeUndefined();
      expect(glyph.attrs['data-provenance']).toBe('constructed');
    }
  });

  it.each(['sample-flag', 'souvenir-bc0000', 'prop-flag-xqz', 'commercial-flag', 'commercial-flag-2008',
    'farm-tractor-flag', 'farm-truck-flag', 'farm-truck-2025', 'trailer-comm-flag', 'trailer-floater-flag'])(
    'does not pass the passenger trial-run exception to the cloned %s recipe', (id) => {
      const { format, design } = designOf(id);
      const parts = { ...format.generate(createRng(`independent-class-${id}`)), die: 'bc-waldale' };
      const root = withResearchContext(id, () => scene(design, parts));
      const glyphs = all(byRole(root, 'serial')!).filter(n => n.attrs['data-character']);
      const modern = withResearchContext('2001-flag', () => dieProfile('bc-waldale'));
      const units = glyphs.map(n => n.attrs['data-research-unit']).filter(Boolean);
      expect(units.length).toBeGreaterThan(0);
      for (const glyph of glyphs) {
        const char = String(glyph.attrs['data-character']);
        expect(glyph.attrs['data-research-unit']).toBe(modern.researchSourceUnits?.[char]);
        const paths = glyph.children.filter((n): n is SvgNode => typeof n !== 'string' && n.tag === 'path').map(n => n.attrs.d);
        expect(paths, `${id} ${char}`).toEqual(dieGlyph(modern, char)!.paths);
      }
    });

  it('keeps unobserved new-series letters as constructed fallbacks', () => {
    const { format, design } = designOf('2025-flag');
    const parts = { ...format.generate(createRng('new-series-letters')), serial: 'A12-3UZ', die: 'bc-waldale' };
    for (const serial of [parts.serial, 'A12-3YY']) {
      const root = withResearchContext('2025-flag', () => scene(design, { ...parts, serial }));
      for (const glyph of all(byRole(root, 'serial')!).filter(n => ['U', 'Y', 'Z'].includes(String(n.attrs['data-character'])))) {
        expect(glyph.attrs['data-research-unit']).toBeUndefined();
        expect(glyph.attrs['data-provenance']).toBe('constructed');
      }
    }
  });

  it('leaves small-format candidate selection independent of the passenger policy', () => {
    for (const format of ['motorcycle-2011', 'trailer-utility-2016', 'personalized-motorcycle']) {
      expect(BC_PASSENGER_RESEARCH_BINDINGS[format]).toBeUndefined();
      const profile = withResearchContext(format, () => dieProfile('bc-waldale'));
      for (const char of Object.keys(profile.researchSourceUnits ?? {})) {
        const expected = registry.bindings[format]['bc-waldale'].find(id => Object.hasOwn(registry.units[id].glyphs, char));
        expect(profile.researchSourceUnits![char]).toBe(expected);
      }
    }
  });

  it('keeps the review policy restricted to recorded serial units', () => {
    for (const [format, profiles] of Object.entries(BC_PASSENGER_RESEARCH_BINDINGS)) {
      for (const [die, units] of Object.entries(profiles)) {
        for (const unit of units) {
          expect(registry.units[unit]?.role, `${format} ${die} ${unit}`).toBe('serial');
          expect(registry.bindings[format]?.[die], `${format} ${die} ${unit}`).toContain(unit);
        }
      }
    }
  });

  it('drops a previous context’s merged research when a protected pool has no eligible source', () => {
    const production = dieProfile('bc-waldale');
    const inherited = withResearchContext('motorcycle-2011', () => dieProfile('bc-waldale'));
    expect(inherited.researchChars?.size).toBeGreaterThan(0);
    try {
      // Both an absent archive binding and a binding containing only another
      // class must fall back safely, even when given an already merged profile.
      for (const candidates of [[], ['research-later-class-motorcycle-waldale']]) {
        installResearchRegistry({ ...registry, bindings: { ...registry.bindings,
          '2001-flag': { ...registry.bindings['2001-flag'], 'bc-waldale': candidates } } });
        const selected = withResearchContext('2001-flag', () => researchVariant(inherited, 'serial', 'K1'));
        expect(selected).toBe(production);
        expect(selected.researchSourceUnits).toBeUndefined();
        expect(dieGlyph(selected, '1')).toEqual(dieGlyph(production, '1'));
      }
    } finally { installResearchRegistry(registry); }
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
