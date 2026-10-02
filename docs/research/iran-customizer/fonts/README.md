# Iran portable typography engine

This is a reusable, source-labelled rendering library. It is **not an authenticated Iranian manufacturing font**. Its full Persian candidates use actual licensed Unicode/OpenType fonts, and its historical studies distinguish observed source contours from explicitly inferred numeral completions.

## Delivered coverage

The exact, generated per-profile alphabet, role alphabet and wordmark list is in **[coverage-index.md](coverage-index.md)**. `profile-summary.json` is the machine-readable counterpart. Separate photographed specimens remain separate masters; the source set is bounded to the supplied pages and recovered photographs.

- Three full Persian candidates: Parastoo Bold, Sahel Bold and Noto Naskh Arabic Bold. Each has actual Persian ۰–۹, isolated Arabic/Persian letters, connected هـ, separators and 70 complete HarfBuzz-shaped Persian words.
- Four complete Latin candidates: GL-Nummernschild Eng, Liberation Sans Regular, Liberation Sans Bold and Noto Sans Regular. Liberation supplies ordinary micro/zone-label lettering; Noto Sans supplies a full footless-1 free-zone candidate. These are actual unmodified licensed fonts, not silent glyph aliases. GL remains a separate FE-style option.
- `historical-studies.json`: seven independent city-initial specimens (1947, 1949, 1954, 1956, 1960, 1961, 1963). Each supports every observed main serial figure plus labelled inferred digits to complete ۰–۹, with independent **city-initial** / **year** alphabets. All seven numeric year alphabets also cover ۰–۹. The initial ط is traced from each specimen; it is never substituted with a broad modern font form. Year-tab figures are not merely smaller main digits.
- `city-studies.json`: eleven independent full-city/city-band/consular specimens. Actual complete Tehran, Rasht and consular legends are reusable whole-word paths, with complete source-specific numeric repertoires and extension-role glyphs; observed and inferred forms are distinguished per glyph. Repeated occurrences are chosen explicitly, and damaged examples retain visible reconstruction caveats.
- `parallel-studies.json`: seven separate TEH/THR/touring/UNIIMOG/foreign-forces specimens. Latin and Persian alphabets stay distinct. The five Latin and two Persian numeric main repertoires, plus the numeric touring code role, cover all ten digits. Small touring-box code, E and country forms have independent roles; mission and geographical legends are complete wordmarks.
- `role-studies.json`: thirteen source profiles covering geometric national ایران, current and earlier political/service titles, earlier temporary words, protocol/historic legends, atomic government الف, and observed series ع / connected هـ / taxi ت / agricultural ک / thin diplomatic D / light service S masters. These role/word masters are distinct from the main full candidate fonts and retain their individual CC BY-SA or CC0 notices.

The full Persian candidate catalogue includes both requested Iran spellings (`ایران`, `ايران`), all 31 provincial capitals plus Abadan and Khorramshahr; `الف`, `تشریفات`, `تاریخی`, `گذر موقت`, `سیاسی`, `سرویس`, `کنسولی`; and free-zone names / complete `منطقه آزاد …` labels. Descriptive class words are available for study; presence in the catalogue does not prove that every wording appeared on an issued plate.

The yellow U.S. topographical training-team source reads **جغرافیایی**, retained in the source wordmark `us-topographical`. Latin `IRAN` uses the separate `iran-latin` ID, never the Persian `iran` alias. `UNIIMOG` also has an atomic source wordmark. The Latin candidates provide their own complete Latin outline alternatives for those labels.

`build-audit.json` records licensed font hashes, native metrics, HarfBuzz glyph IDs/clusters/offsets, source bounds, normalization, wordmark IDs and role coverage. No private-use codepoints are used as a pretend Arabic alphabet.

## Complete numeric repertoires

See [NUMERIC-COMPLETION.md](NUMERIC-COMPLETION.md), `numeric-coverage-report.json`, and the `numeric-repertoire-*.svg` boards for the complete ten-digit alphabets and independent contextual roles. Every board places the inspected source photograph beside the native-width outlines and labels each digit **O** (observed) or **I** (inferred). All pre-existing observed paths are hash-checked against `observed-path-baseline.json`.

## API

```ts
renderIranGlyphRun(profileId, text, x, baseline, height, tracking = 0, policy = 'strict')
renderIranWordmark(profileId, wordmarkId, x, baseline, height, policy = 'strict')
renderIranRoleGlyphRun(profileId, role, text, x, baseline, height, tracking = 0, policy = 'strict')
IRAN_FONT_PROFILES
IRAN_WORDMARKS
```

All rendering functions return `{ markup, bounds, advance, warnings, errors, provenance, sourceIds }`.

- **Glyph runs:** left-to-right registration tokens; one shared numeral cap-height, baseline and uniform scale per source font. The original font advances and all relative glyph heights are retained. Small zero remains small. No per-glyph width/height fitting, condensation or fake stroke thickening is applied. Native bearings, overshoot and descenders can extend beyond the nominal cap-height; use the returned ink bounds.
- **Numeral input:** ASCII 0–9 and Arabic-Indic ٠–٩ map deliberately to the font's actual Persian U+06F0–U+06F9 outlines. In the explicitly Latin profile they map to Latin 0–9 instead. Persian ۴/۵/۶ are not borrowed Iraqi ٤/٥/٦.
- **Heh:** `هـ` means U+0647 U+0640, HarfBuzz-shaped as a single plate token. It is distinct from isolated `ه`. It is not an ASCII icon mapping or a PUA substitute.
- **Wordmarks:** candidate Persian words use complete OpenType GSUB/GPOS shaping at build time, RTL direction, Arabic script and `fa` language. Source-specific joined legends are complete, hand-drawn smooth outline masters in the original source coordinate plane, with their own provenance. Latin candidate words use native licensed glyph outlines in their correct reading order. `height` is total ink height, and `baseline` is the bottom of the wordmark ink box. The whole word scales proportionally. Internal letter tracking cannot be changed. Regular word spaces and ZWNJ are shaped rather than removed.
- Known complete Arabic-script literal words passed to the glyph-run function are routed to their pre-shaped wordmark. Latin runs such as `UNIIMOG` remain ordinary editable glyph runs unless `renderIranWordmark` is explicitly called. Unknown adjacent Arabic-letter strings are blocked with a crossed box; they are not deceptively presented as unjoined Persian. Use spaces to compare isolated series letters.
- **Role alphabets:** `profile.roles[role].glyphs` is independent of `profile.glyphs`. Roles include `city-initial`, `year`, `extension`, `code`, `letter`, `country` and `series`. Each retains its own shared source cap-height/baseline before normalization. A missing role is unsupported under strict policy.
- **Observed and inferred digits:** Numeric source families include reusable 0–9 repertoires. `observed` means a contour was reconstructed from a visible specimen; `inferred` means an unobserved digit was designed using that family’s visible weight, terminal shapes and metrics. Inferred digits are usable under strict policy but explicitly labelled in the glyph inventory, SVG provenance and warnings. They are not validated historical dies.
- **Strict policy:** every genuinely unsupported character or word produces a visible crossed box and an entry in `errors`. Export callers must refuse export whenever `errors.length > 0`. Strict means no unrelated-font substitution, not that inferred numerals become observed evidence.
- **Explicit fallback policy:** missing Persian material uses licensed Parastoo Bold; missing characters in a Latin profile (including numerals and separators) stay in the separately licensed Latin candidate. A missing role glyph never silently borrows a main-row source glyph. Each substitution has `data-provenance="fallback"`, a warning, and the actual fallback `sourceId`. Unknown glyphs remain errors even in fallback mode. Fallback does not expand a historic profile's observed coverage. Inferred numeric glyphs are separately authored source-style reconstructions, with `data-provenance="inferred"`, per-glyph warnings and `inference` metadata; they never masquerade as observed forms or licensed candidates.
- Candidate/rights notices remain present even when there are no errors. A technically complete export is not a certification of historical typeface authenticity or source-image redistribution rights.

All lettering is portable SVG path artwork. There are no runtime Arabic font files, browser text-shaping assumptions, embedded bitmap glyphs, or system-font `<text>` legends in the returned markup. The original font files are supplied under `source/` for reproducibility and independent editing; they are not fetched at runtime or embedded in exported plates.

## Rebuild and verify

From the repository root:

```sh
python scripts/build-iran-fonts.py
npx vitest run src/templates/iran-custom-fonts.test.ts
npm run typecheck
```

The build is offline and needs Python, Pillow (for review-board source dimensions), `fontTools` (tested 4.61.1) and the system `libharfbuzz` C library (exact build version recorded in the audit). It fails on missing OpenType glyphs rather than silently rendering `.notdef`. Noto's variable font is instantiated at weight 700 before both outlining and shaping.

`font-specimen.svg` shows the digits, isolated series, contextual heh and selected words for all candidates. `wordmark-catalogue.svg` shows every joined label. `source-comparison.svg` places native candidate runs beside previously rectified, inspected CC BY-SA Iranian reference photographs. These are qualitative visual comparisons, not an overlay score or an authenticity percentage. English annotations in the review boards use ordinary SVG text; all Arabic-script samples are the generated outlines.

Optional PNG review:

```sh
inkscape docs/research/iran-customizer/fonts/font-specimen.svg --export-type=png
inkscape docs/research/iran-customizer/fonts/wordmark-catalogue.svg --export-type=png
inkscape docs/research/iran-customizer/fonts/source-comparison.svg --export-type=png
```

## Licensed font provenance

- **Parastoo Bold 2.0.1:** Saber Rastikerdar, [official project](https://github.com/rastikerdar/parastoo-font), [versioned source package](https://registry.npmjs.org/parastoo-font/-/parastoo-font-2.0.1.tgz). Original `dist/Parastoo-Bold.ttf`; SHA-256 `25f5eb2039739759a1666ce1a7a1b5dd3f08e6be5b9114f453b52e35aa08b104`. Licence: `source/Parastoo-LICENSE.txt`.
- **Sahel Bold 3.4.0:** Saber Rastikerdar, [official project](https://github.com/rastikerdar/sahel-font), [versioned source package](https://registry.npmjs.org/sahel-font/-/sahel-font-3.4.0.tgz). Original `dist/Sahel-Bold.ttf`; SHA-256 `d714fa224c92bc51d0e477337ef69e8818c2eff8f41e6698de35639e3857ae7b`. Licence: `source/Sahel-LICENSE.txt`.
- **Noto Naskh Arabic:** [Noto Arabic upstream](https://github.com/notofonts/arabic), original recovered licensed `NotoNaskhArabic[wght].ttf`, SHA-256 `67b5a525a661b607971fbd3f96a81b89d3a768e74534fca84f18ac97e6fab72f`, instance weight 700. Licence: `source/Noto-Naskh-Arabic-LICENSE.txt`. The hash identifies the exact input; a particular upstream release tag is not independently asserted.
- **GL-Nummernschild Eng:** [Gutenberg Labo upstream at recorded commit](https://github.com/Gutenberg-Labo/GL-Nummernschild/tree/c108a385ad67eab0e4e7cc9e1f5c3b9072bdbbd2), original recovered `GL-Nummernschild-Eng.ttf`, SHA-256 `14f88dc5e2443b7b4c12f4d2d5dba350ef8606c356d8b3107bc0083c744ad3bb`. Licence: `source/GL-LICENSE.txt`. This is a general licensed FE-style candidate, not evidence of TEH/THR/UNIIMOG's historical manufacturer.

- **Liberation Sans Regular / Bold 2.1.5:** [official Liberation Fonts project](https://github.com/liberationfonts/liberation-fonts); unmodified binaries `source/LiberationSans-Regular.ttf` and `source/LiberationSans-Bold.ttf`, with complete notice `source/Liberation-COPYRIGHT.txt`. SHA-256 values: Regular `bade59d822652f76e6941aa87b40a87c13d1cc70db98ededb5011127efafd1d3`; Bold `1b5f2da6f4cadce4c05b9ecebe3a6fcd374eb95ae443605e799f4c3287978939`.
- **Noto Sans Regular 2.004:** [official Noto Fonts project](https://github.com/notofonts/noto-fonts); unmodified `source/NotoSans-Regular.ttf`, copyright 2015 Google LLC, SIL OFL 1.1; complete notice `source/NotoSans-COPYRIGHT.txt`. SHA-256 `89c3c497f618fdaa0b2d1e98fef93582f28c71debd2c4a8cdf41f190ced2909d`. Its footless 1 is preferable for the bounded free-zone comparisons, but the whole typeface remains a labelled candidate.

The OFL and Gutenberg Labo notices travel with the original font assets and generated outline library. No IR Plate, B Roya or EuroPlate outlines/assets are imported by this module. IR Plate's icon mapping / unresolved internal copyright and B Roya's unresolved redistribution status do not become acceptable merely because their shapes appear closer to a photograph.

The earlier `westasia-arabic.ts` comparison used mixed Parastoo/Sahel ع outlines, per-digit fitting and stroke additions. This new module uses intact separately selectable font profiles and common metrics. Its shapes/layout are therefore deliberately not reported with the earlier comparison's numeric IoU scores. Sahel's ع remains available by selecting Sahel; no automatic mixed-font substitution is concealed in Parastoo.

## Source-specific historical alphabets

Seven city-initial specimens were inspected as actual pixels and reconstructed with sparse smooth anchors. The source crop, clean outline and translucent overlay in `historic-*-study-comparison.svg` / `.png` share an unchanged 3× source-pixel scale. No independent width fitting is used.

| Profile year | Observed main serial | Main coverage | City role | Year role text |
|---|---|---|---|---|
| 1947 | ۷۳۷۶ | ۳۶۷ | ط | ۲۶ |
| 1949 | ۳۴۳۵ | ۳۴۵ | ط | ۲۸ |
| 1954 | ۲۰۰ | ۰۲ | ط | ۳۳ |
| 1956 | ۴۲۵۵ | ۲۴۵ | ط | ۳۵ |
| 1960 | ۱۸۲۷ | ۱۲۷۸ | ط | ۳۹ |
| 1961 | ۲۲۸۷۵ | ۲۵۷۸ | ط | ۴۰ |
| 1963 | ۶۲۰۱۹ | ۰۱۲۶۹ | ط | ۴۲ |

The 1949 angular/zigzag ۴, 1960 narrow ۱/۲/۷/۸, historical curled or hooked ۶, narrow city initials and differing small year figures are source-specific. A final shared-scale contour review refined the 1949 ۳ to retain its nearly vertical thin lower stem and the 1960 ۱/۷ to follow the light dark-core silhouette rather than the blurred edge halo. These are direct sparse-anchor shape corrections, with unchanged alphabet cap-height/baseline and uniform scaling; no horizontal compression or artificial stroke is used. The 1954/1963 main zero is a raised solid diamond; 1961's year zero is a tiny filled round mark. These differences are preserved instead of standardizing everything to the modern candidate font.

- 1947–48 [truck photograph](https://dna.nl/mideast/iran47trucku.jpg), DNA archive / NPCC, 248×114 pixels
- 1949–50 source [WorldLicensePlates general sheet](http://www.worldlicenseplates.com/jpglps/AS_IRAN_GI.jpg), bounded crop `[12,20,185,92]`
- 1954–55 source [WorldLicensePlates other-types sheet](http://www.worldlicenseplates.com/jpglps/AS_IRAN_OT1.jpg), bounded crop `[8,12,209,94]`
- 1956–57 [passenger photograph](https://dna.nl/mideast/iran56caru.jpg), DNA archive / Fox, 248×121 pixels
- 1960–61 [thin-lettering passenger photograph](https://dna.nl/mideast/iran60caru.jpg), DNA archive / PP, 261×92 pixels
- 1961–62 [passenger photograph](https://dna.nl/mideast/iran61caru.jpg), DNA archive / Gordon, 272×91 pixels
- 1963–64 [passenger photograph](https://dna.nl/mideast/iran63caru.jpg), DNA archive / Klotz, 272×92 pixels

Observed source glyphs are never pooled across these specimens. The first 1947 ۷, first 1956 ۵ and cleaner second 1961 ۲ are the explicitly chosen repeated masters. The main and small-role outlines are separate even when the Unicode character is the same. The main-row and role cap-heights/baselines are recorded independently in `historical-studies.json`.

Source contours remain in one original coordinate plane and receive only a uniform per-alphabet scale and baseline translation. Four-unit side bearings, with an eight-unit total allowance, regularize reusable glyph advances; that spacing is an editable layout choice, not recovered factory advance widths. Whole-word paths preserve their joining and internal spacing.

The full-city and parallel alphabets use the same model and their own JSON/source/reference-board sets. See `city-studies-notes.md`, `city-studies-geometry.json`, the parallel study documentation, and the modern role comparison notes. Global metadata never substitutes a different specimen's word shape or overwrites its source notes.

Dates remain specimen/collector labels rather than proved national redesign boundaries. Low resolution, blur, wear and residual camera perspective limit manufacturing precision, but readable forms are actually reconstructed. Unobserved numeric forms are now constructed only as explicitly labelled stylistic inference; they are not presented as observed or authenticated. Unsupported nonnumeric material remains blocked. Clean contours omit paint damage and pixel stair-steps; source-specific damage caveats remain attached to the affected profiles.

Historical photographs have unspecified redistribution rights. Their derived source profiles and comparison sheets remain **private critical study only**. The modern CC-licensed role sources retain their individual source/author/licence metadata. Research reference pixels are included only in the private reference files and comparison sheets, never in exported plates.

The qualitative modern board uses [Iran_licenceplate_02.JPG](https://commons.wikimedia.org/wiki/File:Iran_licenceplate_02.JPG) by Dickelbers (2015) and [Iranianplate.jpg](https://commons.wikimedia.org/wiki/File:Iranianplate.jpg) by MohsenKalali (2018), both [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), cropped and rectified in the existing typography review. The comparison board is an attributed CC BY-SA 4.0 adaptation; no endorsement is implied. The heh original is only 346×81 pixels and establishes contextual shape, not precision die dimensions.
