/**
 * Samples, prototypes, props and reproductions (BCpl8s Sample, Prototype,
 * Movie Props and Reproductions pages). Most reuse an issued base with the
 * serial documented for that item; none are issued registrations.
 */
import type { Design, Parts, PlateEra, PlateFamily, PlateFormat, PlateStatus } from '../../core/types';
import type { KitRecipe } from '../../templates/bc/kit';
import '../../templates/bc/art-samples';
import { createRng } from '../../core/random';
import { BC_AK, kitFormat } from './bc-kit';

const page = (name: string, file = `${name}.htm`) => ({ title: `BCpl8s · ${name.replace('-', ' ')}`, url: `https://www.bcpl8s.ca/${file}` });
const SAMPLES = page('Sample'), PROTOTYPE = page('Prototype'), MOVIES = page('Movie-Props'), REPRO = page('Reproductions');

export const BC_SAMPLE_FAMILIES: PlateFamily[] = [
  { id: 'samples', label: 'Samples, prototypes & props', summary: 'Official samples, unissued designs, film props and reproductions — none are issued registrations.' },
];
export const BC_SAMPLE_ERAS: PlateEra[] = [];

interface SampleSpec {
  id: string; label: string; base: string; status: PlateStatus; period: [number, number];
  /** The serials documented for this item, offered as a list. */
  serials: readonly string[];
  /** Other parts fixed by the item (e.g. a loose sample strip). */
  fixed?: Parts;
  design?: Design;
  description: string;
  source: { title: string; url: string };
}

/** Wraps an issued format: same drawing, the documented serials only, and a status badge. */
function sample(base: PlateFormat, s: SampleSpec): PlateFormat {
  const reference = base.generate(createRng(`sample:${s.id}`));
  const fixedKeys = new Set(['serial', ...Object.keys(s.fixed ?? {})]);
  return {
    id: s.id, label: s.label, family: 'samples', status: s.status, period: s.period,
    pattern: s.serials.join(' / '), description: s.description,
    references: [s.source, ...(base.references ?? [])],
    design: { ...base.design, ...s.design },
    fields: [{ key: 'serial', label: 'Serial', options: s.serials.map((v) => ({ value: v, label: v })) },
      ...base.fields.filter((f) => !fixedKeys.has(f.key))],
    generate: (rng) => ({ ...base.generate(rng), ...s.fixed, serial: rng.pick(s.serials) }),
    validate: (parts) => {
      if (!s.serials.includes(parts.serial ?? '')) return `Documented serials: ${s.serials.join(', ')}.`;
      // Check the remaining appearance fields against the base, with its own serial.
      const probe: Parts = { ...parts };
      for (const key of fixedKeys) probe[key] = reference[key];
      return base.validate?.(probe) ?? null;
    },
    text: (parts) => base.text?.(parts) ?? parts.serial ?? '',
  };
}
const SPECS: SampleSpec[] = [
  { id: 'sample-1940', label: '1940 · sample 00-000', base: '1940', status: 'official-sample', period: [1940, 1940], serials: ['00-000'], source: SAMPLES,
    description: 'Official samples of 1924–1950 used the year’s regular design with an all-zero serial: five zeros from 1936 to 1948. BCpl8s notes the 1940 zeros look pear-shaped; the die here draws standard zeros.' },
  { id: 'sample-1951-strip', label: '1951 · sample strip', base: '1951', status: 'official-sample', period: [1951, 1951], serials: ['00-000'], fixed: { renewal: 'loose', tabSerial: '000000' }, source: SAMPLES,
    description: 'No 1951 sample plate was made; instead a validation strip carried a 000000 registration number. Shown on its own.' },
  { id: 'sample-1955', label: '1955 · sample 000·000', base: '1955', status: 'official-sample', period: [1955, 1969], serials: ['000-000'], source: SAMPLES,
    description: 'From 1955 to 1969 samples read 000·000 on the year’s regular base (the 1957 oddball has five zeros).' },
  { id: 'sample-1964', label: '1964 · sample 000·000', base: '1964', status: 'official-sample', period: [1964, 1964], serials: ['000-000'], design: { rawSerial: true }, source: SAMPLES,
    description: 'A BEAUTIFUL-era sample with the all-zero serial.' },
  { id: 'sample-1970-000', label: '1970 · “000” plates', base: '1970-1972', status: 'uncertain', period: [1970, 1972], serials: ['CGC-000', 'KMS-000'], design: { rawSerial: true }, source: SAMPLES,
    description: 'About 1,000 sets were made with 000 numbers in error; BCpl8s suspects the Motor Vehicle Branch handed them out as samples.' },
  { id: 'souvenir-1970-expo', label: '1970 · Expo 70 souvenir', base: '1970-1972', status: 'souvenir', period: [1970, 1970], serials: ['1970'], design: { rawSerial: true }, source: SAMPLES,
    description: 'Not a sample: a souvenir given to attendees at the 1970 World’s Fair in Osaka, on the 1970 base with the serial 1970.' },
  { id: 'sample-1973', label: '1973 · sample SAM·000', base: '1973-1974', status: 'official-sample', period: [1973, 1978], serials: ['SAM-000'], design: { rawSerial: true }, source: SAMPLES,
    description: 'Samples were generally not distributed in this era; SAM·000 and 000 000 examples are known.' },
  { id: 'sample-1979', label: '1979 · sample SAM-PLE', base: '1979-first', status: 'official-sample', period: [1979, 1986], serials: ['SAM-PLE'], design: { rawSerial: true }, source: SAMPLES,
    description: 'White on blue 1979 base reading SAM-PLE. A 1985 sample decal exists but is very rare.' },
  { id: 'sample-flag', label: 'Flag base · sample SAM-PLE', base: '1985-flag', status: 'official-sample', period: [1985, 2014], serials: ['SAM-PLE'], source: SAMPLES,
    description: 'Flag-base samples: Type I early Astrographic dies (1985–86), Type II Classic Astrographic (1986–2003), Type III Waldale (2003 on) — choose the die. Sample decals read SAMPLE with a zero serial.' },
  { id: 'souvenir-bc0000', label: 'Flag base · BC-0000 souvenir', base: '1985-flag', status: 'souvenir', period: [1985, 2002], serials: ['BC-0000'], source: SAMPLES,
    description: 'A souvenir stamped on the truck base with the serial BC-0000; phased out in November 2002 in favour of genuine SAMPLE plates.' },
  { id: 'prototype-1964-colours', label: '1963 base · 1964 colours test', base: '1963', status: 'prototype', period: [1963, 1963], serials: ['000-000'], design: { background: '#f2f1e9', ink: '#20538e' }, source: PROTOTYPE,
    description: 'Paint-test plate: a 1963 base painted blue on white, the colours chosen for 1964.' },
  { id: 'prototype-1968-paint', label: '1968 · orange paint test', base: '1968', status: 'prototype', period: [1968, 1968], serials: ['000-000'], design: { background: '#f4f2ea', ink: '#e0611f', rawSerial: true }, source: PROTOTYPE,
    description: 'Paint test: 19 BEAUTIFUL 68 in orange on white, a colour scheme that was not issued.' },
  { id: 'prop-1959-repro', label: '1959 · film repaint', base: '1959', status: 'prop', period: [1959, 1959], serials: ['138-388'], design: { background: '#5a2328', ink: '#77d6c4' }, source: MOVIES,
    description: 'A repainted 1959 plate used as a film prop (My American Cousin); the aqua is brighter than the original turquoise.' },
  { id: 'prop-flag-xqz', label: 'Flag base · film prop XQZ', base: '1985-flag', status: 'prop', period: [1985, 2017], serials: ['XQZ-134'], source: MOVIES,
    description: 'Film and TV props are recognisable by letters B.C. never issued (Q, Z, I).' },
  { id: 'reproduction-1920', label: '1920 · Thai reproduction', base: '1920', status: 'reproduction', period: [1920, 1920], serials: ['2019'], source: REPRO,
    description: 'A Thai-made replica of the 1920 base (embossed painted steel). Replicas of 1913–17, 1919 and 1921 use a printed sticker on tin instead.' },
];

// ── Unissued designs with their own artwork ───────────────────────────────
const proto = (id: string, label: string, r: Omit<KitRecipe, 'id' | 'label' | 'width' | 'height' | 'radius' | 'embossed' | 'source' | 'note'>): KitRecipe =>
  ({ id: `proto-${id}`, label, width: 300, height: 150, radius: 7, embossed: true, source: PROTOTYPE, note: 'Unissued prototype, redrawn approximately from a BCpl8s photograph.', ...r });
const PROTOTYPES: PlateFormat[] = [
  kitFormat({ id: 'prototype-super-natural', label: '1980 · “Super, Natural” proposal', family: 'samples', status: 'prototype', period: [1980, 1980],
    recipe: proto('super-natural', '“Super, Natural” proposal', { background: '#f7ddd2', ink: '#3f7a5a', rim: { inset: 4, width: 1.2 }, holes: 'slots', holeAt: { x: [0.21, 0.79], y: [0.1, 0.9] },
      art: [{ art: 'proto-super-natural', x: 0, y: 0, width: 300, height: 150 }], legends: [],
      fontLegends: [{ text: 'Super, Natural', x: 150, baseline: 27, size: 17, font: 'serif', color: '#3f7a5a', role: 'slogan' },
        { text: 'British', x: 55, baseline: 136, size: 15, font: 'sans', color: '#3f7a5a', role: 'province-left' },
        { text: 'Columbia', x: 245, baseline: 136, size: 15, font: 'sans', color: '#3f7a5a', role: 'province-right' }],
      serial: { x: 150, baseline: 110, cap: 72, maxWidth: 270, die: 'bc-acme-1979' }, decal: { x: 108, y: 116, width: 84, height: 27, rx: 2 } }),
    grammar: { sets: { a: BC_AK }, hint: 'AAA-999', blocks: [{ pattern: '{a}{a}{a}-999' }] },
    description: 'A 1980 proposal replacing BEAUTIFUL with the “Super, Natural” tourism slogan, green on pale pink with mountain silhouettes (known example CAJ-978). Not issued.' }),
  kitFormat({ id: 'prototype-dogwood', label: 'Dogwood proposal', family: 'samples', status: 'prototype', period: [1985, 1995],
    recipe: proto('dogwood', 'Dogwood proposal', { background: '#f4f2ea', ink: '#1fa69b', rim: { inset: 4, width: 1.2, color: '#c9c6bb' }, holes: 'slots', holeAt: { x: [0.21, 0.79], y: [0.08, 0.92] },
      art: [{ art: 'proto-dogwood', x: 95, y: 18, width: 110, height: 110 }],
      legends: [{ text: 'BEAUTIFUL', x: 150, baseline: 18, cap: 9, die: 'bc-legend-light', color: '#c8342c', role: 'slogan' }],
      fontLegends: [{ text: 'British Columbia', x: 150, baseline: 128, size: 24, font: 'serif', italic: true, weight: 700, color: '#c8342c', role: 'province' },
        { text: 'IS ALL THINGS TO ALL PEOPLE', x: 150, baseline: 142, size: 8, font: 'serif', color: '#c8342c', role: 'motto' }],
      serial: { x: 150, baseline: 100, cap: 64, maxWidth: 270, die: 'bc-astro-4', separator: { kind: 'gap' } } }),
    grammar: { hint: '000 000', blocks: [{ pattern: '000-000' }] },
    description: 'An unissued design with a large yellow dogwood behind a teal 000 000 serial and a script “British Columbia” with “IS ALL THINGS TO ALL PEOPLE”.' }),
  kitFormat({ id: 'prototype-a-new-bc', label: '“A NEW BC” proposal', family: 'samples', status: 'prototype', period: [1990, 1999],
    recipe: proto('a-new-bc', '“A NEW BC” proposal', { background: '#eef1f2', ink: '#1b1f22', rim: { inset: 4, width: 1.2, color: '#c9d0d5' }, holes: 'slots', holeAt: { x: [0.21, 0.79], y: [0.1, 0.9] },
      art: [{ art: 'proto-whale-tail', x: 105, y: 108, width: 90, height: 38 }], legends: [],
      fontLegends: [{ text: 'British Columbia', x: 150, baseline: 28, size: 22, font: 'sans', italic: true, weight: 700, color: '#4a6f8a', role: 'province' }],
      serial: { x: 150, baseline: 102, cap: 58, maxWidth: 270, die: 'bc-waldale', separator: { kind: 'gap' } } }),
    grammar: { hint: 'A NEW BC', blocks: [{ pattern: '\\A NEW BC' }] },
    description: 'A 1990s proposal reading A NEW BC above a whale tail. Not issued.' }),
];

export function bcSampleFormats(baseById: (id: string) => PlateFormat | undefined): PlateFormat[] {
  return [...SPECS.flatMap((s) => { const base = baseById(s.base); return base ? [sample(base, s)] : []; }), ...PROTOTYPES];
}
