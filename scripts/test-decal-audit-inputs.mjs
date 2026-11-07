import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditDecalArt, auditPrintingProfiles, verifyAuditScene} from './decal-audit-inputs.mjs';

const annual = {year: 1977, digits: 7};
const modern = {year: 2017, digits: 8};
const editor = (decal, input) => ({year: String(decal.year), serial: input.decalSerial || '12345678', month: input.decalMonth || 'JAN', day: '21'});

test('rejects the old 1977 eight-digit typo before editor fallback can hide it', () => {
  assert.throws(() => auditDecalArt(annual, {id: '1977', month: null, control: '70069890'}, () => { throw new Error('editor should not run'); }), /exactly 7 digits/);
});
test('keeps transcribed control strings and leading zeroes exactly', () => {
  const art = auditDecalArt(modern, {id: '2017-jul', month: 'JUL', control: '00000001'}, editor);
  assert.equal(art.serial, '00000001');
  assert.equal(art.month, 'JUL');
  assert.equal(art.day, undefined);
});
test('null controls omit illustrative editor controls, without changing the editor', () => {
  const art = auditDecalArt(modern, {id: 'unknown-control', month: 'JAN', control: null}, editor);
  assert.equal(art.serial, undefined);
  assert.equal(editor(modern, {}).serial, '12345678');
});
test('does not silently normalize missing, numeric or malformed explicit values', () => {
  for (const control of ['20993481 ', '', 20993481]) assert.throws(() => auditDecalArt(modern, {id: '2017', month: 'JAN', control}, editor), /control must/);
  for (const month of ['jan', 'JNA', null]) assert.throws(() => auditDecalArt(modern, {id: '2017', month, control: '20993481'}, editor), /month must/);
  assert.throws(() => auditDecalArt(modern, {id: '2017', month: 'JAN'}, editor), /explicitly supplied/);
});
test('fails on a renderer substitution even when the explicit input is valid', () => {
  assert.throws(() => auditDecalArt(modern, {id: '2017', month: 'JAN', control: '20993481'}, () => ({month: 'JAN', serial: '20093481'})), /substituted control/);
});
test('diagnostic profile rasters retain same-ink outline stroke', () => {
  const profiles = auditPrintingProfiles([{id: 'bc-decal-print-month', params: {stroke: 8}, filledStroke: 2.5, overrides: {A: {fill: true, advance: 60, paths: []}, B: {advance: 70, paths: []}}}]);
  assert.equal(profiles.month.A.filledStroke, 2.5);
  assert.equal(profiles.month.B.stroke, 8);
});
test('printed glyphs must preserve the transcription, even when the label looks correct', () => {
  const reference = {id: '1977', month: null, control: '7006989'};
  const scene = {attrs: {'data-role': 'decal-serial', 'data-die': 'test-profile', 'aria-label': '7006989'}, children: [...'7006989'].map(char => ({attrs: {'data-character': char}, children: []}))};
  assert.deepEqual(verifyAuditScene(scene, reference), {month: null, control: '7006989'});
  scene.children.pop();
  assert.throws(() => verifyAuditScene(scene, reference), /Printed glyphs differ/);
});
