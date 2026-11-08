# B.C. decal corrections — 7 November 2026

**Publication follow-up, 7 November 2026:** the user explicitly authorized pushing both reviewed decal passes to `main`. The publication-status paragraph below records the earlier pre-publication state; the original evidence and validation capture remain unchanged.

**Follow-up review:** the [second overlay and implementation pass](../bc-decal-residuals/README.md) works through the remaining lettering, placement, province and substrate issues, including all 28 references retained here. This document and its gallery preserve the first-pass baseline and findings.

This pass implements the supported corrections from the overlay review in four reviewable batches. The baseline is the complete clean checkout at `17b974f51c687780c5d0b106fd9ae37e4c83ccae`. The revised production source is recorded in the generated gallery metadata; both sides use the same corrected explicit specimen inputs.

**Publication status:** the four batches are committed locally. Automatic approval rejected the GitHub push because publishing the repository changes and generated evidence assets requires explicit authorization. Browser/export CI therefore remains pending that authorization; no PR or deployment is claimed.

The correction set changes lettering or geometry for **25 catalogue variants**, represented by **38 of the selected reference cases**. Two more cases receive evidence-only corrections. The other 28 references are retained with their unresolved findings recorded. **31 before/after raster pairs change visibly**; seven EXPO selections inherit the corrected profile while their used contours remain unchanged. These counts describe the review scope, not a claim that all remaining visual differences are solved.

## Review the result

- [Interactive source / before / after viewer](../../../public/bc-decal-corrections/index.html): 68 selected references, nine families, model opacity, before/after selection and blinking.
- [Case ledger](case-ledger.csv): every selected reference, what changed, what remains, exact month/control and source link.
- [Source and renderer metadata](../../../public/bc-decal-corrections/render-metadata.json): hashes, input verification, complete-checkout provenance, painted bounds and fitting states.
- [Full selectable-family paint check](family-ink-verification.json): all 572 catalogue/month combinations across 55 variants.
- [Validation record](validation.json): commands, results, limitations and CI handoff.

The selected evidence contains 67 photographic references and one official July 2017 illustration. A photographic reference is not independent proof of ordinary issuance. In particular, the 2020 zero-control example retains its qualification. The 1983 control is faint and tentative. Annual-only entries are not expanded into invented monthly specimens, and the historical 1973/1979 gaps remain intact.

## Batch 1 — correct the evidence before measuring

| Problem | Correction |
|---|---|
| 1977 audit supplied an eight-digit value to a seven-digit control field | Use the visible `7006989`; malformed explicit input now fails before an editor fallback can conceal it. |
| Thick-border 1999 was compared with a double-outline NOV image | Restore the matching thick-border **MAY / 54174570** source and inspection regions. |
| January 2017 copied a misleading filename transcription | Use the visible **20993481**. |
| A one-pixel 1970 segment was treated as a letter | Reject invalid segmentation before scoring or reporting source gaps. |
| The old historical renderer froze only part of its dependencies | Render a separate, clean, complete baseline checkout. |
| Geometric glyph boxes omitted added ink stroke | Keep geometry and stroke-inclusive painted bounds separate; preserve `filledStroke` in comparison rasters. |

The audit checks both requested values and actual printed `data-character` sequences. Leading zeroes are preserved. This strict policy applies to research/audit inputs; normal editor fallback behaviour is unchanged.

The current regeneration uses the 68 pinned repository crop files. Their hashes are verified. The report explicitly records **`originalBytesVerified: false`** because checking those crops does not verify the remote original-image bytes. Original source URLs and previously recorded provenance remain available rather than being replaced by a stronger claim.

See [audit pipeline details](../decal-online-analysis/AUDIT_PIPELINE.md).

## Batch 2 — ink, margins, frames and composition

**1984:** the control now prints in dark ink on the pale right strip. It is independent of the light month/year ink. The actual-scene regression verifies the control text, separate inks and contrast.

**1999 white / 2000–2003:** the outer and inner outline radii are separately specified and concentric. The thick-border 1999 variant keeps its separate square frame. The radii are a photographic reconstruction, not a measured historical manufacturing specification.

**1983:** JUN gains left clearance and a raised baseline. Its existing glyph candidate is retained; this does not establish that the word's shape is exact.

**2004:** MAR, `04`, both province lines and the control are calibrated separately. This improves the composition while keeping the narrow year and tiny province lettering as explicit residuals. The small source and its different frame aspect do not justify independent horizontal stretching.

The integrated late-case review found another functional defect: the two-digit barcode renderer ignored the available audited rectangle. It now reads the selected layout, as the modern branch already did. A regression checks the observed May 2011 placement, the unchanged following month, exact leading-zero control and in-canvas bars.

See [placement diagnostics](geometry-placement-diagnostics.json). These are manually isolated image regions and approximate photograph extents, not typography identity measurements.

## Batch 3 — separate glyph shape, spacing and placement

### 1972

The `72` construction is supported by two photographs. Only the observed `7` and `2` are provided. The new smooth contours and authored advances fit naturally; the renderer does not squeeze the word to a target rectangle. The primary equal-height width discrepancy falls from about 23.5% broad to about 0.9% broad.

[1972 evidence and candidate comparisons](annual-1972/README.md)

### 1986 EXPO

P/R bowls are reconstructed from the observed MAR, APR and SEP letters. The R/T/V repair removes transparent regions caused by overlapping contours painted with an even-odd fill. P/R have authored advances; unaffected observed glyph advances are retained. Supported AR/PR spacing is explicit.

All twelve month selections and repeated glyph occurrences are reviewed. The supplied EXPO logo master is retained: an independent comparison did not support the earlier suspicion that its word/symbol proportions needed changing. Print weight remains uncertain because scan blur and ink spread can imitate heavier artwork. The unrelated Frankfurter souvenir-plate artwork is also unchanged.

[EXPO evidence, all months and independent logo trials](expo86/README.md)

### Modern years and controls

The large expiry-year numerals and small control numerals use separate profiles. Year `0/1/2/5/7` have the strongest enlarged-reference support; `3/4/6/8/9` are lower-confidence clean constructions. Controls retain native Nimbus Sans Narrow Bold tabular advances and nine native outlines; only the observed diagonal-flag `1` is reconstructed. The enlarged control lines do not establish control `2/4`.

The existing modern month construction is retained. Source-supported translations and barcode-footprint changes are applied independently to 2015, later 2017 and 2023. The July 2017 design boundary remains intact. Barcode measurements distinguish actual bars from the rectangle that also includes quiet zones.

The 2015 control photograph slopes across the line. Its remaining whole-run width discrepancy should not be removed by squeezing the glyphs: the individually normalized repeated `0` and `1` occurrences already agree much more closely.

[Modern numeral shapes, repeated occurrences and confidence limits](../bc-modern-numerals/README.md)

### Observed MAY, AUG and OCT selections

The 1998 Type II and thick-border 1999 MAY forms use independently authored M/A/Y shapes and an explicit `AY: -14` pair adjustment. The A and Y's bounding boxes can overlap while their strokes remain separate. Their actual runs fit naturally. The 1999 source still leaves a roughly 7.6% width residual at equal height; it is not hidden by reducing height or compressing the run. These profiles apply only to May.

The 2008 AUG uses the unchanged native Bebas Neue 400 candidate, while its fixed `08` uses native Oswald 400. In 2011, MAY's existing shape is retained because it is already close; placement is the principal correction. The 2013 OCT uses a limited O/C/T construction. Supported `11` and `13` pair spacing is separate from the contours. Supplemental province/control/barcode calibration is confined to the photographed month selections.

[MAY findings](../bc-modern-numerals/bordered-may.md) · [2008 / 2011 / 2013 findings and integrated overlays](../bc-late-two-digit-printing/README.md)

### Equal-height width diagnostics

Both source and candidate are uniformly normalized to the same painted height and centre. Width remains free to differ. A ratio of 1.000 means equal width under that registration; it is not an overall accuracy score.

| Run | Before / source | After / source |
|---|---:|---:|
| 1972 year | 1.235 | 1.009 |
| 1998 Type II MAY | 1.141 | 1.002 |
| Thick-border 1999 MAY | 1.225 | 1.076 |
| 2008 AUG | 0.839 | 1.014 |
| 2008 year `08` | 0.806 | 1.021 |
| 2011 MAY | 0.995 | 0.995 |
| 2011 year `11` | 1.031 | 0.975 |
| 2013 OCT | 1.146 | 1.000 |
| 2013 year `13` | 1.073 | 0.997 |
| 2015 year | 1.139 | 1.005 |
| November 2017 year | 1.166 | 1.026 |
| 2015 control | 1.283 | 1.079 |
| November 2017 control | 1.225 | 1.030 |

The linked role reports retain source crop boxes, threshold choices, source hashes and before/after glyph evidence. Low-resolution, sloped and unrectified photographs limit precision.

## Batch 4 — verify the complete selectable family

The final SVG paint check covers **572 combinations**: 47 monthly catalogue entries multiplied by 12, plus eight annual-only entries. It checks actual Inkscape visual bounds, including stroke, along with clipping, text/barcode run-box collisions, printed glyph sequences, barcode control values, natural MAY fitting and existing source-supported month-height guards.

The CI browser check independently visits the same 572 fixtures in Chromium, Firefox and WebKit. It labels its `getBBox` plus declared-padding bounds as an approximation, decodes generated Code128 bars independently, checks explicit inputs and exercises the audit extractor's real alpha bounds on a weighted modern month. The application export suite also covers 21 selected corrected reference cases and an editable leading-zero case, comparing preview/PNG output and checking portable SVG content.

The local Chromium launch is unavailable because its singleton socket is prohibited; automatic approval rejected the requested sandbox exception. Browser results must come from the normal review CI. Local SVG paint verification is not substituted for browser/export success.

The broad local Vitest invocation was terminated with SIGKILL in the large generated-format test file. The complete suite subsequently passed without reducing sample counts: 1,166 tests in the other 69 files, plus all 800 tests from that file in two disjoint name-filtered runs. The production build passed. The validation record preserves this distinction.

## Reproduce the evidence

Create a clean complete checkout at the baseline commit and give its absolute path below. It needs the repository's installed dependencies. The audit refuses a dirty or partial baseline.

```sh
python3 scripts/build-decal-online-analysis.py /tmp/bc-decal-corrections \
  --cached-crops --baseline-root /absolute/clean/baseline --render-only

python3 scripts/build-decal-correction-overlays.py \
  --render-json /tmp/bc-decal-corrections/render-data.json \
  --output public/bc-decal-corrections \
  --dispositions-json docs/research/bc-decal-corrections/case-dispositions.json

node scripts/render-decal-typography-fixtures.mjs /tmp/bc-decal-fixtures.json
python3 scripts/verify-decal-ink-bounds.py \
  --fixtures /tmp/bc-decal-fixtures.json \
  --output docs/research/bc-decal-corrections/family-ink-verification.json

python3 scripts/export-decal-correction-review.py --output /tmp/bc-decal-review-files

npm test -- --maxWorkers=2
BASE_PATH=/plateforge/ npm run build
```

The overlay viewer uses a common frame height and horizontal centre while preserving each image's aspect ratio. It makes no perspective correction. Source-frame differences therefore remain visible in whole-decal overlays. This registration must not be confused with the separate painted-height glyph-shape comparison.

## Remaining work

The case ledger retains the 28 unchanged references and their specific findings. Within the corrected cases, the largest stated residuals are thick-border 1999 MAY width, 1983 JUN proportions, 2004 year/province detail, lower-confidence modern numerals, and tiny 2008/2011/2013 province forms. Existing specimen-specific placement differences also remain: examples include the 1990–1992 control lines and several retained 2018–2022 month/year/province positions. Original supplied emblem masters remain independent artwork components. Exact historical font identity, colour calibration, physical edge treatment and ordinary issuance of a particular collector specimen are not established by these overlays.

Further changes should follow the same sequence: bind the exact source, isolate each printed role, check contour at equal height, examine repeated letters, adjust only supported spacing, place the whole run, then regenerate every affected month and re-run export checks.
