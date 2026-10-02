import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRng } from '../../core/random';
import { buildTimeline, familyOf, regionFamilies } from '../../core/timeline';
import { iran } from './iran';
import { IRAN_FREE_ZONES, IRAN_PRIVATE_LETTERS } from './iran-data';
import { irTemplate } from '../../templates/ir';
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_ZONES } from '../../templates/iran-custom-data';
import { iranCustomizerState, renderIranCustom } from '../../templates/iran-custom-scene';
import { IRAN_APPEARANCE_FIELDS, iranStateForPlate, iranSvgBody } from '../../templates/iran-region-bridge';

const format = (id: string) => iran.formats.find((f) => f.id === id)!;

describe('Iran source presets in the ordinary application registry', () => {
  it('keeps every original route and exposes every source-backed preset', () => {
    const original = ['private', 'accessible', 'taxi', 'public', 'agricultural', 'government', 'police', 'irgc', 'army', 'defence', 'staff', 'diplomatic', 'service'].map((id) => `national-${id}`);
    for (const id of [...original, 'protocol', 'motorcycle', 'free-zone-study', ...IRAN_CUSTOM_PRESETS.map((p) => p.id)]) expect(format(id), id).toBeDefined();
    expect(iran.formats).toHaveLength(IRAN_CUSTOM_PRESETS.length + 1);
    expect(new Set(iran.formats.map((f) => f.id)).size).toBe(iran.formats.length);
    expect(regionFamilies(iran).flatMap((family) => family.formats)).toHaveLength(iran.formats.length);
  });

  for (const recipe of iran.formats) {
    it(`${recipe.id}: seeded valid generation renders through the same canonical scene`, () => {
      const a = createRng(`bridge/${recipe.id}`), b = createRng(`bridge/${recipe.id}`);
      const design = { ...iran.design, ...recipe.design };
      for (let index = 0; index < 20; index++) {
        const parts = recipe.generate(a);
        expect(parts).toEqual(recipe.generate(b));
        expect(recipe.validate?.(parts)).toBeNull();
        const state = iranStateForPlate(design, parts)!;
        expect(state, recipe.id).toBeDefined();
        const scene = renderIranCustom(state);
        expect(scene.errors, recipe.id).toEqual([]);
        expect(scene.svg).not.toMatch(/<text\b|<image\b|<script\b|<foreignObject\b|NaN|Infinity|undefined/);
        expect(scene.svg).not.toContain('data-provenance="unsupported"');
        expect(irTemplate.size(design, parts)).toEqual({ width: scene.width, height: scene.height });
        const svg = renderToStaticMarkup(irTemplate.render({ parts, design, text: recipe.text?.(parts) ?? '' }));
        expect(svg).toContain(iranSvgBody(scene.svg));
        expect(svg.match(/<svg\b/g)).toHaveLength(1);
        expect(svg).toContain(`data-preset="${state.presetId}"`);
        expect(svg).toContain(`viewBox="0 0 ${scene.width} ${scene.height}"`);
      }
    });
  }

  it('keeps appearance controls separate from identifiers and through Generate', () => {
    for (const recipe of iran.formats) for (const field of recipe.fields) {
      expect((IRAN_APPEARANCE_FIELDS as readonly string[]).includes(field.key), `${recipe.id}/${field.key}`).toBe(!!field.preserveOnGenerate);
      expect(field.key).not.toBe('vehicleClass');
      expect(field.key).not.toBe('presetId');
    }
    const recipe = format('national-private'), parts = { prefix: '12', letter: 'ب', serial: '345', code: '11' };
    const plain = iranStateForPlate(recipe.design!, parts)!;
    // Inspector edits arrive as strings in Parts; class data is never taken from Parts or Design.
    expect(iranStateForPlate(recipe.design!, { ...parts, bg: '#000000', layout: 'compact', tracking: '5', border: 'off', vehicleClass: 'army' }))
      .toEqual({ ...plain, bg: '#000000', layout: 'compact', tracking: 5, border: false });
    expect(iranStateForPlate(recipe.design!, { ...parts, tracking: 'wide', border: 'false', mainScale: '' })).toEqual(plain);
    const changed = iranStateForPlate({ ...recipe.design, serial: '999', vehicleClass: 'army', bg: '#abcdef', layout: 'compact', tracking: 5, border: false }, parts)!;
    expect(changed).toMatchObject({ serial: '345', vehicleClass: 'private', bg: '#abcdef', layout: 'compact', tracking: 5, border: false });
    expect(irTemplate.size(recipe.design!, { ...parts, layout: 'compact' })).toEqual({ width: 320, height: 160 });
    expect(iranStateForPlate({ ...recipe.design, border: 'false', tracking: '5' }, parts)).toEqual(plain);
    expect(recipe.validate?.({ ...recipe.generate(createRng('ink')), ink: 'url(#x)' })).toMatch(/colour|color/i);
  });

  it('preserves legacy mission semantics and every selectable private letter', () => {
    for (const id of ['national-diplomatic', 'national-service']) {
      const recipe = format(id), parts = recipe.generate(createRng(id));
      expect(parts.serial).toBeUndefined();
      expect(parts.mission).toBe('214');
      expect(iranStateForPlate(recipe.design!, parts)?.serial).toBe('214');
      expect(iranStateForPlate(recipe.design!, { ...parts, mission: '۰۲۱' })?.serial).toBe('۰۲۱');
      expect(recipe.validate?.({ ...parts, code: '22' })).not.toBeNull();
    }
    const recipe = format('national-private');
    for (const letter of IRAN_PRIVATE_LETTERS) {
      const parts = { prefix: '۱۲', letter, serial: '۳۴۵', code: '۱۰' };
      expect(recipe.validate?.(parts)).toBeNull();
      expect(renderIranCustom(iranStateForPlate(recipe.design!, parts)!).errors).toEqual([]);
    }
    for (const letter of ['ه', 'هـ']) {
      const state = iranStateForPlate(recipe.design!, { prefix: '12', letter, serial: '345', code: '11' })!;
      expect(state.letter).toBe('هـ');
      expect(renderIranCustom(state).svg).toContain('aria-label="هـ"');
    }
  });

  it('maps all seven legacy zone labels to the matching new composition', () => {
    const recipe = format('free-zone-study');
    for (const zone of IRAN_FREE_ZONES) {
      const parts = { zone, serial: '12345' };
      expect(recipe.validate?.(parts)).toBeNull();
      const state = iranStateForPlate(recipe.design!, parts)!;
      expect(state.zone).toBe(zone.toLowerCase());
      expect(state.presetId).toBe(`free-zone-old-${zone.toLowerCase()}`);
      expect(renderIranCustom(state).errors).toEqual([]);
    }
    for (const zone of IRAN_CUSTOM_ZONES) {
      const state = iranStateForPlate({ customPreset: 'free-zone-old-qeshm' }, { zone: zone.id, serial: '12345' })!;
      expect(state.presetId).toBe(`free-zone-old-${zone.id}`);
    }
  });

  it('offers only supported default-profile characters and complete wordmarks', () => {
    for (const recipe of iran.formats) for (const field of recipe.fields.filter((f) => ['letter', 'city', 'zone'].includes(f.key))) {
      for (const option of field.options ?? []) {
        const parts = { ...recipe.generate(createRng(recipe.id)), [field.key]: option.value };
        expect(recipe.validate?.(parts), `${recipe.id}/${field.key}/${option.value}`).toBeNull();
        expect(renderIranCustom(iranStateForPlate(recipe.design!, parts)!).errors, `${recipe.id}/${field.key}/${option.value}`).toEqual([]);
      }
    }
  });

  it('validates expiry and earlier month fields without inventing allocations', () => {
    const temporary = format('temporary'), parts = temporary.generate(createRng('temporary'));
    expect(temporary.validate?.({ ...parts, expiry: '۱۴۰۵/۰۷' })).toBeNull();
    for (const expiry of ['1405/00', '1405/13', '2026/07', '1405/<script>']) expect(temporary.validate?.({ ...parts, expiry })).not.toBeNull();
    expect(temporary.validate?.({ ...parts, code: '99' })).toBeNull();
    expect(temporary.validate?.({ ...parts, prefix: '01' })).not.toBeNull();
    const old = format('temporary-old'), oldParts = old.generate(createRng('old'));
    expect(old.validate?.({ ...oldParts, prefix: '12' })).toBeNull();
    for (const prefix of ['0', '13', 'abc']) expect(old.validate?.({ ...oldParts, prefix })).not.toBeNull();
    expect(format('full-city-gilan').fields.map((f) => f.key)).not.toContain('prefix');
  });

  it('escapes hostile Parts and exposes unsupported edits in canonical metadata', () => {
    const recipe = format('full-city-1964'), attack = '"><script>alert(1)</script><image href="https://bad.test">';
    const parts = { ...recipe.generate(createRng('attack')), serial: attack, city: attack };
    expect(recipe.validate?.(parts)).not.toBeNull();
    const scene = renderIranCustom(iranStateForPlate({ ...recipe.design, ink: 'url(https://bad.test)' }, parts)!);
    expect(scene.errors.length).toBeGreaterThan(0);
    expect(scene.svg).not.toMatch(/<script\b|<image\b|fill="url\(/);
    expect(scene.svg).toContain('&lt;script&gt;');
    expect(iranSvgBody(scene.svg)).not.toMatch(/^<svg\b/);
    expect(() => iranSvgBody('not an svg')).toThrow();
    expect(iranStateForPlate({}, parts)).toBeUndefined();
    expect(iranStateForPlate({ customPreset: 'unknown' }, parts)).toBeUndefined();
    expect(iranCustomizerState('free-zone-study').presetId).toBe('free-zone-old-qeshm');
  });
});

describe('Iran chronology in the ordinary timeline', () => {
  it('includes historical, parallel and national evidence without a fabricated 1979 split', () => {
    const domestic = buildTimeline(iran, 'civilian')!;
    expect(domestic.order.map(({ format: f }) => f.id)).toContain('historical-1326');
    expect(domestic.order.map(({ format: f }) => f.id)).toContain('national-private');
    expect(domestic.eras.some((era) => era.period[0] === 1979)).toBe(false);
    expect(format('historical-1326').period).toEqual([1947, 1948]);
    expect(format('national-private').period).toEqual([2004, 2026]);
    expect(format('national-public').period).toEqual([2004, 2026]);
    expect(format('national-diplomatic').description).toContain('April–May 2016');
    expect(familyOf(iran, format('public-2002'))).toBe('parallel-transport');
    expect(familyOf(iran, format('international-teh'))).toBe('foreign-travel');
    expect(familyOf(iran, format('us-military'))).toBe('foreign-forces');
    for (const family of regionFamilies(iran)) {
      const timeline = buildTimeline(iran, family.id);
      if (!timeline) continue;
      expect(timeline.order).toHaveLength(family.formats.filter((f) => f.period).length);
      const years = timeline.order.map((entry) => entry.period[0]);
      expect(years).toEqual([...years].sort((a, b) => a - b));
    }
  });

  it('does not convert grouping sort years or known successors into issue dates', () => {
    for (const id of ['old-government', 'protocol', 'motorcycle', 'temporary', 'temporary-old', 'diplomatic-old', 'service-old', 'historic-vehicle', 'free-zone-old-kish', 'national-accessible', 'national-taxi', 'national-agricultural', 'national-government']) {
      expect(format(id).period, id).toBeUndefined();
    }
    expect(iran.gaps?.map((gap) => gap.id)).toEqual(['earliest-registration', 'free-zone-2017']);
    expect(iran.gaps?.find((gap) => gap.id === 'free-zone-2017')?.note).toContain('generic placeholder');
  });
});
