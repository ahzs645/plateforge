import { describe, expect, it } from 'vitest';
import { createRng } from '../core/random';
import { IRAN_CUSTOM_PRESETS } from './iran-custom-data';
import { iranCustomizerState, renderIranCustom } from './iran-custom-scene';
import { buildIranNumberAudit } from './iran-number-audit';
import { generateIranNumber, iranNumberFormat, validateIranNumberState } from './iran-number-generation';

describe('Iran format-bounded number generation', () => {
  for (const preset of IRAN_CUSTOM_PRESETS) it(`${preset.id}: reproducible full-repertoire generation and preserved context`, () => {
    const state = iranCustomizerState(preset.id), original = JSON.stringify(state);
    const a = createRng(preset.id), b = createRng(preset.id), seen = new Set<string>();
    let current = state;
    for (let index = 0; index < 250; index++) {
      const generated = generateIranNumber(current, a);
      expect(generated).toEqual(generateIranNumber(current, b));
      current = generated;
      expect(validateIranNumberState(generated).errors).toEqual([]);
      for (const digit of generated.serial) seen.add(digit);
      for (const key of ['code', 'year', 'expiry', 'city', 'zone', 'letter', 'bg', 'ink', 'strip', 'fontProfile', 'missingPolicy', 'layout', 'tracking', 'mainScale', 'border'] as const) expect(generated[key], `${preset.id}/${key}`).toBe(state[key]);
      if (preset.kind === 'temporary-old') expect(generated.prefix).toBe(state.prefix);
    }
    const serial = iranNumberFormat(state).numeric[0];
    if (serial.generation === 'random') expect([...seen].sort().join('')).toBe(serial.digits);
    expect(JSON.stringify(state)).toBe(original);
  });

  it('changes repeated one-digit samples without restricting the historical repertoire', () => {
    let state = iranCustomizerState('consular-1960s');
    const seen = new Set<string>();
    for (let index = 0; index < 100; index++) { const next = generateIranNumber(state, index); expect(next.serial).not.toBe(state.serial); seen.add(next.serial); state = next; }
    expect([...seen].sort().join('')).toBe('0123456789');
  });
  it('repairs invalid numeric content but never chooses a new mission identity', () => {
    for (const preset of IRAN_CUSTOM_PRESETS) {
      const state = { ...iranCustomizerState(preset.id), serial: 'bad', prefix: 'bad', code: 'bad', year: 'bad', expiry: 'bad', city: 'bad', zone: 'bad', letter: 'bad' };
      expect(validateIranNumberState(generateIranNumber(state, 'repair')).errors, preset.id).toEqual([]);
    }
    const state = { ...iranCustomizerState('national-diplomatic'), serial: '۰۲۱' };
    expect(generateIranNumber(state, 'mission').serial).toBe('۰۲۱');
    expect(generateIranNumber({ ...state, serial: 'oops' }, 'mission').serial).toBe(iranCustomizerState('national-diplomatic').serial);
    expect(generateIranNumber(state, 'mission').prefix).not.toBe(state.prefix);
  });
  it('rejects unknown presets and letter or allocation combinations outside its stated scope', () => {
    expect(() => generateIranNumber({ ...iranCustomizerState('national-private'), presetId: 'unknown' })).toThrow();
    for (const [id, patch] of [
      ['national-private', { serial: '305' }], ['national-police', { code: '22' }], ['historical-1326', { serial: '12' }],
      ['international-teh', { letter: 'ZZZ' }], ['city-band-commercial', { letter: 'ب' }], ['temporary-old', { prefix: '13' }],
    ] as const) expect(validateIranNumberState({ ...iranCustomizerState(id), ...patch }).errors.length).toBeGreaterThan(0);
    for (const id of ['historical-1342', 'protocol', 'free-zone-old-qeshm']) {
      const state = iranCustomizerState(id); expect(validateIranNumberState({ ...state, serial: '0'.repeat(state.serial.length) }).errors).toEqual([]);
    }
  });
  it('audits every preset and actual alternate render, including all permissible numerals per role', () => {
    const report = buildIranNumberAudit();
    expect(report.presetCount).toBe(53);
    expect(report.totalChecks).toBeGreaterThan(3000);
    const failures = report.presets.filter(preset => !preset.passed).map(preset => ({ id: preset.id, failed: preset.checks.filter(check => !check.pass) }));
    expect(failures).toEqual([]);
    for (const preset of IRAN_CUSTOM_PRESETS) expect(renderIranCustom(generateIranNumber(iranCustomizerState(preset.id), 'final')).errors).toEqual([]);
  });
});
