import { describe, expect, it } from 'vitest';
import { createRng } from '../../core/random';
import { iraqRecipes as iraq } from './iraq-recipes';
import { iran } from './iran';
import { IRAQ_GOVERNORATES, IRAQ_LETTERS } from './iraq-data';
import { IRAN_CODES, IRAN_MOTORCYCLE_CODES, IRAN_PRIVATE_LETTERS } from './iran-data';
import { asciiDigits, displayDigits, isDigits, normalizeLetter } from './plate-script';
import { accessibility, glyph, glyphRun, hasPlateGlyph } from '../../templates/westasia-glyphs';
import { NASKH_PLATE_GLYPHS } from '../../templates/westasia-arabic';
import { iranScene, iranSize, iraqScene, iraqSize, sceneSvg } from '../../templates/westasia-scene';
import { IRAN_CUSTOM_PRESETS } from '../../templates/iran-custom-data';

const iq = (id: string) => iraq.formats.find((f) => f.id === id)!;
const ir = (id: string) => iran.formats.find((f) => f.id === id)!;

describe('Iraq / Iran country contracts', () => {
  for (const region of [iraq, iran]) {
    it(`${region.name}: unique recipes, sources, editable fields and deterministic valid generation`, () => {
      expect(new Set(region.formats.map((f) => f.id)).size).toBe(region.formats.length);
      for (const f of region.formats) {
        expect(f.references?.length).toBeGreaterThan(0);
        expect(f.description).toMatch(/reconstruction|glyph/i);
        const a = createRng(`${region.id}/${f.id}`), b = createRng(`${region.id}/${f.id}`);
        for (let i = 0; i < 500; i++) {
          const parts = f.generate(a);
          expect(parts).toEqual(f.generate(b));
          expect(f.validate?.(parts), `${f.id} generated invalid input`).toBeNull();
          expect(f.text?.(parts)).not.toContain('undefined');
          for (const field of f.fields) {
            expect(parts[field.key]).toBeDefined();
            if (field.options) expect(field.options.some((o) => o.value === parts[field.key])).toBe(true);
          }
        }
      }
    }, 30_000); // 500 seeded plates per recipe, each validated through its full scene.
  }
  it('registers every source-guided Iran preset and preserves the legacy free-zone route', () => {
    expect(iraq.formats).toHaveLength(27);
    expect(iran.formats).toHaveLength(IRAN_CUSTOM_PRESETS.length + 1);
    for (const preset of IRAN_CUSTOM_PRESETS) expect(ir(preset.id).design?.customPreset).toBe(preset.id);
    expect(ir('free-zone-study').status).toBe('reproduction');
    expect(ir('free-zone-study').fields[0].options).toHaveLength(7);
    expect(iraq.gaps?.length).toBeGreaterThan(0);
    expect(iran.gaps?.some((g) => g.id === 'temporary')).toBe(false);
    expect(iran.gaps?.map((g) => g.id)).toEqual(['earliest-registration', 'free-zone-2017']);
  });
});

describe('script and allocation handling', () => {
  it('normalizes mixed digit scripts without reversing, trimming, or dropping zeros', () => {
    expect(asciiDigits('٠1۲٣۴٥۶٧۸٩')).toBe('0123456789');
    expect(displayDigits('00124', 'arabic')).toBe('٠٠١٢٤');
    expect(displayDigits('00124', 'persian')).toBe('۰۰۱۲۴');
    expect(asciiDigits('12x34')).toBe('12x34');
    expect(isDigits('12x34', 5)).toBe(false);
    expect(isDigits(' 1234', 5)).toBe(false);
    expect(isDigits('123\u202e4', 5)).toBe(false);
    expect(normalizeLetter('هـ')).toBe('ه');
    expect(normalizeLetter('ك')).toBe('ک');
  });
  it('separates the 19 modern Iraqi codes and does not invent legacy Halabja', () => {
    expect(IRAQ_GOVERNORATES).toHaveLength(19);
    expect(IRAQ_GOVERNORATES.filter((g) => g.kr).map((g) => g.code)).toEqual(['21', '22', '23', '24']);
    const kr = iq('kr-modern-private'), fed = iq('federal-modern-private');
    const p = { governorate: '22', letter: 'A', serial: '00123', layout: 'long' };
    expect(kr.validate?.(p)).toBeNull();
    expect(fed.validate?.(p)).not.toBeNull();
    expect(kr.validate?.({ ...p, serial: '123' })).not.toBeNull();
    expect(fed.validate?.({ ...p, governorate: '11', serial: '633' })).toBeNull();
    expect(iq('kr-legacy-private').validate?.({ governorate: '23', serial: '123456' })).not.toBeNull();
    expect(IRAQ_LETTERS.find((l) => l.latin === 'J')?.arabic).toBe('ج');
  });
  it('uses no governorate input for Iraqi government and customs bilingual plates', () => {
    for (const id of ['bilingual-2008-government', 'bilingual-2008-customs']) {
      expect(iq(id).fields.some((f) => f.key === 'governorate')).toBe(false);
      expect(iq(id).design?.national).toBe(true);
    }
  });
  it('allows zero in allocated Iranian right codes but not ordinary serials', () => {
    const f = ir('national-private'), p = { prefix: '۱۲', letter: 'ب', serial: '۳۴۵', code: '۱۰' };
    expect(f.validate?.(p)).toBeNull();
    expect(f.validate?.({ ...p, serial: '۳۰۵' })).not.toBeNull();
    expect(f.validate?.({ ...p, prefix: '10' })).not.toBeNull();
    expect(f.validate?.({ ...p, code: '70' })).not.toBeNull();
    expect(f.validate?.({ ...p, letter: 'ژ' })).not.toBeNull();
    expect(IRAN_PRIVATE_LETTERS).toHaveLength(13);
    expect(IRAN_CODES.find((c) => c.value === '32')?.provinces).toHaveLength(3);
  });
  it('skips internal zero motorcycle allocations: 499 -> 511', () => {
    const codes = IRAN_MOTORCYCLE_CODES.map((c) => c.value);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain('499'); expect(codes).toContain('511');
    expect(codes).not.toContain('500'); expect(codes).not.toContain('510');
    expect(codes.every((c) => /^[1-9]{3}$/.test(c))).toBe(true);
    expect(ir('motorcycle').validate?.({ code: '499', serial: '۱۲۳۴۵' })).toBeNull();
    expect(ir('motorcycle').validate?.({ code: '499', serial: '12045' })).not.toBeNull();
  });
  it('separates mission identifiers from random serials and uses national starting codes', () => {
    const f = ir('national-diplomatic');
    const p = f.generate(createRng('diplomatic'));
    expect(p.mission).toBe('214'); expect(p.serial).toBeUndefined();
    expect(p.code).toBe('11');
    expect(f.validate?.({ ...p, code: '22' })).not.toBeNull();
    expect(ir('national-government').design?.classLetter).toBe('الف');
  });
});

describe('Arabic-script outlines (naskh profile)', () => {
  const digits = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', letters = [...IRAQ_LETTERS.map((l) => l.arabic), ...IRAN_PRIVATE_LETTERS, 'ت', 'ع', 'ک', 'پ', 'ث', 'ش', 'ز', 'ف', 'ی'];
  it('covers every digit and every selectable Arabic-script letter except the hand-drawn plate هـ', () => {
    for (const ch of digits) expect(NASKH_PLATE_GLYPHS[ch], ch).toBeDefined();
    for (const l of letters) if (normalizeLetter(l) !== 'ه') expect(NASKH_PLATE_GLYPHS[normalizeLetter(l)], l).toBeDefined();
    expect(glyph('ه', 'naskh')).toBe(glyph('ه'));
  });
  it('keeps the Persian and Arabic 4/5/6 masters distinct and paints outlines, never text', () => {
    for (const [a, b] of [['۴', '٤'], ['۵', '٥'], ['۶', '٦']]) expect(glyph(a, 'naskh')).not.toBe(glyph(b, 'naskh'));
    const g = glyph('۲', 'naskh');
    expect(g).toMatch(/^<path d="M[^"]+" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"\/>$/);
    expect(glyph('س', 'naskh')).toMatch(/^<path d="M[^"]+" fill="currentColor"\/>$/); // letters are unthickened
    expect(g).not.toMatch(/<text|font/);
    for (const [w, d, stroke] of Object.values(NASKH_PLATE_GLYPHS)) { expect(w).toBeGreaterThan(0); expect(stroke).toBeGreaterThanOrEqual(0); expect(d).not.toMatch(/NaN|Infinity|undefined/); }
  });
  it('leaves the default profile geometric and falls back for Latin', () => {
    expect(glyph('۲')).toBe(glyph('۲', 'geometric'));
    expect(glyph('۲')).not.toBe(glyph('۲', 'naskh'));
    expect(glyph('D', 'naskh')).toBe(glyph('D'));
    expect(glyphRun('D', 0, 0, 50, 80, 3, 'naskh')).not.toContain('data-profile');
  });
  it('scales uniformly and never lets a glyph overflow its cell', () => {
    for (const ch of digits + letters.join('')) {
      const entry = NASKH_PLATE_GLYPHS[normalizeLetter(ch)]; if (!entry) continue;
      for (const [cell, height] of [[20, 78], [44, 78], [96, 60], [10, 80]]) {
        const run = glyphRun(ch, 0, 0, cell, height, 3, 'naskh');
        const [, left, scale] = run.match(/translate\(([-\d.e]+) [-\d.e]+\) scale\(([\d.e-]+)(?: [\d.e-]+)?\)/) ?? [];
        expect(scale, `${ch} ${cell}`).toBeDefined();
        expect(Number(scale) * entry[0], `${ch} width in ${cell}`).toBeLessThanOrEqual(cell + 1e-6);
        expect(Number(scale)).toBeLessThanOrEqual(height / 80 + 1e-9);
        expect(Number(left)).toBeGreaterThanOrEqual(-1e-6);
      }
    }
  });
  it('condenses a run by one die-level factor, uniformly and within its cell', () => {
    // x/y scale ratio of every naskh glyph in a rendered fragment
    const ratios = (svg: string) => [...svg.matchAll(/data-profile="naskh" transform="translate\([-\d.e]+ [-\d.e]+\) scale\(([\d.e-]+) ([\d.e-]+)\)/g)].map((m) => Number(m[1]) / Number(m[2]));
    for (const r of ratios(glyphRun('٣٤', 0, 0, 120, 78, 3, 'naskh'))) expect(r).toBeCloseTo(1);
    const narrow = ratios(glyphRun('٣٤', 0, 0, 120, 78, 3, 'naskh', .75));
    expect(narrow).toHaveLength(2);
    for (const r of narrow) expect(r).toBeCloseTo(.75);
    expect(glyphRun('D', 0, 0, 60, 78, 3, 'naskh', .5)).not.toContain('data-profile'); // Latin is never condensed
    const body = (id: string) => { const f = iq(id); return iraqScene(f.design!, f.generate(createRng('c'))).body; };
    const digitRatios = (id: string) => ratios(body(id).match(/data-layer="(?:arabic-)?serial">.*/s)![0]);
    expect(digitRatios('bilingual-2008-private').slice(-5).every((r) => Math.abs(r - .75) < 1e-6)).toBe(true);
    expect(digitRatios('private-1988').every((r) => Math.abs(r - .8) < 1e-6)).toBe(true);
    expect(digitRatios('kr-legacy-private').every((r) => Math.abs(r - .8) < 1e-6)).toBe(true);
    // no die measurement for the 2001 plate on this canvas, so it keeps the font's own proportions
    expect(digitRatios('private-2001').every((r) => Math.abs(r - 1) < 1e-6)).toBe(true);
  });
  it('is used for Iranian and older Iraqi Arabic-script runs, and not for Latin lines or modern Iraq', () => {
    const iranBody = iranScene(ir('national-private').design!, { prefix: '12', letter: 'ب', serial: '345', code: '11' }).body;
    expect(iranBody).toContain('data-profile="naskh"');
    expect(iranBody).not.toContain('data-profile="euro"');
    const bilingual = iraqScene(iq('bilingual-2008-private').design!, iq('bilingual-2008-private').generate(createRng('x'))).body;
    expect(bilingual).toContain('data-profile="naskh"');
    expect(bilingual.match(/data-layer="latin-serial">(?:(?!<\/g><\/g>).)*/s)?.[0]).not.toContain('naskh');
    const modern = iraqScene(iq('federal-modern-private').design!, iq('federal-modern-private').generate(createRng('x'))).body;
    expect(modern).not.toContain('data-profile="naskh"');
  });
});

describe('SVG structure and security', () => {
  it('has separate Persian and Arabic 4/5/6 masters and every selectable serial letter', () => {
    for (const ch of '0123456789٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹ABCDEFGHIJKLMNOPQRSTUVWXYZ') expect(hasPlateGlyph(ch), ch).toBe(true);
    for (const l of IRAQ_LETTERS) expect(hasPlateGlyph(l.arabic), l.arabic).toBe(true);
    for (const l of IRAN_PRIVATE_LETTERS) expect(hasPlateGlyph(l), l).toBe(true);
    for (const l of ['ت', 'ع', 'ک', 'پ', 'ث', 'ش', 'ز', 'ف']) expect(hasPlateGlyph(l)).toBe(true);
    expect(glyph('۴')).not.toBe(glyph('٤'));
    expect(glyph('۵')).not.toBe(glyph('٥'));
    expect(glyph('۶')).not.toBe(glyph('٦'));
    expect(accessibility(0, 0, 80)).toContain('<path');
    expect(accessibility(0, 0, 80)).not.toContain('♿');
  });
  it('renders every recipe as self-contained SVG geometry with no external assets', () => {
    for (const region of [iraq, iran]) for (const f of region.formats) {
      const p = f.generate(createRng(f.id)), d = { ...region.design, ...f.design };
      const scene = region.id === 'iraq' ? iraqScene(d, p, f.text?.(p)) : iranScene(d, p, f.text?.(p));
      const svg = sceneSvg(scene, f.label);
      expect(svg).toContain('<path');
      expect(svg).not.toMatch(/<image|<script|<foreignObject|@font-face|NaN|Infinity|undefined/);
      expect(svg).toContain('<desc>');
    }
  });
  it('uses class-coloured strips on modern Iraq without recolouring the whole face', () => {
    const f = iq('federal-modern-hire'), p = f.generate(createRng('red'));
    const s = iraqScene(f.design!, p);
    expect(s.body).toContain('fill="#f8f8f3"');
    expect(s.body).toContain('data-layer="class-strip"');
    expect(s.body).toContain('fill="#ba242b"');
    expect(iraqSize(f.design!, p)).toEqual({ width: 520, height: 110 });
    expect(iraqSize(f.design!, { ...p, layout: 'compact' })).toEqual({ width: 335, height: 155 });
    expect(iranSize(ir('motorcycle').design!)).toEqual({ width: 200, height: 150 });
  });
  it('keeps Iranian serial groups in physical order, with D/S Latin and Persian digits', () => {
    const d = ir('national-diplomatic').design!;
    const s = iranScene(d, { prefix: '12', mission: '214', code: '11' });
    expect(s.body.indexOf('data-layer="prefix"')).toBeLessThan(s.body.indexOf('data-layer="series"'));
    expect(s.body.indexOf('data-layer="series"')).toBeLessThan(s.body.indexOf('data-layer="serial"'));
    expect(s.body.indexOf('data-layer="serial"')).toBeLessThan(s.body.indexOf('data-layer="allocation"'));
    expect(s.body).toContain('data-glyph="D"');
    expect(s.body).toContain('data-glyph="۲"');
    expect(iranScene(ir('national-accessible').design!, { prefix: '12', serial: '345', code: '11' }).body).not.toContain('data-glyph="ژ"');
  });
  it('escapes hostile edits and rejects non-colour paint strings', () => {
    const attack = '"><script>alert(1)</script><image href="https://bad.test/a">';
    const s = iranScene({ system: 'free-zone', bg: attack, ink: 'url(https://bad.test)' }, { zone: attack, serial: attack }, attack);
    const svg = sceneSvg(s, attack);
    expect(svg).not.toContain('<script>'); expect(svg).not.toContain('<image ');
    expect(svg).not.toContain('fill="url('); expect(svg).not.toContain('color="url(');
    expect(svg).toContain('&lt;script&gt;');
  });
});
