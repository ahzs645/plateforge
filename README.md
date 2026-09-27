# PlateForge

A Vite 8 + React 19 + TypeScript app that generates license plate serials **and** renders them as plates. Editable regions cover all 50 US states and DC, 17 European countries, China, Japan, and historical British Columbia passenger bases.

**Single**, **Batch**, and **Library** are modes of the same application. The reference library is broader than the editable renderer collection: a source photograph is not a finished SVG reconstruction.

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # seeded generator, renderer and reference-snapshot tests
npm run build
```

## Features

- Choose a region with the picker (`⌘K` or `/`), select a format, then press **Generate** (`Space` or `R`). Editable fields validate supported serial formats, not actual registrations.
- Desktop inspector, mobile region sheet and action bar; light, dark or system theme.
- Copy serial text or export PNG (4×) and SVG. Default serials remain live font text; optional procedural lettering exports the serial as paths with text/provenance metadata.
- Seeded batches for one format, a group or all regions; CSV and JSON export.
- British Columbia: **41 passenger presets**, spanning 1940–1985 base systems and selected variants. These include short/long bases, 1951 renewal strips, 1953/54 side tabs, the 1958 centenary and later permanent bases. Paint, dies and fine geometry remain approximate; later renewal boxes are blank.
- B.C. and U.S. serial-lettering choices: default text, semicircular/DIN-style, squarish, oval, and hybrid. These are category-inspired illustrations, not imported official die fonts. Appearance choices persist through Generate.
- **Library** (`#/library`): searchable source collections, page-period filters, paginated image references, source credits and links into available editors. Remote photo previews are off until enabled, and are loaded one visible page at a time.
- **Lettering catalogue**: 70 jurisdiction entries from Leeward's February 2011 survey, with explicit historical dating and exceptions. This does not assign fonts to current state plates or every B.C. year automatically.
- Existing routes remain available, such as `#/eu-de/standard`, `#/jp/kei`, `#/ca-bc/1953`, and `#/ca-bc/1979-first`. Region/format links do not encode edited serials or appearance settings.

## Reference scope

The committed reference snapshot contains 320 parsed BCpl8s pages, including all 20 linked passenger-history chapters, plus ten browser-verified Leeward article-link records. There are 16,474 unique image URLs, not 16,474 distinct plate designs. Supporting documents, people and decorations also occur in source pages.

Thirty discovered B.C. URLs returned 404. The automated Leeward response did not establish usable series coverage; its article records are therefore link-only rather than falsely reported as a full crawl. External archives, unlinked pages, PDF contents and most individual plate reconstructions are outside the verified import. Exact gaps are retained in `public/data/reference-library/coverage-report.json` and displayed in the UI.

Read [reference-library scope and architecture](docs/reference-library.md), [early B.C. reconstruction notes](docs/british-columbia.md), and [lettering controls and limits](docs/lettering.md).

## Architecture

```text
src/
  core/
    types.ts        Region → Format → Fields, Template contracts
    pattern.ts      serial pattern DSL (generate + validate)
    format.ts       patternFormat / codedFormat / serialFormat builders
    random.ts       seedable RNG (mulberry32)
    bb26.ts         bijective base-26 ranges
    registry.ts     registerRegion / registerTemplate / generateBatch
    lettering.ts    optional appearance controls and dated source attribution
  regions/          data and serial rules: us/, europe/, asia/, canada/
  templates/        SVG renderers and shared lettering/scene primitives
  library/          reference schema, validation, filtering, dated classifications
  ui/               App, RegionPicker, Inspector, BatchView, ReferenceLibrary
public/data/reference-library/
  index.json        lightweight page metadata, totals and coverage reports
  pages/*.json      lazy-loaded source-page shards (URLs, not photo files)
scripts/
  import_reference_library.py    bounded, robots-aware metadata importer
  prepare_reference_library.py   snapshot preparation without network access
  lettering-smoke.mjs            production-build browser checks
  reference-library-smoke.mjs    library/navigation/privacy/retry checks
```

A **Region** owns a template, base design and formats. A **Format** owns editable fields, `generate(rng)`, `validate(parts)`, `text(parts)`, optional design overrides and sources. A **Template** renders parts/design/text into an SVG, exposes `size(design, parts?)`, and lists existing font assets used by exports.

Design values merge as `region.design ← format.design ← user overrides`. Source metadata does not automatically create or modify a plate renderer. Library code and JSON are lazy-loaded so the editor does not fetch the whole catalogue at startup.

### Pattern DSL

| Token | Meaning |
|---|---|
| `A` | A–Z, minus `exclude` |
| `9` | Digit |
| `*` | Letter or digit |
| `[A-HJ]` | Character class |
| `{name}` | Named set from `options.sets` |
| `\x` | Literal `x` |
| Anything else | Literal |

```ts
patternFormat({ id: 'standard', label: 'Standard', pattern: 'AA-999-AA', options: { exclude: 'IOU' } })
```

## Adding regions and styles

Most regions need only a data object registered in `src/regions/index.ts`. Use `patternFormat`, `codedFormat`, `serialFormat`, or implement `PlateFormat` directly for multi-part or rule-heavy serial systems. Add a template in `src/templates/` only when existing shared components cannot represent its layout. Use `fit()`/`measure()` for font-based layouts or the shared SVG scene/lettering primitives.

Keep source dates, base years, renewal mechanisms and reconstruction status separate. New reference records must not be labelled editable until a real renderer and validation tests exist. Reuse masters instead of copying drawings for every annual colour change.

## Provenance

Inspired by and partly ported from `license-plate-serial-generator` (U.S. ranges), `license-plate-generator` (European layout/fonts), `china-license-plate-generator`, `japanLicensePlate_Generator`, and the EU-band idea in `react-license-plate`.

B.C. research uses [BCpl8s](https://www.bcpl8s.ca/). Lettering categories and the dated survey use [Leeward Productions](https://www.leewardpro.com/articles/licplatefonts/licplate-fonts-nam-class.html). Source photographs, article bodies and new font binaries are not mirrored by the reference import. Their rights remain with their creators and credited contributors.

## Notes

- Existing U.S. serial ranges follow the upstream generator's late-2019 data; state colour schemes are approximations, not verified current full-art replicas.
- CJK text uses available system fonts.
- Existing `EuroPlate.ttf` and `UKNumberPlate.ttf` assets came from the upstream reference project; check their licences before redistribution.
- Browser tests mock third-party image responses. Passing CI does not verify every remote photograph.
- Generated plates are for mockups, research, testing and design. They do not represent real registrations or official issuance.
