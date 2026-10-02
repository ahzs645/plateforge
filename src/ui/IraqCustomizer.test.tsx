import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createIraqEditorSession, IraqCustomizer, iraqEditorReducer } from './IraqCustomizer';
import { IRAQ_CUSTOM_PRESETS, IRAQ_CUSTOM_SOURCE_COVERAGE, customizerState, renderIraqCustom } from '../templates/iraq-custom-scene';

describe('Iraq editor immutable session transitions', () => {
  it('keeps repeated typing and colour edits when switching away and back', () => {
    let session = createIraqEditorSession('flat-erbil-rounded');
    const original = session;
    Object.freeze(original.current); Object.freeze(original.saved); Object.freeze(original);
    for (const serial of ['0', '00', '003', '0038', '٠٠٣٨']) session = iraqEditorReducer(session, { type: 'edit', patch: { serial } });
    session = iraqEditorReducer(session, { type: 'edit', patch: { bg: '#123456', ink: '#abcdef', layout: 'long', tracking: 5.5 } });
    const edited = { ...session.current };
    session = iraqEditorReducer(session, { type: 'select', presetId: 'flat-modern-long' });
    session = iraqEditorReducer(session, { type: 'edit', patch: { serial: '12000', letter: 'L' } });
    session = iraqEditorReducer(session, { type: 'select', presetId: 'flat-erbil-rounded' });
    expect(session.current).toEqual(edited);
    expect(original.current).toEqual(customizerState('flat-erbil-rounded'));
    expect(session.saved['flat-modern-long'].serial).toBe('12000');
    expect(renderIraqCustom(session.current).svg).toContain('0038</title>');
  });

  it('preserves repeated special-layout number, province, letter and class edits across switching and reset', () => {
    for (const sourceId of ['wiki-diagram-29', 'wiki-diagram-30', 'wiki-diagram-37', 'wiki-diagram-42']) {
      const presetId = IRAQ_CUSTOM_SOURCE_COVERAGE.find(source => source.id === sourceId)!.presetId!;
      const preset = IRAQ_CUSTOM_PRESETS.find(item => item.id === presetId)!;
      let session = createIraqEditorSession(presetId);
      const original = session;
      for (const serial of ['0', '00', '002', '002369']) session = iraqEditorReducer(session, { type: 'edit', patch: { serial } });
      if (preset.fields.includes('province')) session = iraqEditorReducer(session, { type: 'edit', patch: { province: 'baghdad' } });
      if (preset.fields.includes('letter')) session = iraqEditorReducer(session, { type: 'edit', patch: { letter: preset.kind === 'international' ? 'ABCD' : 'W' } });
      session = iraqEditorReducer(session, { type: 'class', classId: 'commercial' });
      session = iraqEditorReducer(session, { type: 'edit', patch: { missingPolicy: 'fallback', layout: 'long' } });
      const edited = { ...session.current };
      expect(renderIraqCustom(edited).errors, presetId).toEqual([]);
      expect(edited.vehicleClass, presetId).toBe('commercial');
      expect(edited.serial, presetId).toBe('002369');
      expect(original.current, presetId).toEqual(customizerState(presetId));
      session = iraqEditorReducer(session, { type: 'select', presetId: 'flat-modern-long' });
      session = iraqEditorReducer(session, { type: 'select', presetId });
      expect(session.current, presetId).toEqual(edited);
      expect(iraqEditorReducer(session, { type: 'select', presetId }), presetId).toBe(session);
      session = iraqEditorReducer(session, { type: 'reset' });
      expect(session.current, presetId).toEqual(customizerState(presetId));
    }
  });

  it('reset clears only the current preset and remains reset after another switch', () => {
    let session = createIraqEditorSession('flat-erbil-rounded');
    session = iraqEditorReducer(session, { type: 'edit', patch: { serial: '8888' } });
    session = iraqEditorReducer(session, { type: 'select', presetId: 'flat-modern-long' });
    session = iraqEditorReducer(session, { type: 'edit', patch: { serial: '12345', bg: '#aaaaaa' } });
    session = iraqEditorReducer(session, { type: 'reset' });
    expect(session.current).toEqual(customizerState('flat-modern-long'));
    expect(session.saved['flat-erbil-rounded'].serial).toBe('8888');
    expect(session.saved['flat-modern-long']).toBeUndefined();
    session = iraqEditorReducer(session, { type: 'select', presetId: 'flat-erbil-rounded' });
    expect(session.current.serial).toBe('8888');
    session = iraqEditorReducer(session, { type: 'select', presetId: 'flat-modern-long' });
    expect(session.current).toEqual(customizerState('flat-modern-long'));
    session = iraqEditorReducer(session, { type: 'reset' });
    expect(iraqEditorReducer(session, { type: 'reset' })).toEqual(session);
  });

  it('same-preset reselection and invalid choices do not reset working state', () => {
    let session = createIraqEditorSession('flat-modern-long');
    session = iraqEditorReducer(session, { type: 'edit', patch: { serial: '00012' } });
    expect(iraqEditorReducer(session, { type: 'select', presetId: 'flat-modern-long' })).toBe(session);
    expect(iraqEditorReducer(session, { type: 'select', presetId: 'does-not-exist' })).toBe(session);
  });

  it('class controls affect the current design and can be independently reset', () => {
    const initial = createIraqEditorSession('flat-sulaymaniyah');
    let session = iraqEditorReducer(initial, { type: 'class', classId: 'hire' });
    expect(session.current).toMatchObject({ vehicleClass: 'hire', bg: '#d8272e', ink: '#ffffff' });
    expect(initial.current).toEqual(customizerState('flat-sulaymaniyah'));
    session = iraqEditorReducer(session, { type: 'class', classId: 'temporary' });
    session = iraqEditorReducer(session, { type: 'edit', patch: { year: '2025', missingPolicy: 'fallback' } });
    expect(renderIraqCustom(session.current).svg).toContain('data-role="year"');
    session = iraqEditorReducer(session, { type: 'reset' });
    expect(session.current).toEqual(initial.current);
  });

  it('round-trips independent edits for all 38 presets', () => {
    let session = createIraqEditorSession();
    for (const [index, preset] of IRAQ_CUSTOM_PRESETS.entries()) {
      session = iraqEditorReducer(session, { type: 'select', presetId: preset.id });
      session = iraqEditorReducer(session, { type: 'edit', patch: { serial: String(index).padStart(5, '0'), border: false } });
    }
    for (const [index, preset] of IRAQ_CUSTOM_PRESETS.entries()) {
      session = iraqEditorReducer(session, { type: 'select', presetId: preset.id });
      expect(session.current.serial, preset.id).toBe(String(index).padStart(5, '0'));
      expect(session.current.border, preset.id).toBe(false);
    }
  });
});

describe('Iraq editor server-rendered contract (not browser interaction coverage)', () => {
  it('renders the exact live SVG and accessible editing/export controls', () => {
    const html = renderToStaticMarkup(<IraqCustomizer />);
    expect(html).toContain(renderIraqCustom(customizerState(IRAQ_CUSTOM_PRESETS[0].id)).svg);
    for (const label of ['Serial', 'Governorate', 'Letter', 'Vehicle class', 'Font profile', 'Missing glyph policy', 'Main lettering scale', 'Letter spacing', 'Background', 'Lettering', 'Class strip', 'Search presets']) {
      expect(html).toContain(`aria-label="${label}"`);
    }
    expect(html).toContain('Save SVG');
    expect(html).toContain('Save PNG · 4×');
    expect(html).toContain('Restore preset');
    expect(html).toContain('Strict · mark missing and block export');
    expect(html).toContain('Fallback · allow labeled substitution');
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toMatch(/<image\b|@font-face|data:font/);
  });

  it('shows all 38 presets and separates all 39 mapped evidence rows', () => {
    const html = renderToStaticMarkup(<IraqCustomizer />);
    const picker = html.match(/<select[^>]*aria-label="Preset"[^>]*>([\s\S]*?)<\/select>/)?.[1];
    expect(picker).toBeDefined();
    expect(picker!.match(/<option\b/g)).toHaveLength(38);
    expect(html.match(/class="iqc-preset-card"/g)).toHaveLength(38);
    expect(html.match(/class="iqc-source-row"/g)).toHaveLength(39);
    expect(html).not.toContain('>Evidence only<');
    expect(html.match(/>Open linked preset<\/button>/g)).toHaveLength(39);
    expect(html).toContain('Candidate reconstruction');
    expect(html).toContain('not certified manufacturing dies');
  });

  it('provides a working preset selection and source link for every formerly evidence-only artwork', () => {
    const catalogue = renderToStaticMarkup(<IraqCustomizer />);
    const rows = catalogue.match(/<article\b[^>]*class="iqc-source-row"[^>]*>[\s\S]*?<\/article>/g)!;
    for (const sourceId of ['wiki-diagram-29', 'wiki-diagram-30', 'wiki-diagram-37', 'wiki-diagram-42']) {
      const source = IRAQ_CUSTOM_SOURCE_COVERAGE.find(item => item.id === sourceId)!;
      const row = rows.find(item => item.includes(source.label));
      expect(row, sourceId).toBeDefined();
      expect(row, sourceId).toContain(`href="${source.sourceUrl}"`);
      expect(row, sourceId).toContain('Open linked preset');
      expect(row, sourceId).not.toContain('>Evidence only<');
      const session = iraqEditorReducer(createIraqEditorSession(), { type: 'select', presetId: source.presetId! });
      expect(session.current.presetId, sourceId).toBe(source.presetId);
      const html = renderToStaticMarkup(<IraqCustomizer initialState={session.current} />);
      expect(html, sourceId).toContain(`data-preset="${source.presetId}"`);
      expect(html, sourceId).toContain('aria-label="Serial"');
      expect(html, sourceId).toMatch(/<button type="button">Save SVG<\/button>/);
    }
  });

  it('discloses the unsupported federal temporary recipe in the live editor', () => {
    const html = renderToStaticMarkup(<IraqCustomizer initialState={customizerState('federal-modern-temporary')} />);
    const disclosure = html.match(/<p class="iqc-evidence">([\s\S]*?)<\/p>/)?.[1];
    expect(disclosure).toMatch(/unsupported/i);
    expect(disclosure).toMatch(/no matching frozen photograph/i);
  });

  it('disables both exports for strict missing glyphs and enables them with explicit fallback', () => {
    const initialState = { ...customizerState('flat-sulaymaniyah'), serial: '02369', missingPolicy: 'strict' as const };
    const strict = renderToStaticMarkup(<IraqCustomizer initialState={initialState} />);
    expect(strict).toMatch(/<button[^>]*disabled=""[^>]*>Save SVG<\/button>/);
    expect(strict).toMatch(/<button[^>]*disabled=""[^>]*>Save PNG · 4×<\/button>/);
    expect(strict).toContain('Export is blocked');
    expect(strict).toContain('data-provenance="unsupported"');
    const fallback = renderToStaticMarkup(<IraqCustomizer initialState={{ ...initialState, missingPolicy: 'fallback' }} />);
    expect(fallback).toMatch(/<button type="button">Save SVG<\/button>/);
    expect(fallback).toMatch(/<button type="button" class="iqc-primary">Save PNG · 4×<\/button>/);
    expect(fallback).toContain('Fallback explicitly enabled');
    expect(fallback).toContain('data-provenance="fallback"');
  });

  it('edits the Latin city suffix through invalid partial typing, recovery and preset switching', () => {
    let session = createIraqEditorSession('illustration-international-erbil');
    const original = renderToStaticMarkup(<IraqCustomizer initialState={session.current} />);
    expect(original).toContain('Latin city suffix');
    expect(original).not.toContain('aria-label="Province / prefix"');
    for (const letter of ['A', 'ABCDE', 'A1']) {
      session = iraqEditorReducer(session, { type: 'edit', patch: { letter } });
      const html = renderToStaticMarkup(<IraqCustomizer initialState={session.current} />);
      expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Save SVG<\/button>/);
      expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Save PNG · 4×<\/button>/);
      expect(html).toContain('International suffix must contain 2–4 Latin letters.');
    }
    for (const letter of ['AB', 'EBL', 'ABCD']) {
      session = iraqEditorReducer(session, { type: 'edit', patch: { letter } });
      const html = renderToStaticMarkup(<IraqCustomizer initialState={session.current} />);
      expect(html).toMatch(/<button type="button">Save SVG<\/button>/);
      expect(html).toMatch(/<button type="button" class="iqc-primary">Save PNG · 4×<\/button>/);
      expect(html).toContain(`value="${letter}"`);
    }
    session = iraqEditorReducer(session, { type: 'select', presetId: 'illustration-icts' });
    session = iraqEditorReducer(session, { type: 'select', presetId: 'illustration-international-erbil' });
    expect(session.current.letter).toBe('ABCD');
  });

  it('hides irrelevant special-layout province and strip controls while preserving their useful fields', () => {
    for (const [presetId, province, strip] of [
      ['illustration-bilingual-motorcycle', true, false],
      ['illustration-bilingual-temporary', false, false],
      ['illustration-icts', false, true],
      ['illustration-international-erbil', false, true],
    ] as const) {
      const html = renderToStaticMarkup(<IraqCustomizer initialState={customizerState(presetId)} />);
      expect(html.includes('aria-label="Province / prefix"'), presetId).toBe(province);
      expect(html.includes('aria-label="Class strip"'), presetId).toBe(strip);
      for (const field of ['Serial', 'Letter', 'Vehicle class', 'Background', 'Lettering']) expect(html, presetId).toContain(`aria-label="${field}"`);
    }
  });

  it('exposes appropriate fields across every preset and class-driven temporary transition', () => {
    for (const preset of IRAQ_CUSTOM_PRESETS) {
      const html = renderToStaticMarkup(<IraqCustomizer initialState={customizerState(preset.id)} />);
      expect(html).toContain(`data-preset="${preset.id}"`);
      const provinceShown = !['modern', 'modern-temporary', 'international', 'icts', 'inspection-temporary'].includes(preset.kind)
        && (preset.kind === 'bilingual' ? !['government', 'customs'].includes(preset.defaults.vehicleClass) : preset.fields.includes('province'));
      expect(html.includes('aria-label="Province / prefix"'), preset.id).toBe(provinceShown);
      expect(html.includes('aria-label="Governorate"'), preset.id).toBe(preset.fields.includes('governorate'));
      expect(html.includes('aria-label="Year / tag"'), preset.id).toBe(preset.fields.includes('year'));
    }
    const temporary = iraqEditorReducer(createIraqEditorSession('flat-sulaymaniyah'), { type: 'class', classId: 'temporary' });
    expect(renderToStaticMarkup(<IraqCustomizer initialState={temporary.current} />)).toContain('aria-label="Year / tag"');
    const modernTemporary = iraqEditorReducer(createIraqEditorSession('flat-modern-long'), { type: 'class', classId: 'temporary' });
    const html = renderToStaticMarkup(<IraqCustomizer initialState={modernTemporary.current} />);
    expect(html).not.toContain('aria-label="Letter"');
    expect(html).toContain('Governorate code / range');
  });
});
