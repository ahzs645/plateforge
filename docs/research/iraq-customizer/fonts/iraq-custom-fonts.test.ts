import { describe, expect, it } from 'vitest';
import { IRAQ_FONT_PROFILES, IRAQ_WORDMARKS, renderGlyphRun, renderWordmark } from '../../../../src/templates/iraq-custom-fonts';

describe('canonical reusable Iraqi font profiles', () => {
  it('keeps each historical profile a sparse observed subset', () => {
    expect(IRAQ_FONT_PROFILES['legacy-erbil'].coverage).toBe('٠٣٤٥٦٨');
    expect(IRAQ_FONT_PROFILES['legacy-sulaymaniyah'].coverage).toBe('٢٣٦٩');
    expect(IRAQ_FONT_PROFILES['anbar-taxi'].coverage).toBe('١٢٥٩');
    expect(IRAQ_FONT_PROFILES['utility-truck'].coverage).toBe('٠١٣');
    for (const id of ['legacy-erbil', 'legacy-sulaymaniyah', 'anbar-taxi', 'utility-truck'] as const) {
      const p = IRAQ_FONT_PROFILES[id];
      expect(Object.values(p.glyphs).every((g) => g.provenance === 'observed')).toBe(true);
      expect(Object.keys(p.glyphs).every((c) => !/[\uE000-\uF8FF]/u.test(c))).toBe(true);
    }
  });
  it('accepts digit aliases without changing canonical outlines or metrics', () => {
    for (const id of Object.keys(IRAQ_FONT_PROFILES)) {
      const runs = ['0123456789', '٠١٢٣٤٥٦٧٨٩', '۰۱۲۳۴۵۶۷۸۹'].map((text) => renderGlyphRun(id, text, 0, 100, 100, 6));
      expect(runs[0].advance).toBe(runs[1].advance);
      expect(runs[0].advance).toBe(runs[2].advance);
      // Titles preserve the actual unsupported input for diagnostics; canonical path runs are identical.
      const paths = (markup: string) => [...markup.matchAll(/ d="([^"]*)"/g)].map((m) => m[1]);
      expect(paths(runs[0].markup)).toEqual(paths(runs[1].markup));
      expect(paths(runs[0].markup)).toEqual(paths(runs[2].markup));
    }
  });
  it('draws unsupported boxes in strict mode rather than synthesizing missing digits', () => {
    const run = renderGlyphRun('utility-truck', '198', 10, 120, 80);
    expect(run.provenance).toEqual(['observed', 'unsupported', 'unsupported']);
    expect(run.markup.match(/data-provenance="unsupported"/g)).toHaveLength(2);
    expect(run.warnings.filter((w) => w.includes('crossed box'))).toHaveLength(2);
    expect(run.markup).not.toContain('mask');
  });
  it('uses only explicit OFL Naskh fallback and flags every substitution', () => {
    const run = renderGlyphRun('anbar-taxi', '507', 0, 100, 100, 0, 'fallback');
    expect(run.provenance).toEqual(['observed', 'fallback', 'fallback']);
    expect(run.markup).toContain('NotoNaskhArabic');
    expect(run.warnings.filter((w) => w.includes('labelled Noto'))).toHaveLength(2);
    expect(run.markup).not.toMatch(/EuroPlate|IRPlate|<text|font-family|<image/);
  });
  it('retains small zero instead of scaling each glyph to full height', () => {
    for (const id of ['legacy-erbil', 'utility-truck', 'naskh-candidate'] as const) {
      const p = IRAQ_FONT_PROFILES[id];
      expect(p.glyphs['٠'].bounds.height).toBeLessThan(50);
      expect(p.glyphs['٠'].bounds.y).toBeGreaterThan(-90);
      expect(p.glyphs['٠'].bounds.y + p.glyphs['٠'].bounds.height).toBeLessThan(-10);
    }
  });
  it('uses a single uniform SVG scale and reports genuine aggregate ink bounds', () => {
    const run = renderGlyphRun('legacy-erbil', '560', 12, 73, 40, 7);
    expect(run.markup.match(/scale\(0.4\)/g)).toHaveLength(3);
    expect(run.markup).not.toMatch(/scale\([^)]*[, ]/);
    expect(run.bounds.x).toBeCloseTo(13.6);
    const shifted = renderGlyphRun('legacy-erbil', '560', 112, 173, 40, 7);
    expect(shifted.bounds.x - run.bounds.x).toBeCloseTo(100);
    expect(shifted.bounds.y - run.bounds.y).toBeCloseTo(100);
    expect(shifted.bounds.width).toBeCloseTo(run.bounds.width);
    expect(shifted.advance).toBeCloseTo(run.advance);
  });
  it('preserves proportions when repeating or reordering glyphs', () => {
    for (const id of ['legacy-erbil', 'anbar-taxi', 'modern-eng'] as const) {
      const a = renderGlyphRun(id, '555', 0, 100, 100, 10);
      const glyph = IRAQ_FONT_PROFILES[id].glyphs[id === 'modern-eng' ? '5' : '٥'];
      expect(a.advance).toBeCloseTo(glyph.advance * 3 + 20);
      const paths = [...a.markup.matchAll(/<path[^>]* d="([^"]*)"/g)].map((m) => m[1]);
      expect(new Set(paths).size).toBe(1);
    }
  });
  it('provides all governorates and requested classes as pre-shaped complete word paths', () => {
    expect(Object.values(IRAQ_WORDMARKS).filter((w) => w.kind === 'governorate')).toHaveLength(19);
    expect(Object.values(IRAQ_WORDMARKS).filter((w) => w.kind === 'class')).toHaveLength(13);
    expect(Object.keys(IRAQ_WORDMARKS)).toHaveLength(33);
    for (const id of Object.keys(IRAQ_WORDMARKS)) {
      const word = renderWordmark('naskh-candidate', id, 0, 100, 100);
      expect(word.provenance).toEqual(['candidate']);
      expect(word.markup).not.toMatch(/<text|font-family|<image|\uE000/);
      expect(word.bounds.height).toBeCloseTo(100, 2);
      expect(word.bounds.y + word.bounds.height).toBeCloseTo(100, 2);
    }
  });
  it('keeps the special inspection and counter-terrorism labels as complete candidate wordmarks', () => {
    for (const [id, text] of [
      ['inspection-temporary', 'فحص مؤقت'],
      ['counter-terrorism', 'جهاز مكافحة الارهاب'],
    ]) {
      const outline = IRAQ_FONT_PROFILES['naskh-candidate'].wordmarks[id];
      expect(outline.text).toBe(text);
      expect(outline.sourceId).toBe('NotoNaskhArabic[wght].ttf:wght=700:HB-shaped');
      expect(outline.provenance).toBe('candidate');
      expect(IRAQ_WORDMARKS[id].note).toContain('not an observed or source-matched');
      const candidate = renderWordmark('naskh-candidate', id, 20, 80, 60);
      expect(candidate.markup.match(/<path /g)).toHaveLength(1);
      expect(candidate.markup.match(/scale\(0.6\)/g)).toHaveLength(1);
      expect(candidate.provenance).toEqual(['candidate']);
      for (const profile of Object.values(IRAQ_FONT_PROFILES).filter((p) => p.provenance === 'observed')) {
        expect(profile.wordmarks[id]).toBeUndefined();
        expect(renderWordmark(profile.id, id, 0, 100, 100).provenance).toEqual(['unsupported']);
        expect(renderWordmark(profile.id, id, 0, 100, 100, 'fallback').provenance).toEqual(['fallback']);
      }
    }
    expect(IRAQ_WORDMARKS.motorcycle.text).toBe('دراجة');
  });
  it('does not silently substitute connected wordmarks between historical profiles', () => {
    const strict = renderWordmark('legacy-erbil', 'anbar', 0, 100, 100);
    expect(strict.provenance).toEqual(['unsupported']);
    const fallback = renderWordmark('legacy-erbil', 'anbar', 0, 100, 100, 'fallback');
    expect(fallback.provenance).toEqual(['fallback']);
    expect(fallback.warnings[0]).toContain('pre-shaped');
    const observed = renderWordmark('anbar-taxi', 'anbar', 0, 100, 100);
    expect(observed.provenance).toEqual(['observed']);
    expect(IRAQ_FONT_PROFILES['anbar-taxi'].wordmarks.anbar.text).toBe('الأنبار');
    expect(IRAQ_WORDMARKS.anbar.text).toBe('الانبار');
  });
  it('never treats PUA word tokens or arbitrary unknown strings as supported Arabic', () => {
    expect(renderGlyphRun('legacy-erbil', '\uE000', 0, 100, 100).provenance).toEqual(['unsupported']);
    expect(renderWordmark('naskh-candidate', '<script>bad</script>', 0, 100, 100, 'fallback').provenance).toEqual(['unsupported']);
    expect(renderWordmark('naskh-candidate', '<script>bad</script>', 0, 100, 100).markup).not.toContain('<script>');
  });
  it('renders the connected Heh class token atomically, validates coordinates, and handles blank runs', () => {
    expect(renderGlyphRun('naskh-candidate', 'هـ', 0, 100, 100).provenance).toEqual(['candidate']);
    expect(renderGlyphRun('modern-eng', '', 0, 100, 100).advance).toBe(0);
    expect(() => renderGlyphRun('modern-eng', 'A', 0, 0, 0)).toThrow(RangeError);
    expect(() => renderGlyphRun('unknown', 'A', 0, 100, 100)).toThrow(RangeError);
    expect(() => renderGlyphRun('modern-eng', 'A', NaN, 100, 100)).toThrow(RangeError);
  });
});
