import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { iraq } from '../regions/asia/iraq';
import { IRAQ_CUSTOM_PRESETS, IRAQ_CUSTOM_SOURCE_COVERAGE } from './iraq-custom-data';
import { applyIraqClass, customizerState, iraqCustomSize, renderIraqCustom } from './iraq-custom-scene';
import type { IraqCustomState } from './iraq-custom-types';
import { IRAQ_FONT_PROFILES, IRAQ_WORDMARKS, renderGlyphRun, renderWordmark } from './iraq-custom-fonts';

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
// Compare rendered shapes independently of titles, evidence notices and saved-state metadata.
const artwork = (svg: string) => svg.replace(/<(title|desc|metadata)\b[^>]*>[\s\S]*?<\/\1>/g, '');
const presetForSource = (sourceId: string) => {
  const source = IRAQ_CUSTOM_SOURCE_COVERAGE.find(item => item.id === sourceId);
  const preset = IRAQ_CUSTOM_PRESETS.find(item => item.id === source?.presetId);
  if (!preset) throw new Error(`No editor preset linked to ${sourceId}`);
  return preset;
};

describe('flat Iraq customizer evidence inventory', () => {
  it('retains every existing recipe, seven specimen interpretations and four exceptional diagram interpretations', () => {
    expect(IRAQ_CUSTOM_PRESETS).toHaveLength(38);
    const ids = IRAQ_CUSTOM_PRESETS.map(preset => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const recipe of iraq.formats) expect(ids, recipe.id).toContain(recipe.id);
    expect(ids.filter(id => id.startsWith('flat-'))).toHaveLength(7);
    expect(ids.filter(id => id.startsWith('illustration-'))).toHaveLength(4);
    for (const preset of IRAQ_CUSTOM_PRESETS) {
      expect(preset.defaults.presetId, preset.id).toBe(preset.id);
      expect(preset.fields, preset.id).toContain('serial');
      expect(preset.evidence.trim().length, preset.id).toBeGreaterThan(20);
      expect(preset.label.trim().length, preset.id).toBeGreaterThan(0);
      expect(['compact', 'long']).toContain(preset.defaults.layout);
      expect(['strict', 'fallback']).toContain(preset.defaults.missingPolicy);
      for (const field of preset.fields) expect(preset.defaults[field], `${preset.id}/${field}`).toBeDefined();
    }
  });

  it('links all seven photographs and all 32 diagram artworks to editable interpretations without upgrading their evidence', () => {
    const photos = readJson('docs/research/iraq-customizer/fixtures/physical-specimens.json') as { id: string }[];
    const diagrams = readJson('docs/research/iraq-customizer/fixtures/source-illustrations.json') as { id: string }[];
    expect(photos).toHaveLength(7);
    expect(diagrams).toHaveLength(32);
    expect(IRAQ_CUSTOM_SOURCE_COVERAGE).toHaveLength(39);
    expect(IRAQ_CUSTOM_SOURCE_COVERAGE.map(source => source.id).sort()).toEqual([...photos, ...diagrams].map(source => source.id).sort());
    const ids = new Set(IRAQ_CUSTOM_PRESETS.map(preset => preset.id));
    for (const source of IRAQ_CUSTOM_SOURCE_COVERAGE) {
      expect(source.sourceUrl, source.id).toMatch(/^https:\/\//);
      expect(source.note.length, source.id).toBeGreaterThan(20);
      expect(source.presetId, source.id).not.toBeNull();
      expect(ids.has(source.presetId!), source.id).toBe(true);
      expect(source.status, source.id).not.toBe('evidence only');
    }
    expect(IRAQ_CUSTOM_SOURCE_COVERAGE.filter(source => source.presetId === null)).toEqual([]);
    for (const preset of IRAQ_CUSTOM_PRESETS) {
      for (const sourceId of preset.sourceArtworks) {
        expect(IRAQ_CUSTOM_SOURCE_COVERAGE.some(source => source.id === sourceId), `${preset.id}/${sourceId}`).toBe(true);
      }
    }
  });

  for (const [sourceId, kind] of [
    ['wiki-diagram-29', 'short-bilingual'],
    ['wiki-diagram-30', 'inspection-temporary'],
    ['wiki-diagram-37', 'icts'],
    ['wiki-diagram-42', 'international'],
  ]) {
    it(`${sourceId}: links its formerly evidence-only artwork to the correct editable exceptional layout`, () => {
      const preset = presetForSource(sourceId);
      expect(preset.kind).toBe(kind);
      expect(preset.sourceArtworks).toContain(sourceId);
      expect(preset.evidence).toMatch(/diagram|illustration/i);
      expect(`${preset.evidence} ${preset.notes.join(' ')}`).toMatch(/candidate|interpretation|reconstruction/i);
    });
  }

  it('retains unsupported and text-only caveats independently of having a renderable recipe', () => {
    const matrix = readJson('docs/research/iraq-customizer/fixtures/recipe-evidence.json') as { recipes: { id: string; evidenceTier: string }[] };
    for (const recipe of matrix.recipes) {
      const preset = IRAQ_CUSTOM_PRESETS.find(item => item.id === recipe.id)!;
      if (recipe.evidenceTier === 'unsupported') expect(preset.evidence).toMatch(/unsupported/i);
      if (recipe.evidenceTier === 'text_only') expect(preset.evidence).toMatch(/text.only/i);
      if (recipe.evidenceTier === 'diagram_only') expect(preset.evidence).toMatch(/diagram.only/i);
    }
    for (const preset of IRAQ_CUSTOM_PRESETS.filter(item => item.id.startsWith('flat-'))) {
      expect(preset.evidence, preset.id).toMatch(/interpretation|specimen|observed|source|candidate/i);
    }
  });
});

describe('flat Iraq parametric scenes', () => {
  for (const preset of IRAQ_CUSTOM_PRESETS) {
    it(`${preset.id}: produces deterministic, self-contained flat SVG for both layouts`, () => {
      for (const layout of ['long', 'compact'] as const) {
        const state = { ...customizerState(preset.id), layout };
        const before = JSON.stringify(state);
        const result = renderIraqCustom(state);
        expect(result.errors, `${preset.id}/${layout}`).toEqual([]);
        expect(renderIraqCustom(state)).toEqual(result);
        expect(JSON.stringify(state)).toBe(before);
        expect(result).toMatchObject(iraqCustomSize(state));
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
        expect(result.svg).toContain(`viewBox="0 0 ${result.width} ${result.height}"`);
        expect(result.svg).toContain('data-canonical="true"');
        expect(result.svg).toContain(`data-preset="${preset.id}"`);
        expect(result.svg).toContain(`data-layout="${layout}"`);
        expect(result.svg).toMatch(/<rect[^>]+data-role="flat-frame"/);
        expect(result.svg).toMatch(/<rect[^>]+data-role="flat-border"/);
        expect(result.svg).not.toMatch(/<(?:text|image|script|foreignObject|mask|filter|pattern)\b|@font-face|\b(?:NaN|Infinity|undefined)\b/);
        expect(result.svg).not.toMatch(/(?:href|xlink:href)=|data:image|data:font|matrix\(|skew[XY]\(/);
        expect(result.warnings.join(' ')).toMatch(/canonical editor coordinates/);
        // A two-axis transform must remain uniform, even if a font has a flipped Y convention.
        for (const match of result.svg.matchAll(/scale\(([^)]+)\)/g)) {
          const factors = match[1].trim().split(/[ ,]+/).map(Number);
          expect(factors.every(Number.isFinite), `${preset.id}: ${match[0]}`).toBe(true);
          expect(factors.length).toBeLessThanOrEqual(2);
          if (factors.length === 2) expect(Math.abs(factors[0])).toBeCloseTo(Math.abs(factors[1]), 9);
        }
      }
    });
  }

  it('preserves leading zeros and maps all three digit keyboards to identical rendered geometry', () => {
    for (const preset of IRAQ_CUSTOM_PRESETS) {
      const base = { ...customizerState(preset.id), missingPolicy: 'fallback' as const };
      const western = renderIraqCustom({ ...base, serial: '002369' });
      for (const serial of ['٠٠٢٣٦٩', '۰۰۲۳۶۹']) {
        const result = renderIraqCustom({ ...base, serial });
        expect(result).toEqual(western);
      }
      expect(western.svg).toContain('002369</title>');
    }
  });

  it('resets by value without mutating defaults or leaking previous preset edits', () => {
    for (const preset of IRAQ_CUSTOM_PRESETS) {
      const initial = customizerState(preset.id);
      const frozenDefaults = JSON.stringify(preset.defaults);
      const edited = customizerState(preset.id);
      expect(edited).not.toBe(initial);
      edited.serial = '00001111'; edited.bg = '#123456'; edited.mainScale = 1.2;
      renderIraqCustom(edited);
      for (const other of IRAQ_CUSTOM_PRESETS) customizerState(other.id);
      expect(customizerState(preset.id)).toEqual(initial);
      expect(JSON.stringify(preset.defaults)).toBe(frozenDefaults);
    }
  });

  it('makes actual serial/layout/colour/border edits without retaining source-photo frame paths', () => {
    const state = customizerState('flat-erbil-rounded');
    const initial = renderIraqCustom(state);
    const edit = renderIraqCustom({ ...state, serial: '330066', bg: '#abcdef', ink: '#123456', border: false, layout: 'long' });
    expect(edit.svg).not.toBe(initial.svg);
    expect(edit.svg).toContain('fill="#abcdef"');
    expect(edit.svg).toContain('fill="#123456"');
    expect(edit.svg).not.toContain('data-role="flat-border"');
    expect(edit).toMatchObject({ width: 520, height: 180 });
    const utility = readJson('docs/research/iraq-customizer/fixtures/utility-frame-paths.json') as { outline: string; borders: string[]; unknown: { path: string }[] }[];
    for (const id of ['flat-erbil-truck', 'flat-erbil-motorcycle']) {
      const svg = renderIraqCustom(customizerState(id)).svg;
      for (const specimen of utility) {
        for (const path of [specimen.outline, ...specimen.borders, ...specimen.unknown.map(item => item.path)]) expect(svg).not.toContain(path);
      }
    }
  });

  it('changes class colours and layout families without mutating the previous state', () => {
    const modern = customizerState('federal-modern-private');
    const snapshot = { ...modern };
    const hire = applyIraqClass(modern, 'hire');
    expect(modern).toEqual(snapshot);
    expect(hire).toMatchObject({ vehicleClass: 'hire', bg: '#f8f8f3', strip: '#d8272e' });
    const legacy = applyIraqClass(customizerState('flat-sulaymaniyah'), 'hire');
    expect(legacy).toMatchObject({ vehicleClass: 'hire', bg: '#d8272e', ink: '#ffffff' });
    const police = renderIraqCustom(applyIraqClass(legacy, 'police'));
    expect(police.svg).toContain('data-wordmark="police"');
    expect(police.svg).not.toContain('data-role="country"');
    expect(applyIraqClass(modern, 'not-a-class')).toEqual(modern);
  });

  it('keeps modern range and legacy year controls usable across class transitions', () => {
    const modern = { ...customizerState('kr-modern-temporary'), governorate: '21-22', missingPolicy: 'fallback' as const };
    const ordinary = applyIraqClass(modern, 'private');
    expect(ordinary.governorate).toBe('21');
    expect(modern.governorate).toBe('21-22');
    expect(renderIraqCustom(ordinary).errors).toEqual([]);
    expect(applyIraqClass(modern, 'temporary').governorate).toBe('21-22');
    const legacy = { ...customizerState('flat-sulaymaniyah'), year: '', missingPolicy: 'fallback' as const };
    const temporary = applyIraqClass(legacy, 'temporary');
    expect(temporary.year).toBe('2021');
    expect(legacy.year).toBe('');
    expect(renderIraqCustom(temporary).errors).toEqual([]);
    expect(renderIraqCustom(temporary).svg).toContain('data-role="year"');
    expect(applyIraqClass({ ...legacy, year: '2025' }, 'temporary').year).toBe('2025');
  });

  it('rebuilds visible shapes for edits to serial, province, code, letter and class controls', () => {
    for (const preset of IRAQ_CUSTOM_PRESETS) {
      const base = { ...customizerState(preset.id), missingPolicy: 'fallback' as const };
      const initial = renderIraqCustom(base);
      const serial = renderIraqCustom({ ...base, serial: '002369' });
      expect(serial.errors, `${preset.id}/serial`).toEqual([]);
      expect(artwork(serial.svg), `${preset.id}/serial`).not.toBe(artwork(initial.svg));
      if (preset.fields.includes('province') && !['modern', 'modern-temporary', 'international', 'icts', 'inspection-temporary', 'police'].includes(preset.kind) && !(preset.kind === 'bilingual' && ['government', 'customs'].includes(base.vehicleClass))) {
        const province = base.province === 'baghdad' ? 'basra' : 'baghdad';
        const edited = renderIraqCustom({ ...base, province });
        expect(edited.errors, `${preset.id}/province`).toEqual([]);
        expect(artwork(edited.svg), `${preset.id}/province`).not.toBe(artwork(initial.svg));
      }
      if (preset.fields.includes('governorate')) {
        const edited = renderIraqCustom({ ...base, governorate: base.governorate === '11' ? '22' : '11' });
        expect(edited.errors, `${preset.id}/governorate`).toEqual([]);
        expect(artwork(edited.svg), `${preset.id}/governorate`).not.toBe(artwork(initial.svg));
      }
      if (preset.fields.includes('letter')) {
        const letter = preset.kind === 'international' ? 'ABCD' : base.letter === 'A' ? 'B' : 'A';
        const edited = renderIraqCustom({ ...base, letter });
        expect(edited.errors, `${preset.id}/letter`).toEqual([]);
        expect(artwork(edited.svg), `${preset.id}/letter`).not.toBe(artwork(initial.svg));
      }
      const vehicleClass = base.vehicleClass === 'hire' ? 'commercial' : 'hire';
      const changedClass = applyIraqClass(base, vehicleClass);
      const edited = renderIraqCustom(changedClass);
      expect(changedClass.vehicleClass, preset.id).toBe(vehicleClass);
      expect(edited.errors, `${preset.id}/class`).toEqual([]);
      expect(artwork(edited.svg), `${preset.id}/class`).not.toBe(artwork(initial.svg));
    }
  });

  it('renders the source motorcycle W and inspection F as their documented Arabic pairs and full class labels', () => {
    for (const [sourceId, letter, arabic, role, wordmark] of [
      ['wiki-diagram-29', 'W', 'و', 'motorcycle-class', 'motorcycle'],
      ['wiki-diagram-30', 'F', 'ف', 'inspection-class', 'inspection-temporary'],
    ]) {
      const preset = presetForSource(sourceId);
      expect(preset.defaults.letter, sourceId).toBe(letter);
      for (const layout of ['long', 'compact'] as const) {
        const result = renderIraqCustom({ ...customizerState(preset.id), layout });
        expect(result.errors, `${sourceId}/${layout}`).toEqual([]);
        expect(result.svg).toContain(`<title>${arabic} · candidate`);
        expect(result.svg).toContain(`data-role="${role}" data-wordmark="${wordmark}"`);
        expect(result.svg).toContain(IRAQ_FONT_PROFILES['naskh-candidate'].wordmarks[wordmark].path);
        expect(result.svg).not.toContain('data-role="latin-pair"');
      }
    }
    expect(IRAQ_WORDMARKS.motorcycle.text).toBe('دراجة');
    expect(IRAQ_WORDMARKS['inspection-temporary'].text).toBe('فحص مؤقت');
  });

  it('renders the ICTS black and yellow interpretation with its complete atomic agency legend', () => {
    const preset = presetForSource('wiki-diagram-37');
    expect(preset.defaults).toMatchObject({ vehicleClass: 'icts', bg: '#101010', ink: '#f3cc26', strip: '#101010' });
    expect(IRAQ_WORDMARKS['counter-terrorism'].text).toBe('جهاز مكافحة الارهاب');
    for (const layout of ['long', 'compact'] as const) {
      const result = renderIraqCustom({ ...customizerState(preset.id), layout });
      expect(result.svg).toContain('fill="#101010"');
      expect(result.svg).toContain('fill="#f3cc26"');
      for (const char of 'ICTS') expect(result.svg).toContain(`data-char="${char}"`);
      expect(result.svg).toContain('data-role="icts-legend" data-wordmark="counter-terrorism" data-provenance="candidate"');
      expect(result.svg).toContain(IRAQ_FONT_PROFILES['naskh-candidate'].wordmarks['counter-terrorism'].path);
      expect(result.svg).toContain('data-role="latin-pair"');
      expect(result.svg).not.toContain('data-role="province"');
    }
  });

  it('supports normalized two-, three- and four-letter international suffixes and rejects malformed values', () => {
    const preset = presetForSource('wiki-diagram-42');
    const base = customizerState(preset.id);
    expect(base.letter).toBe('EBL');
    for (const layout of ['long', 'compact'] as const) {
      const variants = [];
      for (const letter of ['AB', 'EBL', 'ABCD']) {
        const result = renderIraqCustom({ ...base, layout, letter });
        expect(result.errors, `${layout}/${letter}`).toEqual([]);
        expect(result.svg).toContain('data-role="suffix"');
        expect(renderIraqCustom({ ...base, layout, letter: ` ${letter.toLowerCase()} ` })).toEqual(result);
        variants.push(artwork(result.svg));
      }
      expect(new Set(variants).size).toBe(3);
      for (const letter of ['', 'A', 'ABCDE', 'A1', 'AB-CD', 'عراق', 'A\u202eB']) {
        const result = renderIraqCustom({ ...base, layout, letter });
        expect(result.errors.join(' '), `${layout}/${letter}`).toMatch(/suffix.*2–4 Latin letters/i);
      }
    }
  });

  it('retains the original bounded Anbar non-security emblem as one uniformly scaled object', () => {
    const source = readFileSync('docs/research/iraq-customizer/fixtures/anbar-nonsecurity-emblem.svg', 'utf8');
    const sourceEmblem = source.match(/<g id="bounded-nonsecurity-emblem">([\s\S]*?)<\/g>/)![1];
    const sourcePaths = [...sourceEmblem.matchAll(/<path[^>]* d="([^"]*)"/g)].map(match => match[1]);
    expect(sourcePaths).toHaveLength(2);
    for (const layout of ['long', 'compact'] as const) {
      const result = renderIraqCustom({ ...customizerState('flat-anbar-taxi'), layout });
      const emblem = result.svg.match(/<g data-role="anbar-nonsecurity-emblem"[^>]*>[\s\S]*?<\/g>/)?.[0];
      expect(emblem).toBeDefined();
      expect(emblem).toContain('data-source="iq-2001-anbar-taxi"');
      expect(emblem).toContain('<ellipse cx="651" cy="155" rx="57" ry="57"');
      expect([...emblem!.matchAll(/<path[^>]* d="([^"]*)"/g)].map(match => match[1])).toEqual(sourcePaths);
      expect(emblem!.match(/scale\([^)]*\)/g)).toHaveLength(1);
      expect(emblem).not.toMatch(/scale\([^)]*[, ]|matrix\(|skew[XY]\(/);
      expect(result.svg).not.toContain('data-role="decorative-emblem"');
      expect(result.svg).not.toMatch(/<pattern\b|security-feature-unreplicated|data-role="security/);
      expect(result.warnings.join(' ')).toMatch(/No security mark is generated/);
    }
  });

  it('keeps the renderable white federal temporary recolor explicitly unsupported', () => {
    const preset = IRAQ_CUSTOM_PRESETS.find(item => item.id === 'federal-modern-temporary')!;
    const result = renderIraqCustom(customizerState(preset.id));
    expect(preset.defaults.bg).toBe('#f8f8f3');
    expect(preset.evidence).toMatch(/unsupported/i);
    expect(result.warnings.join(' ')).toMatch(/unsupported/i);
    expect(result.errors).toEqual([]);
  });

  it('returns actionable validation errors and safe XML for malicious or malformed state', () => {
    const base = customizerState('flat-modern-long');
    for (const serial of ['', '123456789', '12x34', '12\u202e34']) {
      expect(renderIraqCustom({ ...base, serial }).errors.join(' ')).toMatch(/serial must/i);
    }
    const injection = '\"><script>alert("x")</script>&';
    const result = renderIraqCustom({ ...base, serial: injection, letter: injection, province: injection, bg: injection, ink: injection, strip: injection });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.svg).not.toContain('<script>');
    expect(result.svg).not.toContain(injection);
    expect(result.svg).toContain('&lt;script&gt;');
    expect(result.svg).toContain('&amp;');
    expect(renderIraqCustom({ ...base, presetId: 'unknown' }).errors.join(' ')).toMatch(/unknown preset/i);
    expect(renderIraqCustom({ ...base, fontProfile: 'unknown' }).errors.join(' ')).toMatch(/font profile/i);
    expect(renderIraqCustom({ ...base, layout: 'unknown' as IraqCustomState['layout'] }).errors.join(' ')).toMatch(/layout/i);
  });

  it('contains nonfinite and out-of-range controls without emitting invalid geometry', () => {
    const base = customizerState('flat-modern-long');
    for (const value of [NaN, Infinity, -Infinity, -999, 999]) {
      const result = renderIraqCustom({ ...base, tracking: value, mainScale: value });
      expect(result.warnings.join(' ')).toMatch(/clamped/i);
      expect(result.svg).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);
    }
  });

  it('exports versioned editable state and font provenance without XML injection', () => {
    const state = { ...customizerState('flat-erbil-rounded'), serial: '٠٣٨', bg: '#123456' };
    const result = renderIraqCustom(state);
    const metadata = result.svg.match(/<metadata id="plateforge-iraq-settings">([\s\S]*?)<\/metadata>/)?.[1];
    expect(metadata).toBeDefined();
    const decoded = metadata!.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    expect(JSON.parse(decoded)).toEqual({ version: 1, state: { ...state, serial: '038' } });
    expect(result.svg).toContain('Font source:');
    expect(result.svg).toContain('Rights:');
  });

  it('blocks strict missing glyphs with crossed boxes and permits only explicitly labelled fallback', () => {
    const base = { ...customizerState('flat-sulaymaniyah'), serial: '0123456789', missingPolicy: 'strict' as const };
    // Keep the serial within the editable eight-digit contract while including a known absent zero.
    const strict = renderIraqCustom({ ...base, serial: '02369' });
    expect(strict.errors.join(' ')).toMatch(/unsupported characters\/wordmark in strict mode/i);
    expect(strict.svg).toContain('data-provenance="unsupported"');
    expect(strict.svg).toContain('stroke-dasharray=');
    expect(strict.svg).not.toContain('data-provenance="fallback"');
    const fallback = renderIraqCustom({ ...base, serial: '02369', missingPolicy: 'fallback' });
    expect(fallback.errors).toEqual([]);
    expect(fallback.svg).toContain('data-provenance="fallback"');
    expect(fallback.warnings.join(' ')).toMatch(/labelled.*fallback/i);
    for (const serial of ['8', '9']) {
      const state = { ...customizerState('flat-erbil-truck'), serial, missingPolicy: 'strict' as const };
      expect(renderIraqCustom(state).errors.join(' ')).toMatch(/unsupported/i);
      expect(renderIraqCustom({ ...state, missingPolicy: 'fallback' }).errors).toEqual([]);
    }
  });
});

describe('canonical Iraq outline and provenance contracts', () => {
  it('keeps observed digit coverage sparse and excludes source-damaged utility masters', () => {
    for (const [id, digits] of Object.entries({ 'legacy-sulaymaniyah': '٢٣٦٩', 'legacy-erbil': '٠٣٤٥٦٨', 'anbar-taxi': '١٢٥٩', 'utility-truck': '٠١٣' })) {
      const profile = IRAQ_FONT_PROFILES[id as keyof typeof IRAQ_FONT_PROFILES];
      expect(profile.provenance).toBe('observed');
      expect([...profile.coverage].sort()).toEqual([...digits].sort());
      expect(Object.keys(profile.glyphs).sort()).toEqual([...digits].sort());
      for (const glyph of Object.values(profile.glyphs)) {
        expect(glyph.provenance).toBe('observed');
        expect(glyph.sourceId.length).toBeGreaterThan(10);
        expect(glyph.path).toMatch(/^M/);
      }
    }
    expect(IRAQ_FONT_PROFILES['utility-truck'].glyphs['٨']).toBeUndefined();
    expect(IRAQ_FONT_PROFILES['utility-truck'].glyphs['٩']).toBeUndefined();
  });

  it('retains candidate labels for complete FE and Naskh coverage', () => {
    for (const id of ['modern-eng', 'modern-mtl', 'naskh-candidate'] as const) {
      const profile = IRAQ_FONT_PROFILES[id];
      expect(profile.provenance).toBe('candidate');
      for (const glyph of Object.values(profile.glyphs)) expect(glyph.provenance).toBe('candidate');
      const run = renderGlyphRun(id, '123', 0, 100, 100);
      expect(run.warnings.join(' ')).toMatch(/candidate/i);
      expect(run.provenance).toEqual(['candidate', 'candidate', 'candidate']);
    }
  });

  for (const profile of Object.values(IRAQ_FONT_PROFILES)) {
    it(`${profile.id}: uses canonical aliases, shared baseline and proportional metrics`, () => {
      const a = renderGlyphRun(profile.id, '0123456789', 4, 120, 80, 2, 'fallback');
      expect(renderGlyphRun(profile.id, '٠١٢٣٤٥٦٧٨٩', 4, 120, 80, 2, 'fallback').markup).toBe(a.markup);
      expect(renderGlyphRun(profile.id, '۰۱۲۳۴۵۶۷۸۹', 4, 120, 80, 2, 'fallback').markup).toBe(a.markup);
      for (const glyph of Object.values(profile.glyphs)) {
        const half = renderGlyphRun(profile.id, glyph.character, 7, 20, 50);
        const full = renderGlyphRun(profile.id, glyph.character, 7, 20, 100);
        expect(full.advance).toBeCloseTo(half.advance * 2, 4);
        expect(full.bounds.width).toBeCloseTo(half.bounds.width * 2, 4);
        expect(full.bounds.height).toBeCloseTo(half.bounds.height * 2, 4);
        expect(full.bounds.y - 20).toBeCloseTo((half.bounds.y - 20) * 2, 4);
        expect(full.markup).not.toMatch(/<text|<image|matrix\(|skew[XY]\(/);
      }
    });
  }

  it('does not inflate the observed small zero to full numeral height', () => {
    for (const id of ['legacy-erbil', 'utility-truck'] as const) {
      const zero = renderGlyphRun(id, '0', 0, 100, 100);
      const three = renderGlyphRun(id, '3', 0, 100, 100);
      expect(zero.bounds.height).toBeLessThan(three.bounds.height * .7);
      expect(zero.bounds.y).toBeGreaterThan(three.bounds.y);
    }
  });

  it('keeps complete wordmarks atomic and exposes strict/fallback provenance', () => {
    expect(Object.keys(IRAQ_WORDMARKS)).toHaveLength(33);
    for (const id of Object.keys(IRAQ_WORDMARKS)) {
      const candidate = renderWordmark('naskh-candidate', id, 10, 90, 40);
      expect(candidate.provenance).toEqual(['candidate']);
      expect(candidate.markup.match(/<path /g)).toHaveLength(1);
      expect(candidate.bounds.height).toBeCloseTo(40, 2);
      expect(candidate.bounds.y + candidate.bounds.height).toBeCloseTo(90, 2);
    }
    expect(renderWordmark('legacy-erbil', 'erbil', 0, 100, 50).provenance).toEqual(['observed']);
    expect(renderWordmark('legacy-erbil', 'baghdad', 0, 100, 50).provenance).toEqual(['unsupported']);
    const fallback = renderWordmark('legacy-erbil', 'baghdad', 0, 100, 50, 'fallback');
    expect(fallback.provenance).toEqual(['fallback']);
    expect(fallback.warnings.join(' ')).toMatch(/not observed.*fallback/i);
    const unknown = renderWordmark('legacy-erbil', '\"><script>&', 0, 100, 50, 'fallback');
    expect(unknown.provenance).toEqual(['unsupported']);
    expect(unknown.markup).not.toContain('<script>');
    expect(unknown.markup).toContain('&lt;script&gt;');
  });
});
