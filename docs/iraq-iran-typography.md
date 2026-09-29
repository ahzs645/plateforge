# Iraq / Iran typography comparison

This pass renders the actual candidate fonts against attributed photographs. It does **not** replace the production glyph defaults or certify an official stamping font.

## Open the comparison

In the Iraq or Iran editor, expand **Typography comparison → Compare shapes with a reference**. Select a specimen, select a candidate, and adjust opacity. The inspector also links the full-size report and a downloadable single-file offline report.

- `public/typography-review/index.html`: side-by-side sheets, character close-ups, measured crop regions, overlay controls and sources.
- `public/typography-review/offline.html`: the same report with raster images embedded; no font binaries.
- `public/typography-review/results.json`: per-character measurements, exclusions, font hashes and source provenance.
- `public/typography-review/font-metrics.json`: numerical bounds, advances and character mappings, **not font outlines**.

## Results

Mean silhouette intersection-over-union (IoU; 0–1, higher means closer overlap **in this test**):

| Photographed specimen | Original geometric glyphs | EuroPlate | IR Plate | B Roya Bold |
|---|---:|---:|---:|---:|
| Iraq / KRG, `22 C 79770`, excluding occluded C | 0.487 | 0.801 | — | — |
| Iran / public, flat `۲۴ ع ۴۱۷ / ۹۱` | 0.467 | — | 0.839 | 0.839 |
| Iran / public, embossed, same serial | 0.455 | — | 0.741 | 0.741 |
| Iran / private, low-resolution heh specimen | 0.444 | — | 0.639 | 0.609 isolated / 0.639 plate-form heh |

These are **not authenticity percentages**, not a recognition benchmark, and not whole-plate layout accuracy. The raw numbers and individual glyphs are in `results.json`.

### Modern Iraqi Latin lettering

The existing EuroPlate font is substantially closer than the first-pass geometric glyphs for the visible digits tested. This supports testing a EuroPlate/FE-style profile; it does not establish the exact manufacturer master or every Latin letter. The tested unoccluded glyphs are 0, 2, 7 and 9; repeated occurrences receive repeated weight in the mean. C remains visible on the comparison sheet but is excluded from numerical aggregation because the hand contaminates the crop.

Some specimen digits are narrower than the candidate's native proportions. Do not fix this by horizontally stretching every serial group; measure the actual die variant and keep glyph shape, advance and placement separate.

### IR Plate versus B Roya Bold

After encoding normalization, the two candidates are essentially indistinguishable on the original public-plate specimens. A direct raster comparison of all ten digits plus ع, س and ب gives approximately 0.990–1.000 silhouette IoU. That is evidence of near-identical **tested shapes**, not a determination of ownership, derivation or licence compatibility.

IR Plate is an older icon font. Its ASCII digits map to Persian digit shapes, and `u` maps to ع in this study. Do not pass ordinary Persian Unicode blindly into it, or expose its private encoding as the plate's underlying data.

The embossed public specimen retains important differences: the candidate ۴ forms are roughly 20–25% wider at equal height, and ۷ roughly 34% wider in that measured crop. Those observations are specimen-specific and depend on rectification. The flat specimen is a better fit than the embossed one, which is precisely why a single illustration should not define all dies.

### Contextual heh is a real, separate issue

A different private-plate photograph was added specifically to check هـ. For that glyph alone:

- B Roya's isolated ه: IoU **0.628**.
- B Roya's initial plate-form هـ (U+FEEB): IoU **0.866**.
- IR Plate's `i` glyph: IoU **0.866**.

The original photograph is only **346 × 81 pixels**. Use it to establish the contextual-form difference, not precision physical dimensions. The ordinary B Roya profile is deliberately retained in the lab to show the incorrect isolated-form substitution, not proposed as the final production profile.

## Method and limitations

Four photographs are reviewed. The two public Iranian photographs share a serial, photographer and collection; they are not independent validation data. The private Iranian photograph is a different serial and photographer but low resolution. None is authenticated by this project as a manufacturing specification.

Corners are manually recorded; photographs are perspective-corrected to a common drawing canvas. Glyph masks come from thresholding and connected components, not OCR. Reference and candidate are normalized to equal height while preserving their own width/height ratios. The metric allows at most a small translation search; no per-glyph horizontal stretching is used to maximize the score.

Candidate rows use **reference-derived character positions and heights**. This isolates shape comparison; it does not test the current renderer's whole-plate spacing. Means weight glyph occurrences, not unique character classes. There is no held-out test set, uncertainty interval or claim of generalization to all classes and years. Crop thresholds, perspective, embossing, glare and resolution all affect the numbers.

The Wikipedia SVG illustrations that identify B Roya as their creation font were not used as independent proof that B Roya matches manufactured plates. Full joined-word legends, all unobserved class letters, old Iraqi Arabic dies, special-plate emblems and manufacturing details remain separate work.

## Sources and font provenance

- [964media photograph, 30 September 2023](https://en.964media.com/2800/): KRG sample. Limited plate crop used for typography criticism; photograph rights retained by source.
- [Flat Iranian public specimen](https://commons.wikimedia.org/wiki/File:Iran_licenceplate_02.JPG): Dickelbers, 24 March 2015, CC BY-SA 4.0. Cropped, rectified and resized.
- [Embossed Iranian public specimen](https://commons.wikimedia.org/wiki/File:Iran_licenceplate_03.JPG): Dickelbers, same date, CC BY-SA 4.0. Top plate cropped, rectified and resized.
- [Private Iranian heh specimen](https://commons.wikimedia.org/wiki/File:Iranianplate.jpg): MohsenKalali, 29 March 2018, CC BY-SA 4.0. Cropped, rectified and enlarged.
- [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/): adapted Iranian reference crops and comparison sheets retain attribution and this licence; no endorsement implied.
- [PlateFont](https://github.com/mojtaba-khallash/PlateFont): pinned commit `2ddd46a1eecee27f12562bc01ae1c1fb4f046cfb`, IR Plate candidate. Root MIT licence is present; embedded font copyright metadata is a generic placeholder. Asset provenance is not resolved merely by the repository badge.
- [PlateModel.Wpf](https://github.com/mahdi-ataollahi/PlateModel.Wpf): pinned commit `65a4dc3ed2d4424d401ddc2a1a70db77f51f8cf5`, B Roya Bold candidate. Embedded copyright is Borna Rayaneh, 2000; no embedded licence URL was found.
- Existing PlateForge EuroPlate asset: internal name **Euro Plate**, Andy Hoppe / autokennzeichen.info, 2011. Existing repository redistribution warning remains unresolved; no additional font copy is introduced.

## Implementation decision

**Implemented (2026-09-28):** modern federal / KRG Latin lettering (class strip, governorate code, series letter and serial) now renders EuroPlate outlines converted to SVG paths (`src/templates/westasia-euro.ts`), scaled uniformly to the run height and centred, never stretched. No font file is embedded in the plate SVG. Iranian heh now uses the plate form هـ (a hand-drawn path, not a font outline). The bilingual 2008, side-legend and older Iraqi layouts, and all other Iranian glyphs, keep the geometric first pass.

**Implemented (2026-09-29):** Arabic-Indic and Persian digits and Arabic-script letters (every selectable series letter, ب پ ت ث ج د ر ز س ش ص ط ع ف ق ک ل م ن و ی) now render outlines converted to SVG paths (`src/templates/westasia-arabic.ts`, glyph profile `naskh`) from two **SIL OFL 1.1** fonts by Saber Rastikerdar: Parastoo Bold, with ع from Sahel Bold. Outlines are scaled uniformly to the run height, centred, and shrunk (never stretched) if wider than their cell. Digits and ا are drawn with a 3-unit stroke (about 2% of glyph height on each side) because the fonts are lighter than plate dies; other letters are not thickened, since س and ع scored worse with the stroke (س 0.57 without, 0.49 with). This is used on every Iranian recipe and on the older Iraqi Arabic-digit plates (1988, 2001, 2008 bilingual, KRG legacy). Latin lines, modern Iraq (EuroPlate), the accessibility symbol and the hand-drawn plate هـ are unchanged. The zero is the font's diamond for both scripts; the Wikipedia Iraq graphics draw it as a diamond too.

**Older Iraqi digits.** The Iran photographs cannot test the Arabic-Indic forms, so the shipped glyphs were also scored against four Wikipedia plate graphics (Commons: BasilLeaf, CC0, for the 2008–2024 private and government plates; one CC BY-SA 4.0 graphic each for the 2001 plate and the 1988-era layout), on ١ ٠ ٢ ٣ ٤ ٥ ٦ ٧ and س. They are illustrations, not photographs, one per era. The older dies are narrower than the source fonts: the width/height ratio of the specimen digits over the font's is about 0.5 for the 2001 graphic, 0.8 for 2008 and 0.85–0.9 for the 1988-era graphic. One die-level condensation factor per plate design (not fitted per glyph) is therefore applied to the digits: **0.75 for the 2008 bilingual plates and 0.8 for the 1988 / KRG legacy layout**. Scores (silhouette overlap, mean over glyphs): 2008 **0.63** (geometric 0.36), 1988-era layout **0.57** (0.43), 2001 **0.32** (0.31). The 2001 figure is effectively unimproved: its dies are so narrow that condensing to fit (about 0.55, which scores 0.58) would put a tight cluster of digits on a 520 × 110 canvas, whereas the specimen is a roughly 2.2:1 plate. It is left unapplied until the 2001 canvas is decided.

**Known mismatches with the Wikipedia Iraq graphics (not fixed):**
- The 2008 government plate is drawn with a full blue face and white digits; the graphic has a white face, a blue side strip and black digits. Verify against photographs before changing the colour scheme.
- The 1988-era graphic is a single field with العراق and بغداد stacked at the left around an emblem and the number to the right; our 1988 plate is divided, with the number above a province row. The graphic carries no date, so the era attribution is open.
- The 2001 graphic has no divider rules and an emblem between the two words; ours has rules and no emblem, and ours uses a 4.7:1 canvas.
- The Latin serial line and the IRAQ strip on the older plates are still thin geometric type; the graphics use plain sans.
- The joined words remain system-font text.

Measured on the eight glyphs of the two Dickelbers Iran specimens, the final generated paths score **0.749** flat and **0.708** embossed, against 0.467 and 0.455 for the geometric glyphs. IR Plate scored 0.839 and 0.741 but its rights are unresolved, so it is not used. Candidates measured and not chosen (flat / embossed, no stroke unless noted): Noto Naskh Bold 0.729 / 0.649, Sahel Bold 0.716 / 0.650, Samim Bold 0.698 / 0.638, Amiri Bold 0.668 / 0.633 (0.724 / 0.681 with stroke), Noto Sans Arabic Bold 0.658 / 0.589, Vazirmatn 800 0.611 / 0.566. Thickening helped Parastoo and Amiri (Noto Naskh slightly) and hurt Sahel, Samim, Noto Sans Arabic and Vazirmatn. On the Iraq graphics Scheherazade New Bold scored highest (0.58 unthickened, against 0.52 for Parastoo), but it was not tested on the Iran photographs and was not adopted. The Iran figures cover only ۱ ۲ ۴ ۷ ۹ and ع; the other digits and letters were checked by eye only.

Regenerate with `python scripts/build-westasia-arabic.py Parastoo-Bold.ttf Sahel-Bold.ttf` (font files from the npm packages `parastoo-font@2.0.1` and `sahel-font@3.4.0`; hashes are recorded in the generated file). The copyright notice and licence text are in `src/assets/fonts/Parastoo-Sahel-OFL.txt`. No font file ships and none is embedded in plates.

**Not implemented:** IR Plate / B Roya outlines (font rights unresolved), die-specific widths (the embossed ۴ / ۷ and narrower Iraqi digits), the joined words (العراق, ایران, الف, province names), which are still system-font SVG text, and untested Latin letters, which remain EuroPlate's shapes. The Persian-glyph first pass remains available as the default `geometric` profile so the comparison lab stays reproducible.

The remaining first-pass glyphs (Latin letters outside modern Iraq, the accessibility mark and the plate هـ) stay geometric while this lab supplies inspectable evidence. Production promotion should separately resolve font rights, complete required character mappings (including هـ and الف), measure die-specific metrics, and compare more independent specimens. Visual fit alone is not sufficient to label a typeface official.

This is a completed **comparison pass**, not a claimed completion of die reconstruction. No font binaries, font outline libraries or full source photographs are included in the report assets. SVG serial generation and all existing country implementations are unchanged by the comparison controls.

## Reproduce and test

```sh
npm ci
python -m pip install fonttools==4.59.1 pillow==11.3.0 numpy==2.2.6 opencv-python-headless==4.12.0.88 cairosvg==2.8.2
python scripts/compare-westasia-suite.py
npm test
npm run build
# CI installs Playwright separately, then:
node scripts/typography-review-smoke.mjs
```

The browser check exercises country/reference/candidate switching, opacity, image loading, download and all candidate images in the single-file report with networking disabled. The main CI workflow retains the report and screenshots as `typography-review-and-screenshots`.
