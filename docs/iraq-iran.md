# Iraq and Iran: implementation and research notes

Iraq research snapshot: **27 September 2026**. Iran registry integration and bounded source audit: **2 October 2026**. See [Iran integration and chronology](iran-region-integration.md) for the current Iran contract; the earlier typography report retains its historical measurements.

## What is implemented

Two registered country regions (`iraq`, `iran`), SVG templates (`iq-flat` for Iraq, `ir` for Iran), shared script normalization, shared geometric glyph masters, seeded generation and per-format validation. The existing PlateForge region picker, format fields, gallery, timeline, batch generation and export pipeline discover these through the normal registries. No new application dependency or existing plate renderer is required.

| Region | Recipes | Coverage |
|---|---:|---|
| Iraq | 38 | Every flat-editor preset (see `docs/research/iraq-customizer/README.md`): the 27 original recipes below, seven flat specimen-derived presets and four illustration-based layouts, drawn by the `iq-flat` template. |
| Iran | 54 | All 53 source-guided Iran workshop presets (national classes, dated historical specimens, city/city-band layouts, temporary, earlier diplomatic/service, seven local free zones, foreign-travel and observer designs), plus the preserved `free-zone-study` alias. |

The original 27 Iraq recipes (six modern federal and six modern KRG classes, seven 2008 bilingual classes, two earlier private layouts, six KRG legacy colour classes) and their `iq` renderer are kept in `src/regions/asia/iraq-recipes.ts` for this preview and its tests; the app draws the same ids with the flat engine. These counts describe code recipes, not unique historical issues or a complete worldwide catalogue. The seven local free-zone layouts have source-guided emblem reconstructions; they are not authenticated production masters or the separate 2017 redesign.

## Architecture

`src/regions/asia/iraq-data.ts` and `iran-data.ts` hold source references, allocations, and class vocabularies. `plate-script.ts` converts Arabic/Persian digits without reversing their logical order or discarding zeros. `iraq.ts` and `iran.ts` define fields, validation, generation and period/family metadata.

`src/templates/westasia-glyphs.ts` contains original geometric studies for Latin letters, Arabic-Indic digits, Persian digits and the required isolated series letters. The original Iraqi Arabic-digit recipes use converted OFL outlines (`westasia-arabic.ts`, profile `naskh`; see [Iraq / Iran typography](iraq-iran-typography.md)). Iranian plates use the dedicated `iran-custom-fonts.ts` profiles and pre-shaped complete wordmarks; the app's Iraq plates use the flat editor's `iraq-custom-fonts.ts` profiles. Arabic ٤/٥/٦ and Persian ۴/۵/۶ are distinct masters. The accessibility mark is geometry, not an emoji.

`westasia-scene.ts` places serial groups explicitly and returns an escaped SVG scene; it now draws only the original Iraq recipes (`iraq-recipes.ts`) and the legacy Iran compatibility scene. `ir.ts` adapts Iran Parts through `iran-region-bridge.ts` and renders `renderIranCustom`; `iq-flat.ts` does the same for Iraq with `renderIraqCustom`. Unknown characters produce a visible missing-glyph cell rather than silently disappearing. Short Iraqi serials retain reasonable character proportions instead of stretching one digit over an entire number panel.

Rendered Iran and Iraq SVGs contain portable glyph and complete joined-wordmark paths, not system-font text or source photographs. Iran's candidate typefaces and artwork provenance are documented in [Iran fonts](research/iran-customizer/fonts/README.md) and [Iran artwork](research/iran-customizer/artwork.md). The original Iraq recipes' joined legends still use system-font SVG text. Security features are not reproduced.

## Evidence ledger

- [Iraq overview and tables](https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Iraq), consulted as a **secondary** source. Revision observed: `1338002866` (12 February 2026).
- [Rudaw, original interview with Erbil traffic spokesperson, 25 April 2022](https://www.rudawarabia.net/arabic/kurdistan/250420224). Supports the KRG introduction and quotes the conversion instructions; see conflict below.
- [Alsumaria, 2 June 2024](https://www.alsumaria.tv/news/localnews/490157/رموز-بدل-أسماء-المحافظات-اللوحات-المرورية-الجديدة-تهوي-بـالمميز). Original reporting from the Interior Ministry announcement supports the federal rollout. It does not independently establish every colour or die measurement.
- [Iran overview and detailed allocation tables](https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Iran), **secondary**. Revision observed: `1353798607` (12 May 2026).
- [Original plate-class figure by Tourani et al.](https://www.researchgate.net/figure/Different-types-of-Iranian-vehicle-license-plates-with-their-corresponding-labels_fig1_346851347), from *A Robust Deep Learning Approach for Automatic Iranian Vehicle License Plate Detection and Recognition for Surveillance Systems*. Used as a visual cross-check, not a source of downloadable glyphs or official specifications.
- Modern Iraqi plate photographs checked via [Nabaa](https://nbanews.net/arabic/hMy4HZ4i) and the [Al-Zawraa plate photograph](https://alzawraapaper.com/vrsfls/cntnt/pctr/119139.jpg). These support the white face with a coloured side strip and examples of shorter federal numbers. Photograph dates are not treated as introduction dates. Images are not redistributed.

Requested atlas references: [WorldLicensePlates — Iraq](http://www.worldlicenseplates.com/world/AS_IRAQ.html) remained a retrieval gap in the September pass. The October Iran pass inspected the bounded [WorldLicensePlates — Iran](http://www.worldlicenseplates.com/world/AS_IRAN.html) and Wikipedia image set, plus separately labelled prior photographs and contemporary reports. It does not claim every Iranian issue or redistribute the catalogue photographs.

## Important modelling decisions

### Iraq

The modern model separates federal introduction in 2024 from KRG introduction in 2022. Modern colour occupies the side strip; this is not implemented as a full-face recolour. The KRG variant also has the smaller KR mark. The standard and compact view boxes use 520×110 and 335×155 respectively.

The overview's literal `GG X ####` conflicts with its own five-digit transition discussion and plate examples. Modern generators produce five digits. Federal validation also permits shorter carried-over serials; KRG validation requires five positions. This is a documented interpretation, not an official exhaustive grammar.

**No old-to-new KRG converter is implemented.** Wikipedia refers to the first digit for generic six-digit transitions; Rudaw's quoted instructions refer to the second digit from the left and include an additional repeated-number exception involving the third digit. A converter should be based on the authoritative written instruction plus fixtures, not a plausible guess from one paragraph.

The bilingual model keeps Arabic and Latin serials synchronized from the same fields and omits the province for government/customs classes. Legacy Halabja is not invented. For older issues, historical size variation and class-specific typography remain unmeasured. The 1988 and 2001 canvases are representative layout choices, explicitly identified in the editor.

### Iran

The standard model has separate two-digit, series-mark, three-digit, and right-hand-code positions. It accepts Latin, Arabic-Indic or Persian digit input and renders Persian digits. Standard main serials exclude zero; allocated right-hand codes can include zero. Motorcycle allocations skip all numbers containing zero, including the 499→511 boundary.

Private series use the thirteen letters in the detailed allocation table. The overview's additional ژ entry conflicts with that list; ژ is not silently added as an ordinary private series. Accessible plates display a drawn wheelchair mark instead of the database placeholder ژ. Government uses the complete word الف; taxis add TAXI. D/S remain Latin class letters, and their three-digit block is a mission identifier, not a randomly invented mission allocation.

Military/police/diplomatic recipes cover the documented **starting national code 11**. They do not claim that no later national code can exist. Mission generation uses the cited example 214, with free digit editing explicitly not validating the corresponding mission identity.

There are 86 distinct right-hand codes in the encoded table and 183 motorcycle codes after removing zero-containing numbers. These are snapshot counts, not live availability. Code 32 has multiple provincial associations; 42 has historical exceptions; 64 includes the Tabas exception. Country-level code options do **not** constitute a complete county/letter/prefix/date resolver. A generated combination passing structural checks is not asserted to have been issued.

2003 is a collector system label. [Radio Farda, 26 April 2004](https://www.radiofarda.com/a/340739.html), reports operation since Esfand 1382 (February–March 2004) and 52 × 11 cm; the private/public national timeline starts at 2004. Other undated subclasses are not assigned a shared launch year. D/S plates were unveiled on 6 March 2016, with operation planned for April–May 2016, not confirmed fleet completion. Protocol, motorcycle, temporary, historic-vehicle and most local free-zone layouts stay undated. Qeshm has a circa-2010 collector specimen marker, not a universal free-zone introduction. Existing protocol/free-zone legacy nonzero validators are preserved as conservative sample contracts.

## Fidelity and remaining work

Serial glyphs are **approximations, not measured dies**: original geometric drawings, or (Arabic-script digits and letters, modern Iraqi Latin) converted font outlines. Colours are screen approximations, not official paint specifications. Flag micro-calligraphy, security marks, reflective surfaces, fastening details, exact small-lettering masters and manufacturing tolerances are not reconstructed.

Next evidence passes should prioritize actual die masters or well-scaled front-on specimens; pre-1988 Iraq and Iraqi motorcycles/ICTS; earliest pre-1947 Iranian specimens; the 2017 free-zone geometry and code assignments; and date-dependent county/letter allocation validation. Temporary expiry, Bagh-e Melli historic-vehicle artwork, seven local free-zone emblems and earlier political/service layouts now have separate source-guided reconstructions. Their precise manufacturing specifications and many introduction dates remain unresolved.

The timeline's 2026 endpoints mean “researched through 2026,” not withdrawal. Broad gap intervals are research windows; their lower bounds are not asserted introduction years. Labels and notes make those limitations explicit.

## Verification and review

Repository checks:

```sh
npm ci
npm run typecheck
npm test
npm run build
node scripts/build-iraq-iran-preview.mjs
```

Use the Vite application for canonical Single, Gallery, Batch and timeline review. The Iran region is edited in the main inspector (font profile, glyph policy, layout, ratio, spacing and palette sit under Style); `#/iran/historical-1326`, `#/iran/temporary` and `#/gallery/iran` exercise the standard registry integration. `build-iraq-iran-preview.mjs` now bundles the expanded Iran scene and bridge too; regenerate its offline output before review rather than inspecting a stale 16-recipe preview.

The country contract tests validate 500 seeded examples per recipe, field completeness, allocations, normalization and zero rules. `iran-region.test.ts` additionally validates and renders 20 seeded examples per Iran route through both the canonical scene and actual React template, checks every selectable city/letter/zone, preserves old route semantics, and tests chronology and appearance/identifier separation. Run the complete repository suite and build after all changes; historical verification notes are not evidence of a current CI pass.
