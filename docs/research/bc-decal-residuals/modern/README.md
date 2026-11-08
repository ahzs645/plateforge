# Modern BC decal residuals: numerals, spacing and specimen placement

This pass separates two observed printing groups, implements a later year profile for 2019–2023, and corrects the retained photographed placements for five selections. It does not establish an original typeface, a manufacturer, a physical aspect ratio, or a comprehensive replacement-decal chronology.

## Review the result

- [Year shapes and advances, before/after](late-year-candidate-summary.png): actual registered profiles at equal painted height, with source width preserved.
- [Five specimen placement overlays](modern-placement-summary.png): photograph, first-pass overlay, and proposed placement overlay. These figures retain the month/province contours used at this stage; any subsequent focused month-lettering work is a separate comparison.
- [Three independent enlarged originals](commons-originals-sheet.png): the full photographs remain unrectified.
- [All source inputs and dispositions](source-ledger.csv) and [full source metadata](source-inventory.json).
- [Every digit's source coverage](glyph-coverage.json), [exact-input corrections](input-corrections.json), [validation](validation.json), and [production provenance](provenance.json).

## What changed in production

`bc-decal-print-modern-late-year-reconstruction` supplies only the observed `0/1/2/3/9`. The earlier `bc-decal-print-modern-year-reconstruction` remains available and is retained through the selected 2018 printing group. Both are separate from the modern control-number profile and from stamped plate dies.

The later `0` has a wider, straighter-sided body than the earlier construction. The later `1` is narrower and has the straight diagonal shoulder visible in the enlarged 2021 photograph. The `2` contour is unchanged; its later advance increases from 47 to 53 cap units. This distinction matters: changing the spacing between glyph starts does not require stretching the glyph outlines. The later `9` has an independently authored bowl and lower opening rather than inheriting a rotated `6` construction. The `3` receives a bounded coarse-contour correction, with the limitations of its single small source retained.

The later native advances are `0: 56.5`, `1: 36`, `2: 53`, `3: 51.5`, and `9: 52` in the authored 100-unit cap system. These are explicit per-glyph advances, not a whole-run tracking value fitted to a width score. The profile has no constructed fallback and no synthetic ink stroke. The dedicated `src/templates/dies/decal-modern-late-printing.json` avoids being overwritten by the existing early-profile generator.

The profile is bound to the fixed years 2019–2023. Later 2018 photographs show a different `0/1/8` group, but expiry month alone does not identify a replacement printing. Those six photographed variants remain documented and are excluded from an inferred production boundary. The selected 2018 JAN example keeps the early profile; the June/July 2017 transition is untouched.

The modern control contours remain unchanged. Enlarged 2020–2022 photographs add direct evidence for the previously weak `2` and `4` carryovers, as well as the other observed control digits. Their native Nimbus Sans Narrow Bold outlines remain an approximate printing candidate, not a historical identification. The repeated diagonal-flag `1` is retained.

## Evidence and exact input contract

There are **60 downloaded originals with 60 distinct hashes**: 57 small BCpl8s catalogue photographs and three independent enlarged Wikimedia Commons photographs. Seven catalogue originals duplicate the existing canonical reference set, leaving **53 additional photographs** relative to that set. Sixty downloaded files therefore do not mean sixty new specimens. The per-file ledger records each visible year, month, control, URL, hash, pixel dimensions, licence, printing group, duplicate status, and included/excluded use.

The 57 small photographs provide 228 year occurrences. The three enlarged photographs provide another 12 year occurrences and 24 control occurrences: **240 year occurrences and 24 control occurrences** in total. Each repeated glyph is kept as its own observation, while its photograph is counted once. The earlier enlarged 2015/2017 evidence remains documented in `docs/research/bc-modern-numerals`; it is additional to this supplemental inventory.

The independent originals are:

| Visible specimen | Original pixels | Attribution and description |
|---|---:|---|
| APR 2020 · **23747480** | 4205 × 1911 | [D5e58, 2020 file](https://commons.wikimedia.org/wiki/File:2020_British_Columbia_licence_plate_decal.jpg) |
| APR 2021 · **33502027** | 4461 × 1964 | [D5e58, 2021 file](https://commons.wikimedia.org/wiki/File:2021_British_Columbia_licence_plate_decal.jpg) |
| FEB 2022 · **71708687** | 2137 × 917 | [D5e58, 2022 file](https://commons.wikimedia.org/wiki/File:2022_British_Columbia_licence_plate_decal.jpg) |

All three Commons originals are attributed to D5e58 under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Their source-derived crops, masks and overlay figures in this directory retain that attribution/licence. Original upload URLs and full hashes are in the source inventory. The photographic derivatives are separate from the independently authored glyph source. The BCpl8s catalogue references are credited to [the gallery](https://www.bcpl8s.ca/Decals-Gallery.html); no reusable photograph licence was located there.

Five input corrections remain visible in the audit log:

1. `2020-17918347.jpg` visibly shows **AUG 2019**, so it contributes to 2019 evidence rather than 2020.
2. `2022-7484530.jpg` visibly shows **MAY 2022 / 74845430**; its filename omits a control digit.
3. The Commons 2022 page description says 2021, while its title and photograph show **2022**.
4. The preliminary audit transcription of the 2020 Commons control was `23743780`; direct enlarged inspection corrected it to **23747480**.
5. The preliminary audit transcription of the 2021 Commons control was `33560207`; direct enlarged inspection corrected it to **33502027**.

The latter two are errors in the preliminary audit, not errors attributed to the photographs. Their occurrence labels and comparisons were regenerated, and the originals were inspected again. Neither correction changed the year contours or the retained control profile. All 57 catalogue controls were also visually checked; their small control numerals are recorded as specimen inputs, not used as extra control-outline fitting samples.

## Per-digit decisions

Confidence describes the scope of these photographs, not historical authenticity. Counts below overlap across digits and must not be summed into a specimen count.

| Year digit/group | Evidence in this supplemental pass | Decision and remaining limit |
|---|---|---|
| Early `0/1/2` | 20 photographs of 2014/2016 plus five early 2018 photographs; prior enlarged 2015/2017 sources remain relevant | Retain early contours. Do not replace them with the later group. |
| Later `0` | 37 occurrences in 29 photographs; four occurrences in the three enlarged originals | Implement the wider, straighter-sided later construction. Photography still leaves small aspect and counter differences. |
| Later `1` | 16 occurrences in 16 photographs; one 879-pixel-high enlarged occurrence | Implement the narrower straight-shoulder form. Small sources corroborate its width; slight photographed slope remains. |
| Later `2` | 51 occurrences in 29 photographs; seven enlarged occurrences | Retain its contour and change the later advance. The diagonal, base and terminal still show local ink-spread differences. |
| `3` | One 46-pixel-high occurrence, MAR 2023 | Improve the coarse openings and width, but retain low confidence for fine contour details. More independent close photographs are needed. |
| `4` | Nine 2014 photographs, 53–56 pixels high | Retain the early contour. Repeated sources support its proportions; no enlarged source was obtained for the year `4`. |
| `5` | No additional year occurrence in this supplemental selection | Retain the prior enlarged 2015 evidence and existing contour. Do not imply new corroboration. |
| `6` | Eleven 2016 photographs, 56–60 pixels high | Retain the early contour. Counter/terminal details remain limited by small-image sampling. |
| `7` | No additional year occurrence in this supplemental selection | Retain the prior enlarged 2017 evidence and existing contour. |
| Early `8` | Five 2018 photographs, 48–50 pixels high | Retain the early contour. Six later 2018 photographs, 44–46 pixels high, show a different variant; that variant remains unmodeled. |
| Later `9` | Eleven 2019 photographs, 42–46 pixels high | Use the independent later bowl/opening construction. Repetition supports its coarse shape, but there is still no enlarged year `9` in this pass. |

For the **control** role, the new enlarged photographs supply `2` three times across two photographs and `4` twice within one photograph. Two occurrences in the same photograph are useful repeated-glyph checks, not two independent specimens. All 24 control occurrences are shown in the `enlarged/*-control/occurrences.png` boards. No control contour was changed as a result of this pass.

## Shape and spacing measurements

Every shape overlay normalizes source and model uniformly to equal painted height and aligns their horizontal centres. Each retains its own painted width. Magenta marks source-only ink, blue model-only ink, and dark pixels overlap. Neither independent horizontal stretching nor a photographic homography is used.

The following numbers compare the width of a whole year at that equal painted height. A ratio of 1 means equal width; it does **not** prove equal outlines or historical accuracy.

| Photographed year run | Previous width/source | Later profile width/source |
|---|---:|---:|
| 2019 JAN · 10727925 | 0.921 | 1.001 |
| 2020 JAN · 20726786 | 0.887 | 1.007 |
| 2021 JUL · 36946964 | 0.908 | 0.998 |
| 2022 MAR · 72919128 | 0.898 | 0.999 |
| 2023 MAR · 52843353 | 0.893 | 1.008 |

Across all 26 later catalogue photographs, the whole-year range improves from **0.867–0.952** to **0.984–1.045**. The small-source median individual `0` ratio changes from 0.903 to 0.987; `1` from 1.173 to 0.995; `9` from 0.943 to 1.010. These are diagnostics from the actual registered profile, not acceptance scores. The sources used to inform the construction are not a held-out validation set.

The independent enlarged photographs provide a useful check against fitting thumbnail blur. Their four `0` occurrences change from a previous ratio range of approximately 0.897–0.948 to 0.980–1.036. The enlarged 2021 `1` changes from approximately 1.221 to 1.036. This supports the direction of the change while preserving the remaining perspective, print-spread and contour uncertainty.

## Five placement corrections

Placement uses the pinned canonical source crop and the actual renderer's paint bounds. The baseline is the complete first-pass checkout at `24689246670c25f91e0d1676a0647f053dbca68e`. Source and model are displayed at equal **frame height**, retaining different frame aspects. Glyph shape comparisons above use equal **painted glyph height** instead; those are different measurements with different purposes.

Only the following photographed selections receive the new layout variants:

| Selection | Control | Scope |
|---|---|---|
| 2018 JAN | 50278580 | Early year profile; translate roles, uniform year/control cap changes, taller barcode |
| 2019 JAN | 10727925 | Later year profile; translate roles, uniform cap changes, narrower/taller barcode |
| 2020 JAN | 00000000 | Qualified all-zero catalogue sample; layout evidence does not establish ordinary issuance |
| 2021 JUL | 36946964 | Later year profile and corrected footer/column positions; month shape residual remains visible in this stage |
| 2022 MAR | 72919128 | Later year profile; conservative right margin because the unrectified source frame is broader |

`placement-proposals.json` provides complete exact-month variants and before/after paint bounds. `placement-results.json` provides separate source, baseline and proposed measurements. Month contours and cap sizes, province contours and cap sizes, and control glyph outlines stay unchanged in this placement stage. The year and control are resized **uniformly**; their wider allowed run bounds prevent unintended uniform shrinking from a maximum-width limit.

Province columns translate separately in x while retaining a shared vertical centre. The barcode width is based on its **painted bars**, not the entire encoding rectangle. The blank quiet zones are accounted for when solving the rectangle position/width; the control encoding is unchanged. Some rectangle x values are negative because a blank quiet zone extends beyond the drawn decal. Actual painted bars remain within it.

The new centre positions intentionally target the measured source centres, so tiny post-change numerical centre errors are not independent accuracy evidence. The source is only about 100 pixels tall. For 2022, exact frame-centred matching would place the year too close to the model's right edge: its unrectified crop is about 4.7% broader than the authored frame. The proposal keeps x = 0.98, retaining a visible right margin and an explicit residual of about four authored units left of the source centre.

The placement figure also exposes unresolved month proportions. At equal painted height, the retained month/source ratios are approximately 0.923 for 2018 JAN, 0.871 for 2019 JAN, 0.903 for 2020 JAN, 0.770 for 2021 JUL, and 0.988 for 2022 MAR. Translation does not correct those contours. The small province lettering remains an approximation, particularly its printed stroke and condensed forms.

A subsequent focused lettering comparison improves **2021 JUL** using native Anton outlines with separately supported `JU` and `UL` spacing. Its equal-height run-width ratio is about **0.957**, while the short `L` foot and a slightly high `J` hook remain explicit residuals. That change is scoped to the same exact 2021 JUL selection. See the [separate JUL proposal and residuals](../lettering/modern-jul-review/proposal.json), [native-candidate comparison](../lettering/modern-jul-review/native-candidates.png), and [metrics](../lettering/modern-jul-review/metrics.json). The original modern placement-stage figure/proposal is preserved for review; the root integrated gallery shows the composed result. The validator checks the separately documented month override exactly rather than silently allowing a changed month run.

The same focused follow-up improves **2018/2019/2020 JAN** through observed pair spacing while retaining their heavy-month-weighted contours. The separate spacing study reports width ratios of approximately **0.922 → 0.949**, **0.870 → 0.955**, and **0.902 → 0.979**, respectively; small raster-resolution differences account for rounding against the placement-stage ratios above. These are exact-JAN changes, not a replacement of every month in those years. See the [JAN spacing proposals and residuals](../lettering/modern-jul-review/jan-review/proposals.json). The integrated validator explicitly composes those three documented month-role overrides and still checks every year, control, province-column and barcode proposal exactly.

## Validation and reproduction

The final evidence validator checks every original hash, explicit inputs, accepted segmentation, the equality of research and production outlines, actual registered natural year runs, and the integrated bindings/variants. It passes **60 original hashes, 189 threshold samples, 240 year occurrences, 24 control occurrences, 20 natural rendered year/glyph runs, five year bindings, and five exact-month placements**. Rejected extractions are explicitly written even when empty.

Segmentation requires two intensity classes separated by at least 25 levels, the exact expected component count, no extraction-boundary contact, and a minimum painted height: 12 pixels for the small sources and 100 for enlarged sources. Every primary extraction is also checked at threshold offsets −8 and +8. A sample with an invalid sensitivity extraction is rejected rather than silently used. This is a guard against invalid masks, not proof that a photographed edge is the original printing contour.

From the repository root, with the complete first-pass checkout adjacent to it:

```sh
python docs/research/bc-decal-residuals/modern/fetch-evidence.py
python docs/research/bc-decal-residuals/modern/build-source-sheets.py
python docs/research/bc-decal-residuals/modern/analyze-year-occurrences.py
node docs/research/bc-decal-residuals/modern/render-candidates.mjs
python docs/research/bc-decal-residuals/modern/compare-candidates.py
python docs/research/bc-decal-residuals/modern/analyze-enlarged.py
python docs/research/bc-decal-residuals/modern/measure-placements.py
node docs/research/bc-decal-residuals/modern/build-placement-proposals.mjs
python docs/research/bc-decal-residuals/modern/build-placement-overlays.py
python docs/research/bc-decal-residuals/modern/build-coverage.py
python docs/research/bc-decal-residuals/modern/verify-evidence.py
```

`DECAL_PASS1_ROOT` can point to another complete first-pass checkout. `fetch-evidence.py` is offline validation by default. Its explicit `--fetch` option retrieves only missing pinned URLs sequentially, verifies the original hash before saving, and stops on HTTP errors without automatic retries or alternate-host fallbacks.

Inkscape raster/paint inspection is separate from browser validation. The parent integration review owns the full application/export/family checks; these scripts do not claim that a browser session ran.

## Remaining limits

The weakest year contour remains `3`, followed by fine details of the small-source `9` and the unmodeled later 2018 `8`. The apparent printing groups should not be converted into a complete historical issue chronology without additional documentation. More source pixels would help, but only independent, correctly transcribed examples strengthen the evidence.

Colour is uncalibrated. The photographs show wear, fading, lighting, compression, slope and layered substrates. Physical edge treatment and exact frame dimensions need separate evidence. No typeface name is established by a visual resemblance. Better placement, closer widths, and valid overlays are concrete improvements; they do not make the reconstruction an authenticated reproduction.
