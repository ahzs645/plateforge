import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { britishColumbia } from '../../regions/canada';
import { kitRecipe } from '../../regions/canada/bc-kit';
import { buildKitScene } from '../bc/kit';
import { serializeSvgNode, type SvgNode } from '../svg-scene';
import { buildDieText, dieGlyph, dieRunWidth } from './engine';
import { BC_PASSENGER_MASTERS } from './passenger-reconstruction';
import { dieProfile } from './profiles';
import { installResearchRegistry, researchVariant, setResearchDiesEnabled, withResearchContext, type ResearchRegistry } from './research-dies';

const registry: ResearchRegistry = JSON.parse(readFileSync('src/templates/dies/research-registry.json', 'utf8'));
beforeAll(() => installResearchRegistry(registry));
afterAll(() => { setResearchDiesEnabled(true); installResearchRegistry(null); });
const all = (n: SvgNode): SvgNode[] => [n, ...n.children.flatMap(c => typeof c === 'string' ? [] : all(c))];
const cases = [
  ['2025-flag', 'bc-waldale', 'UYZ', 'A12-3UZ'],
  ['1985-flag', 'bc-astro-3', 'N', 'NJB-300'],
  ['1985-flag', 'bc-astro-4', 'N', 'NPN-030'],
  ['2001-flag', 'bc-astro-4', 'N', '030-NPN'],
] as const;

describe('narrowly scoped passenger reconstructions', () => {
  it('restores the exact U/Y/Z paths preserved in the archived vector comparisons', () => {
    const root = 'public/bc-font-reconstruction-archive/';
    const archive = JSON.parse(readFileSync(`${root}manifest.json`, 'utf8'));
    for (const [char, occurrence] of [['U', 8], ['Y', 14], ['Z', 20]] as const) {
      const asset = archive.assets.find((a: { occurrence: number }) => a.occurrence === occurrence);
      const svg = readFileSync(root + asset.path, 'utf8');
      const master = BC_PASSENGER_MASTERS[char];
      const start = svg.indexOf(`data-reconstruction-id="${master.id}"`);
      expect(start).toBeGreaterThan(0);
      const originalPath = svg.slice(start).match(/<path\b[^>]*\bd="([^"]+)"/)![1];
      expect(master.paths).toEqual([originalPath]);
      expect(master.recovery).toBe('report-vector');
    }
  });

  it.each(cases)('preserves every advance and unchanged glyph in %s / %s', (format, die, changed, serial) => {
    try {
      for (const enabled of [false, true]) {
        setResearchDiesEnabled(enabled);
        // This control uses exactly the same inner registry pool, while its
        // outer comparison context excludes the new passenger-only masters.
        const prior = withResearchContext('comparison-control', () => withResearchContext(format, () => dieProfile(die)));
        const current = withResearchContext(format, () => dieProfile(die));
        for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
          expect(dieGlyph(current, char)?.advance).toBe(dieGlyph(prior, char)?.advance);
          if (changed.includes(char)) {
            expect(dieGlyph(current, char)?.fill).toBe(true);
            expect(dieGlyph(current, char)?.paths).not.toEqual(dieGlyph(prior, char)?.paths);
            expect(current.researchChars?.has(char) ?? false).toBe(false);
            expect(current.researchSourceUnits?.[char]).toBeUndefined();
          } else expect(dieGlyph(current, char)).toEqual(dieGlyph(prior, char));
        }
        expect(dieRunWidth(current, serial)).toBe(dieRunWidth(prior, serial));
      }
    } finally { setResearchDiesEnabled(true); }
  });

  it('identifies actual rendered serial reconstructions separately from registry candidates', () => {
    for (const [formatId, die, changed, serial] of cases) {
      const format = britishColumbia.formats.find(f => f.id === formatId)!;
      const recipe = kitRecipe(String(format.design!.kit));
      const selected = { ...recipe, serial: { ...recipe.serial, die } };
      const root = withResearchContext(formatId, () => buildKitScene(selected, { serial, die }, { scope: 'reconstruction-test' }));
      const glyphs = all(root).filter(n => n.attrs['data-character'] && changed.includes(String(n.attrs['data-character'])));
      expect(glyphs.length).toBeGreaterThan(0);
      for (const glyph of glyphs) {
        expect(glyph.attrs['data-provenance']).toBe('profile-override');
        expect(glyph.attrs['data-reconstruction-status']).toBe('source-informed');
        expect(glyph.attrs['data-reconstruction-source']).toMatch(/^https:\/\/www\.bcpl8s\.ca\/images\/Passenger\//);
        expect(glyph.attrs['data-research-unit']).toBeUndefined();
        expect(glyph.attrs['data-source']).toBeUndefined();
        expect(glyph.attrs.fill).toBeTruthy();
        expect(glyph.attrs.stroke).toBe('none');
      }
    }
  });

  it('does not pass reconstructed N to other plate classes borrowing a passenger pool', () => {
    for (const outer of ['collector-passenger', 'collector-motorcycle', 'commercial-flag', 'farm-truck-flag', 'sample-flag']) {
      for (const [inner, die] of [['1985-flag', 'bc-astro-3'], ['1985-flag', 'bc-astro-4'], ['2025-flag', 'bc-waldale']]) {
        const p = withResearchContext(outer, () => withResearchContext(inner, () => dieProfile(die)));
        expect(p.reconstructedGlyphs, `${outer} → ${inner} / ${die}`).toBeUndefined();
      }
    }
    for (const format of ['1985-flag', '2001-flag', '2013-flag-dual', '2014-flag', 'motorcycle-2011', 'trailer-utility-2016']) {
      const p = withResearchContext(format, () => dieProfile('bc-waldale'));
      expect(p.reconstructedGlyphs).toBeUndefined();
    }
  });

  it('retains the masters with the archive unloaded, while preserving scope after nested errors', () => {
    try {
      installResearchRegistry(null);
      expect(withResearchContext('2025-flag', () => dieProfile('bc-waldale')).reconstructedGlyphs?.U.id).toBe(BC_PASSENGER_MASTERS.U.id);
      expect(() => withResearchContext('2025-flag', () => withResearchContext('2001-flag', () => { throw new Error('render interrupted'); }))).toThrow();
      expect(dieProfile('bc-waldale').reconstructedGlyphs).toBeUndefined();
      expect(withResearchContext('commercial-flag', () => dieProfile('bc-waldale')).reconstructedGlyphs).toBeUndefined();
    } finally { installResearchRegistry(registry); }
  });

  it('keeps measurement and edited serial runs stable and excludes nonserial roles', () => {
    withResearchContext('1985-flag', () => {
      const p = dieProfile('bc-astro-4');
      for (const text of ['N', 'NN', 'NPN', 'NPN030']) {
        for (const role of ['x', 'serial-left', 'serial-right']) {
          const run = buildDieText({ text, role, profile: p, x: 0, baseline: 100, capHeight: 100, anchor: 'start', ink: '#000' });
          expect(run.width).toBe(dieRunWidth(p, text));
          for (const n of all(run.node).filter(n => n.attrs['data-character'] === 'N')) {
            expect(n.attrs['data-reconstruction-id']).toBe(BC_PASSENGER_MASTERS.classic4N.id);
          }
          expect(serializeSvgNode(run.node)).not.toMatch(/NaN|Infinity/);
        }
      }
      expect(researchVariant(p, 'slogan', 'N').reconstructedGlyphs).toBeUndefined();
    });
  });
});
