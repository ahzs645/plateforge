# PlateForge

A Vite 8 + React 19 + TypeScript app that generates realistic license plate serials **and** renders them as plates. It covers all 50 US states and DC, 17 European countries, China and Japan.

Inspired by and partly ported from:

- **license-plate-serial-generator**: US state issuing ranges (bijective base-26 ranges, county codes and so on)
- **license-plate-generator**: EU plate layout and fonts (EuroPlate, UKNumberPlate)
- **china-license-plate-generator**: GA 36 plate kinds (blue, new energy, yellow, 学, 港/澳)
- **japanLicensePlate_Generator**: hiragana series, plate colors
- **react-license-plate**: the EU band component idea

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # generates 400 plates per format and validates each one
npm run build
```

## Features

- Choose a region from the picker (<kbd>⌘K</kbd> or <kbd>/</kbd>) and a format chip, then press **Generate** (or <kbd>Space</kbd> / <kbd>R</kbd>).
- Layout: plate stage with an inspector panel on desktop. On phones: a full-screen region sheet and a sticky bottom bar (copy, generate, save).
- Light, dark or system theme (the button in the top right cycles through them).
- Edit every part of a plate. The form is built from the format's field list, and input is validated live.
- Copy the text, or export a **PNG** (4×) or **SVG**. Fonts are embedded in exports.
- **Batch generator**: one format, a whole group, or everything. Optional seed for reproducible batches. Export to CSV or JSON.
- Shareable links: `#/eu-de/standard`, `#/jp/kei`, and so on.

## Architecture: the standard system

```
src/
  core/
    types.ts      Region → Format → Fields, Template contracts
    pattern.ts    serial pattern DSL (generate + validate)
    format.ts     patternFormat / codedFormat / serialFormat builders
    random.ts     seedable RNG (mulberry32)
    bb26.ts       bijective base-26 ranges (A…Z, AA…)
    registry.ts   registerRegion / registerTemplate / generateBatch
  regions/        data only: us/, europe/, asia/
  templates/      SVG renderers: us, eu, cn, jp
  ui/             React UI: App, RegionPicker, Inspector, BatchView (knows nothing about specific countries)
```

- **Region**: a jurisdiction. It has a `template`, a base `design` and one or more `formats`.
- **Format**: `fields` (editable parts), `generate(rng) → parts`, `validate(parts)`, `text(parts)`, plus optional `design` overrides.
- **Template**: `render({ parts, design, text }) → <svg>`, `size(design)` and `fonts` to embed on export.

The design is merged in this order: `region.design ← format.design ← user overrides`.

### Pattern DSL

| token | meaning |
|---|---|
| `A` | letter A–Z (minus `exclude`) |
| `9` | digit |
| `*` | letter or digit |
| `[A-HJ]` | character class |
| `{name}` | named set from `options.sets` |
| `\x` | literal `x` |
| anything else | literal |

```ts
patternFormat({ id: 'standard', label: 'Standard', pattern: 'AA-999-AA', options: { exclude: 'IOU' } })
```

## Adding a region

Most regions need only a single object and no UI changes:

```ts
// src/regions/europe/index.ts (or a new file registered in src/regions/index.ts)
eu('ro', 'Romania', 'RO', '🇷🇴', [
  codedFormat({
    id: 'standard',
    label: 'Standard',
    code: { key: 'county', label: 'County', values: ['B', 'CJ', 'IS', 'TM'] },
    pattern: ['99 AAA', '999 AAA'],
  }),
]);
```

For rule-heavy formats (for example the US issuing ranges), use `serialFormat({ generate: (rng) => … })`. For multi-part plates (Japan, China), write a `PlateFormat` by hand with several `fields`.

## Adding a plate style

Create `src/templates/<id>.tsx` that exports a `PlateTemplate`, then register it in `src/templates/index.ts`. Use `fit()` and `measure()` from `templates/measure.ts` so text fits using real font metrics.

## Notes

- US serial ranges follow license-plate-serial-generator (late 2019). The state color schemes are approximations.
- CJK characters use system fonts (PingFang, Hiragino, Noto CJK), which also render in PNG exports.
- `src/assets/fonts/EuroPlate.ttf` and `UKNumberPlate.ttf` come from the license-plate-generator reference project. Check their licenses before redistributing.
- Generated plates are for mockups, testing and design. They don't represent real registrations.
