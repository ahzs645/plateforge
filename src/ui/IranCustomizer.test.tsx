import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { captureIranExport, createIranEditorSession, createIranExporter, IranCustomizer, iranActiveFields, iranAvailableClasses, iranAvailableFontProfiles, iranEditorReducer } from './IranCustomizer';
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_CLASSES, IRAN_CUSTOM_CITIES, iranCustomizerState, renderIranCustom } from '../templates/iran-custom-scene';
import { generateIranNumber, validateIranNumberState } from '../templates/iran-number-generation';
import { IRAN_FONT_PROFILES } from '../templates/iran-custom-fonts';
import type { IranCustomState } from '../templates/iran-custom-types';

const first = IRAN_CUSTOM_PRESETS[0].id;
const second = IRAN_CUSTOM_PRESETS[1].id;
describe('Iran immutable editor session', () => {
  it('retains all edit types across repeated selections and round trips', () => {
    let session = createIranEditorSession(first);
    Object.freeze(session.current); Object.freeze(session.saved); Object.freeze(session);
    for (const serial of ['1', '12', '123', '۱۲۳', '1234']) session = iranEditorReducer(session, { type: 'edit', patch: { serial } });
    const patch: Partial<IranCustomState> = { prefix: '33', letter: 'ب', code: '42', city: 'shiraz', year: '1342', expiry: '1405/09', zone: 'kish', fontProfile: 'naskh-candidate', missingPolicy: 'fallback', layout: 'compact', bg: '#123456', ink: '#abcdef', strip: '#112233', mainScale: 0.8, tracking: 5.5, border: false };
    session = iranEditorReducer(session, { type: 'edit', patch });
    const edited = { ...session.current };
    const repeated = iranEditorReducer(session, { type: 'select', presetId: first });
    expect(repeated).toBe(session);
    expect(iranEditorReducer(session, { type: 'select', presetId: 'not-a-preset' })).toBe(session);
    session = iranEditorReducer(session, { type: 'select', presetId: second });
    session = iranEditorReducer(session, { type: 'edit', patch: { serial: '8765' } });
    session = iranEditorReducer(session, { type: 'select', presetId: first });
    expect(session.current).toEqual(edited);
    session = iranEditorReducer(session, { type: 'select', presetId: second });
    expect(session.current.serial).toBe('8765');
  });
  it('restores only the active design and never mutates catalogue defaults', () => {
    let session = createIranEditorSession(first);
    session = iranEditorReducer(session, { type: 'edit', patch: { serial: '8765' } });
    session = iranEditorReducer(session, { type: 'select', presetId: second });
    session = iranEditorReducer(session, { type: 'edit', patch: { serial: '4321' } });
    session = iranEditorReducer(session, { type: 'reset' });
    expect(session.current).toEqual(iranCustomizerState(second));
    session = iranEditorReducer(session, { type: 'select', presetId: first });
    expect(session.current.serial).toBe('8765');
    session = iranEditorReducer(session, { type: 'reset' });
    expect(session.current).toEqual(iranCustomizerState(first));
    expect(IRAN_CUSTOM_PRESETS[0].defaults).toEqual(iranCustomizerState(first));
  });

  it('repeats edit → generate → switch → restore → export for every preset using actual scenes', async () => {
    for (const preset of IRAN_CUSTOM_PRESETS) {
      let session = createIranEditorSession(preset.id);
      const original = { ...session.current };
      session = iranEditorReducer(session, { type: 'edit', patch: { serial: 'invalid', bg: '#123456' } });
      expect(renderIranCustom(session.current).errors.length, preset.id).toBeGreaterThan(0);
      for (let index = 0; index < 3; index++) {
        session = iranEditorReducer(session, { type: 'generate', seed: `${preset.id}/${index}` });
        expect(validateIranNumberState(session.current).errors, preset.id).toEqual([]);
        const scene = renderIranCustom(session.current);
        expect(scene.errors, preset.id).toEqual([]);
        expect(session.current.bg).toBe('#123456');
        const snapshot = captureIranExport(session.current, scene);
        const save = vi.fn(), encode = vi.fn(async (svg: string) => new Blob([svg], { type: 'image/png' })), exporter = createIranExporter(save, encode);
        expect((await exporter.run('svg', snapshot)).status, preset.id).toBe('saved');
        expect(await (save.mock.calls[0][0] as Blob).text()).toBe(scene.svg);
        expect(snapshot.filename).toContain(session.current.serial);
        expect((await exporter.run('png', snapshot)).status, preset.id).toBe('saved');
        expect(encode).toHaveBeenCalledWith(scene.svg, scene.width, scene.height, 4);
        expect(save.mock.calls[1][1]).toBe(`${snapshot.filename}.png`);
        expect(await (save.mock.calls[1][0] as Blob).text()).toBe(scene.svg);
      }
      const generated = { ...session.current };
      const other = IRAN_CUSTOM_PRESETS.find(item => item.id !== preset.id)!.id;
      session = iranEditorReducer(session, { type: 'select', presetId: other });
      session = iranEditorReducer(session, { type: 'select', presetId: preset.id });
      expect(session.current).toEqual(generated);
      session = iranEditorReducer(session, { type: 'reset' });
      expect(session.current).toEqual(original);
      expect(renderIranCustom(session.current).svg).toBe(renderIranCustom(original).svg);
      expect(generateIranNumber(original, 'seed')).toEqual(generateIranNumber(original, 'seed'));
    }
  });
  it('class selection applies its palette without dropping unrelated edits', () => {
    let session = createIranEditorSession(first);
    session = iranEditorReducer(session, { type: 'edit', patch: { serial: '4567', city: 'shiraz', tracking: 4 } });
    for (const vehicleClass of IRAN_CUSTOM_CLASSES) {
      session = iranEditorReducer(session, { type: 'class', classId: vehicleClass.id });
      expect(session.current).toMatchObject({ vehicleClass: vehicleClass.id, bg: vehicleClass.bg, ink: vehicleClass.ink, serial: '4567', city: 'shiraz', tracking: 4 });
    }
  });
});

describe('Iran editor rendering and field scope', () => {
  it('renders every preset with exactly its applicable content fields', () => {
    const fields = { serial: 'Serial', prefix: 'Number prefix', letter: 'Series letter', code: 'Allocation code', year: 'Year · Solar Hijri (SH)', expiry: 'Expiry · Solar Hijri (SH) year/month', city: 'City · whole-word form', zone: 'Free zone' } as const;
    for (const preset of IRAN_CUSTOM_PRESETS) {
      const state = iranCustomizerState(preset.id);
      const html = renderToStaticMarkup(<IranCustomizer initialState={state} />);
      const active = iranActiveFields(state);
      expect(html).toContain('data-testid="iran-preview"');
      expect(html).toContain('data-canonical="true"');
      for (const [key, label] of Object.entries(fields)) expect(html.includes(`aria-label="${label}"`), `${preset.id}: ${key}`).toBe(active.has(key as keyof IranCustomState));
      expect(html).toContain('Missing glyph policy');
      expect(html).toContain('Source layout');
      expect(html).toContain('Save SVG');
      expect(html).toContain('Generate valid number');
      expect(html).toContain('does not confirm a real registration');
    }
  });
  it('does not offer ignored letters, incompatible classes or non-working font choices', () => {
    const national = IRAN_CUSTOM_PRESETS.find(preset => preset.kind === 'national')!;
    const state = iranCustomizerState(national.id);
    expect(iranActiveFields({ ...state, vehicleClass: 'private' }).has('letter')).toBe(true);
    for (const vehicleClass of iranAvailableClasses(state)) {
      expect(IRAN_CUSTOM_PRESETS.some(preset => preset.kind === 'national' && preset.defaults.vehicleClass === vehicleClass.id)).toBe(true);
      if (vehicleClass.id !== 'private') expect(iranActiveFields({ ...state, vehicleClass: vehicleClass.id }).has('letter')).toBe(false);
    }
    for (const preset of IRAN_CUSTOM_PRESETS) {
      const choices = iranAvailableFontProfiles(iranCustomizerState(preset.id));
      expect(choices.length).toBeGreaterThan(0);
      expect(choices.some(profile => profile.id === preset.defaults.fontProfile), preset.id).toBe(true);
      expect(choices.every(profile => profile.script === (['international', 'observer'].includes(preset.kind) ? 'latin' : 'persian'))).toBe(true);
    }
  });
  it('city names use supplied whole-word choices instead of isolated character input', () => {
    const preset = IRAN_CUSTOM_PRESETS.find(item => item.fields.includes('city'))!;
    const html = renderToStaticMarkup(<IranCustomizer initialState={iranCustomizerState(preset.id)} />);
    expect(html).toContain('<select aria-label="City · whole-word form"');
    for (const city of IRAN_CUSTOM_CITIES) expect(html).toContain(`value="${city.id}"`);
    expect(html).not.toContain('<input aria-label="City · whole-word form"');
  });
  it('renders inferred numeral completions explicitly without enabling fallback', () => {
    const state = iranCustomizerState(first);
    const profile = IRAN_FONT_PROFILES[state.fontProfile];
    const inferredDigit = Object.entries(profile.glyphs).find(([, glyph]) => glyph.provenance === 'inferred')?.[0];
    expect(inferredDigit).toBeDefined();
    const edited = { ...state, serial: inferredDigit!.repeat(state.serial.length), missingPolicy: 'strict' as const };
    const scene = renderIranCustom(edited);
    expect(scene.errors).toEqual([]);
    expect(scene.svg).toContain('data-provenance="inferred"');
    const html = renderToStaticMarkup(<IranCustomizer initialState={edited} />);
    expect(html).toContain('Inferred numeral completion');
    expect(html).toContain('not observed in the cited specimen');
    expect(html).not.toContain('disabled="">Save SVG');
  });
  it('makes historical city coverage boundaries visible and requires explicit fallback for an absent word', () => {
    const state = iranCustomizerState('full-city-1964');
    const profile = IRAN_FONT_PROFILES[state.fontProfile];
    const otherCity = IRAN_CUSTOM_CITIES.find(city => !profile.wordmarks[city.id])!;
    expect(otherCity).toBeDefined();
    const edited = { ...state, city: otherCity.id };
    const html = renderToStaticMarkup(<IranCustomizer initialState={edited} />);
    expect(html).toContain('requires fallback or another profile');
    expect(html).toContain('disabled="">Save SVG');
    expect(renderIranCustom(edited).errors.length).toBeGreaterThan(0);
    expect(renderIranCustom({ ...edited, missingPolicy: 'fallback' }).errors).toEqual([]);
  });
  it('strict invalid input displays errors and disables both exports', () => {
    const state = { ...iranCustomizerState(first), serial: '🙂', missingPolicy: 'strict' as const };
    const scene = renderIranCustom(state);
    expect(scene.errors.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(<IranCustomizer initialState={state} />);
    expect(html).toContain('Export is blocked until the errors below are resolved.');
    expect(html).toContain('disabled="">Save SVG');
    expect(html).toContain('disabled="">Save PNG');
  });
});

describe('Iran export snapshot and async lock', () => {
  const scene = { svg: '<svg><path d="M1 1L2 2"/></svg>', width: 340, height: 130, errors: [] as string[], warnings: ['Candidate font'] };
  it('captures an immutable scene and filename before later state edits', () => {
    const state = iranCustomizerState(first);
    const snapshot = captureIranExport(state, scene);
    state.serial = '9999'; scene.warnings.push('Later notice');
    expect(snapshot.filename).not.toContain('9999');
    expect(snapshot.warnings).toEqual(['Candidate font']);
    scene.warnings.pop();
  });
  it('blocks errors and missing scenes without invoking encoders or download', async () => {
    const save = vi.fn(), encode = vi.fn();
    const exporter = createIranExporter(save, encode);
    const input = captureIranExport(iranCustomizerState(first), scene);
    expect((await exporter.run('png', { ...input, errors: ['Missing outline'] })).status).toBe('blocked');
    expect((await exporter.run('svg', { ...input, svg: '' })).status).toBe('blocked');
    expect(save).not.toHaveBeenCalled(); expect(encode).not.toHaveBeenCalled(); expect(exporter.isBusy()).toBe(false);
  });
  it('prevents overlapping exports and saves the originally captured PNG', async () => {
    let finish!: (blob: Blob) => void;
    const encode = vi.fn(() => new Promise<Blob>(resolve => { finish = resolve; }));
    const save = vi.fn();
    const exporter = createIranExporter(save, encode);
    const input = captureIranExport(iranCustomizerState(first), scene);
    const originalFilename = input.filename;
    const pending = exporter.run('png', input);
    expect(exporter.isBusy()).toBe(true);
    expect((await exporter.run('svg', input)).status).toBe('busy');
    input.svg = '<svg/>'; input.filename = 'later-edit'; input.width = 1;
    finish(new Blob(['PNG']));
    expect((await pending).status).toBe('saved');
    expect(encode).toHaveBeenCalledWith(scene.svg, 340, 130, 4);
    expect(save).toHaveBeenCalledWith(expect.any(Blob), `${originalFilename}.png`);
    expect(exporter.isBusy()).toBe(false);
  });
  it('releases the lock after failure and permits a real SVG retry', async () => {
    const save = vi.fn();
    const exporter = createIranExporter(save, async () => { throw new Error('Test rasterization failure'); });
    const input = captureIranExport(iranCustomizerState(first), scene);
    expect(await exporter.run('png', input)).toMatchObject({ status: 'failed', message: expect.stringContaining('Test rasterization failure') });
    expect(exporter.isBusy()).toBe(false);
    expect((await exporter.run('svg', input)).status).toBe('saved');
    expect(await (save.mock.calls[0][0] as Blob).text()).toBe(scene.svg);
  });
});
