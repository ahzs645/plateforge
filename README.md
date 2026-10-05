# PlateForge

A Vite 8 + React 19 + TypeScript app that generates license plate serials **and** renders them as plates. Editable regions cover all 50 US states, DC and Puerto Rico, all 13 Canadian provinces and territories (British Columbia in historical depth), 18 European countries, China, Japan, South Korea, Vietnam, Iraq, Iran, Costa Rica, and the Mercosur countries Brazil, Argentina, Uruguay and Paraguay.

**Single**, **Gallery**, **Batch**, and **Library** are modes of the same application. The reference library is broader than the editable renderer collection: a source photograph is not a finished SVG reconstruction.

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # seeded generator, renderer and reference-snapshot tests
npm run build
```

## Features

- Choose a region with the picker (`⌘K` or `/`). The picker is organised continent → country → state/province, with a country filter row; select a format, then press **Generate** (`Space` or `R`). Editable fields validate supported serial formats, not actual registrations.
- Desktop inspector, mobile region sheet and action bar; light, dark or system theme. On phones the plate details open as a bottom sheet: it peeks above the action bar, and you drag or tap its handle to expand it. The region picker keeps its layout still while you hover or use the arrow keys, and the format timeline only scrolls when the selected plate is off-screen.
- Copy serial text or export PNG (4×) and SVG. Default serials remain live font text; optional procedural lettering exports the serial as paths with text/provenance metadata.
- **Save for Tesla** exports a 400×200 PNG (400×100 for plates 3:1 or wider), fitted with transparent padding. Copy it to a `LicensePlate` folder on the car's USB drive.
- **Families and timelines**: regions can group formats into families (B.C. has 16). Each family's dated formats form a filmstrip grouped into eras; step through with `←`/`→`.
- **Gallery** (`#/gallery/<region>`): every design for the current country as thumbnails, laid out era-by-era when a timeline exists; switch to the whole continent to see countries side by side. The search and filter bar stays pinned while you scroll; on phones the filters fold behind a toggle.
- Seeded batches for one format, a country, a continent or all regions; CSV and JSON export.
- Canada · Federal plates: **35 designs**, including Fisheries, domestic military, Canadian Forces in France/Germany, attachments and boosters. [41 photographic comparisons](https://projects.ahmadjalil.com/plateforge/federal-reference-review/) distinguish source-caption dates, undated examples and candidate lettering. [Source inventory and limits](docs/research/canada-federal/README.md).
- British Columbia: **446 designs in 16 families**, 1901–2026: passenger (1904 leather to the 2025 flag base), commercial, farm, trailer, motorcycle, trade, industrial, carrier, specialty (BC Parks, Olympics, Veteran…), consular, amateur radio, official, events, municipal and bicycle plates, plus samples, prototypes and props with an explicit status. Lettering uses **source-derived and candidate die profiles** instead of a stretched font, with 1915–54 glyphs traced from averaged BCpl8s photographs ([how](scripts/trace-bc-dies/README.md); [lettering eras](docs/bc-font-eras.md); [charts and overlays](docs/research/bc-lettering/README.md)); renewal decals 1970–2023 fill the decal wells. See [B.C. coverage and plate kit](docs/bc-coverage.md) and [B.C. die library](docs/bc-dies.md).
- Canada beyond B.C. (`#/ca-ab` … `#/ca-nu`): current passenger plates for the other 12 jurisdictions, including Alberta Moraine Lake (2026), Ontario green-vehicle and French plates, Québec electric and earlier series, and the NWT/Nunavut polar-bear plates. Alberta uses the supplied geometric/script wordmarks and red wild rose, with [source comparisons and provenance](docs/research/alberta-artwork/README.md). The `ca` template combines constructed and supplied artwork and prints separators between serial groups where the real plate does.
- U.S. template: top/bottom bands, drawn scenes, an EV marker and state-outline separators (Nevada, New York). Dated variants for California (1956, 1963, 1970, Legacy), Arizona alternative fuel, Illinois EV, New York (2001, 2010, Excelsior) and Pennsylvania (visitPA, Liberty Bell); Puerto Rico added.
- China follows GA 36-2018 geometry: blue, yellow front and two-row rear, trailer 挂, driving school 学, Hong Kong/Macau, small and large new-energy, police 警, embassy 使 and consulate 领. Military plates are not modelled.
- Czech Republic: region-letter select, lettered series, EL and historic plates, personalised plates (8/7/5 characters with forbidden-letter and reserved-word checks), and the ministry's plate sizes: 520×110, 340×200, 280×200, 320×160, motorcycle 200×160 and moped 80×110. The EU template gained these sizes, two-row layouts and Czech sticker marks. Finland accepts 2–3 letters and 1–3 digits, plus personalised plates.
- South Korea (7- and 8-character, 2020 reflective with KOR band, electric, rental, corporate, yellow commercial one- and two-row) and Vietnam (long and two-row cars, yellow commercial, blue state, motorcycles; local codes annotated for the 2025 province merger). Hangul uses system fonts.
- Iraq (`#/iraq/<preset>`): 38 flat, parametric designs in Federal and Kurdistan Region families, 1982–2026: divided Arabic, side-legend, bilingual, motorcycle, inspection-temporary, ICTS, Erbil international and unified-Latin plates. Each is dated by a source-reviewed chronology with its evidence level and sources; the inspector edits lettering, font profile, strict/fallback glyph policy, spacing and palette, and lists font coverage and renderer notices. The earlier `#/iraq-customizer/…` and `#/iraq-timeline` links open the matching design and the gallery. See [Iraq flat editor](docs/research/iraq-customizer/README.md).
- Iran (`#/iran/<preset>`): 53 source-guided designs plus the preserved `free-zone-study` route, in domestic, official, motorcycle, free-zone, parallel-transport, foreign-travel and foreign-forces families from the 1326 SH (1947/48) specimen to the national system. The inspector edits each design's identifiers and, under Style, its glyph profile, strict/fallback policy, layout, width/height ratio, spacing and palette, with a source and font coverage section. Dates distinguish evidence from unknown introductions; the 2017 common free-zone redesign remains a geometry barrier. The earlier `#/iran-customizer/…` and `#/iran-timeline` links open the matching design and the gallery. See [Iran integration and chronology](docs/iran-region-integration.md).
- Costa Rica: the 2013 Registro Nacional series (private, electric, motorcycle, disabled, cargo, taxi and bus province codes, official and diplomatic) and the earlier embossed plate.
- South America (Mercosur): Brazil (CONTRAN 780/2019 use classes, the 2018 state/city marks, motorcycle, and the grey 1990–2020 series), Argentina (Mercosur and the 1995 black plate), Uruguay (department letters, special codes) and Paraguay, drawn by a shared `mercosur` template in millimetres. Venezuela never issued Mercosur plates and Bolivia's are international-transport only, so neither is included.
- **Stand-in artwork** (temporary): all 94 [Not a Tesla App](https://www.notateslaapp.com/tesla-customizations/license-plates/) designs are available until each is rebuilt in SVG. The 74 state and provincial designs appear on their own region under a **Stand-in artwork** family (e.g. `#/ca-ab/stand-in-alberta-standard`), and the themed and famous designs have their own region (`#/gallery/themed`). Each is the published 600×300 artwork with the serial set in Antonio (SIL OFL, bundled) using a port of the source editor's placement: shrink to fit 86% of the plate, centre the glyph ink, and type `·` for the plate's emblem. 18 designs have their lettering baked in and are not editable. Refresh or remove the set with `node scripts/import-stand-ins.mjs <plate-library directory>`, which rewrites `src/stand-ins/manifest.json` and `src/stand-ins/assets/`.
- B.C. and U.S. serial-lettering choices: default text, semicircular/DIN-style, squarish, oval, and hybrid. These are category-inspired illustrations, not imported official die fonts. Appearance choices persist through Generate.
- **B.C. coverage** (`#/library/coverage`): the 67 BCpl8s topics, each linked to the formats that draw it, with ICBC's announced 2025 serial configurations.
- **Library** (`#/library`): searchable source collections, page-period filters, paginated image references, source credits and links into available editors. Remote photo previews are off until enabled, and are loaded one visible page at a time.
- **Lettering catalogue**: 70 jurisdiction entries from Leeward's February 2011 survey, with explicit historical dating and exceptions. This does not assign fonts to current state plates or every B.C. year automatically.
- Existing routes remain available, such as `#/eu-de/standard`, `#/jp/kei`, `#/ca-bc/1953`, and `#/ca-bc/1979-first`. Region/format links do not encode edited serials or appearance settings.

## Reference scope

The committed reference snapshot contains 320 parsed BCpl8s pages, including all 20 linked passenger-history chapters, plus ten browser-verified Leeward article-link records and 94 link-only [Not a Tesla App](https://www.notateslaapp.com/tesla-customizations/license-plates/) visualisation pages (the Library records are link-only; the stand-in artwork is separate, see Features; regenerate with `python3 scripts/prepare_reference_library.py`, which reads `scripts/data/notateslaapp-catalog.tsv`). There are 16,474 unique image URLs, not 16,474 distinct plate designs. Supporting documents, people and decorations also occur in source pages.

Thirty discovered B.C. URLs returned 404. The automated Leeward response did not establish usable series coverage; its article records are therefore link-only rather than falsely reported as a full crawl. External archives, unlinked pages, PDF contents and most individual plate reconstructions are outside the verified import. Exact gaps are retained in `public/data/reference-library/coverage-report.json` and displayed in the UI.

Read [reference-library scope and architecture](docs/reference-library.md), [early B.C. reconstruction notes](docs/british-columbia.md), [B.C. coverage and plate kit](docs/bc-coverage.md), [B.C. die library](docs/bc-dies.md), and [lettering controls and limits](docs/lettering.md).

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
    timeline.ts     country/continent grouping; eras and chronological timeline
  regions/          data and serial rules: us/, europe/, asia/, canada/
  templates/        SVG renderers and shared lettering/scene primitives
  library/          reference schema, validation, filtering, dated classifications
  ui/               App, RegionPicker, FormatTimeline, GalleryView, Inspector, BatchView, ReferenceLibrary
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

A Region's `group` is its continent and `country` its issuing country (defaults to `name`). A Format may declare `period: [start, end]`; with at least two dated formats the region gets a timeline, grouped by the region's `eras` (or by decade when none are declared).

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

The 2026 coverage expansion used other generators only as a source of facts (sizes, box positions, colours, class lists): `Pengfei8324/chinese_license_plate_generator`, `yakhyo/korean-license-plate-generator`, `NNDam/Vietnamese-License-Plate-Generator`, `apereiracvo/cr-plates-generator`, `vinihcampos/plates-generator` (Mercosur), `barzansaeedpour/iranian-license-plate-generator`, the konfiguratorspz.cz configurator and notateslaapp.com. No code, template images, glyph bitmaps or fonts were copied from them; plates are drawn from our own SVG geometry and checked against the cited primary or secondary sources. Formats that could not be confirmed carry an **Uncertain** badge.

B.C. research uses [BCpl8s](https://www.bcpl8s.ca/). Lettering categories and the dated survey use [Leeward Productions](https://www.leewardpro.com/articles/licplatefonts/licplate-fonts-nam-class.html). The B.C. reference import does not mirror source photographs, article bodies or new font binaries. The federal comparison page includes credited cropped thumbnails with links to the original galleries. Their rights remain with their creators and credited contributors.

## Notes

- Existing U.S. serial ranges follow the upstream generator's late-2019 data; state colour schemes are approximations, not verified current full-art replicas.
- CJK text uses available system fonts.
- Stand-in artwork under `src/stand-ins/assets/` is Not a Tesla App's published work (and, for the themed designs, their studios' and brands'); it is included as a temporary reference and its rights remain with those owners. Antonio is under the SIL Open Font License (`src/assets/fonts/Antonio-OFL.txt`).
- Existing `EuroPlate.ttf` and `UKNumberPlate.ttf` assets came from the upstream reference project; check their licences before redistribution.
- Iranian presets use portable candidate glyphs and complete HarfBuzz-shaped wordmark paths; their profiles, licenses and rebuild steps are documented in [Iran fonts](docs/research/iran-customizer/fonts/README.md). Older Iraqi Arabic-script outlines still use `westasia-arabic.ts` (Parastoo/Sahel, SIL OFL); regenerate those with `scripts/build-westasia-arabic.py`. Candidate fonts are not authenticated plate dies.
- Browser tests mock third-party image responses. Passing CI does not verify every remote photograph.
- Generated plates are for mockups, research, testing and design. They do not represent real registrations or official issuance.

For future maintainers: [reconstruction workflow and lessons](docs/plate-reconstruction-workflow.md), [reusable reconstruction skill](skills/plate-reference-reconstruction/SKILL.md), and [repository handoff](AGENTS.md).
