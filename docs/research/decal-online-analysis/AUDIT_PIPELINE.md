# Reproducible decal inputs and conservative glyph measurements

This update supersedes the older report's input handling, automatic segmentation
and historical-baseline rebuild method. Existing generated HTML/JSON remains a
dated study until deliberately regenerated. The earlier README's typography
decisions and test counts describe that earlier capture, not current validation.

## Corrected source bindings

| Audit case | Correct comparison input | Correction |
| --- | --- | --- |
| 1977 | Seven-digit control `7006989` | The previous `70069890` had eight digits. The editor rejected it and generated an illustrative control, which the old audit did not detect. |
| 1999, thick border | MAY `54174570`, `1999-thick.jpg`, original crop `[1,1,243,74]` | `1999-60204824.jpg` shows a double-outline design and was paired to the wrong catalogue variant. The manifest now also carries the thick specimen's crop-specific inspection regions. |
| January 2017 | JAN `20993481` | The digits in the photograph differ from `20093481` in its filename. The filename remains the credited source URL; it is not the control transcription. |

The old values and reasons remain in each record's `bindingCorrection` field.
The 1983 faint control remains excluded from glyph scoring. The 2020 zero-control
photograph is retained with ordinary issuance explicitly unverified. July 2017 is
an official design illustration, not an issued-control observation; the other 67
comparisons use photographic sources. These are selected passenger-decal
references, not proof of identical construction across vehicle classes.

`scripts/decal-audit-inputs.mjs` validates explicit strings before calling the
production `decalArt` helper, then checks that it preserved them. Invalid lengths,
numeric controls, whitespace and invalid/missing months fail. Leading zeroes are
preserved. A null control omits a control from the audit instead of inventing one;
a monthly decal needs an explicit month to avoid guessing a design transition.
No pseudo-random day is presented as a source transcription. These rules apply
only to the audit: normal editor fallback behavior is unchanged.

## Source bytes and offline crops

The default build downloads original images when needed and verifies their
`sourceSha256` values before applying the recorded crops. The retained bulletin
JPEG has separate embedded-image and PDF provenance in the reference manifest.

`--cached-crops` is an explicit offline alternative. The new
`cached-crop-manifest.json` pins each local crop's bytes, dimensions, source URL,
recorded original hash and original crop coordinates. The 1999 thick-border cache
comes from `public/data/decal-review/sources/1999.webp`; other cached crops come
from the previous online gallery's `photo.png` files. A changed crop or changed
source binding fails validation. These are existing credited reference crops,
not newly downloaded originals.

Cached-crop results record `originalBytesVerified: false`. Their verified hash
covers **local cropped bytes only**. The original-source hash remains recorded
provenance and is never relabeled as verified in this mode. Regeneration preserves
an existing identical photo's bytes so a gallery used as an input cache is not
silently recompressed. Intentional source/crop changes require a reviewed cache
manifest update; do not blindly refresh hashes to make a failure disappear.

## Baseline reproduction

The former `renderer-before.ts` froze only part of the renderer and imported
current engine, glyph and artwork modules. Running it today does not recreate a
complete historical checkout. It is no longer used by the online export script.

By default, the export now produces **current-only evidence**, with no claimed
historical before image. Set `--baseline-root` to a separate, clean, complete Git
checkout to generate a comparison. Both checkouts receive the same corrected
source inputs. Their actual renderer modules and profile paint definitions are
loaded separately; no current profile is substituted for a baseline profile.
The output records each commit, working-change state, renderer-source hash,
manifest hash, and audit-script hashes. The baseline must have no tracked or
untracked working changes (ignored dependency directories are permitted).

The comparison is a newly reproduced baseline/current render, not an archived
capture of what a previous study showed. Its input corrections intentionally
differ from the erroneous earlier study. To compare this correction batch against
its starting point, use complete commit `17b974f51c687780c5d0b106fd9ae37e4c83ccae`.

## Source segmentation and spacing

The segmentation helper first proposes projection or connected-component windows.
Count agreement alone is insufficient. It rejects implausible cap-height
disparities, paint fragments, inconsistent vertical bands, implausibly wide
alphanumeric windows, crop-edge contact, contrast below 20 grayscale levels, and
material changes under threshold offsets of ±5% of the estimated ink/background
contrast. Those thresholds are conservative diagnostic gates, not a calibrated
measure of photographic certainty. A candidate passing them is still not an
independently verified character assignment.

Characters below **12 source pixels** receive no candidate score or measured
source gap. This closes the earlier inconsistency where 9–11-pixel characters
were labeled low-resolution but still scored. A measured source gap requires
both neighboring occurrences to pass the checks. Rejected/equal-partition windows
remain visible and keep their original occurrence identity, but their gaps are
null and their font scores empty. Invalid fragments are not enlarged into shape
comparison panels. The previous one-pixel 1970 “7” is a regression fixture.

Model coordinates have separate meanings:

| Field | Meaning |
| --- | --- |
| `modelGeometryBoxOnPhoto` / `beforeGeometryBoxOnPhoto` | Transformed SVG `getBBox()` geometry; does not claim painted stroke extent. |
| `modelInkBoxOnPhoto` / `beforeInkBoxOnPhoto` | Actual isolated glyph raster alpha above 127, including fill and stroke, at four raster pixels per SVG unit. |
| `modelInkGapAfter` / `beforeInkGapAfter` | Separation of those painted boxes along the inspected text direction. Null when paint is absent or clipped. |
| `sourceInkGapAfter` | Candidate source-paint separation only when both occurrences meet the conservative measurement gates. |
| `gapComparisonEligible` | Both source and current model gaps are available. |

The modern month's 2.5-cap-unit same-ink stroke is carried into both actual painted
bounds and diagnostic candidate rasterization. Baseline candidate shapes come
from the baseline profiles, not current profiles with matching names. The
self-contained `scripts/decal-audit-browser.mjs` extractor is shared by the Python
builder and any browser-based fixture harness.

All full-decal registrations still use uniform crop height and horizontal center;
they do not rectify a physical plane. Aspect discrepancies therefore remain
image-space diagnostics, not exact physical width corrections. Colour is
uncalibrated. Candidate overlap scores are threshold-dependent relative rankings,
not historical typeface identification or accuracy probabilities.

## Verification and regeneration

Run the focused checks without launching a browser:

```sh
node --test scripts/test-decal-audit-inputs.mjs
python3 scripts/test_decal_audit.py
python3 scripts/build-decal-online-analysis.py /tmp/plateforge-decal-audit --cached-crops --verify-only
```

Export all 68 current and baseline SVGs and provenance without rasterization:

```sh
python3 scripts/build-decal-online-analysis.py /tmp/plateforge-decal-audit --cached-crops --baseline-root /absolute/path/to/clean-baseline --render-only
```

This writes `/tmp/plateforge-decal-audit/render-data.json` and a separate
`source-verification.json` with each verified file/hash scope. In cached-crop mode,
that verification ledger identifies the exact local file to use in an independent
rasterizer, including the restored 1999 thick-border crop. The baseline needs the
project's dependencies installed or linked, but its tracked source must remain
clean. The SSR fixture disables dependency-entry discovery, file watching and
HMR; archived HTML reports are not application entries to scan.

On a runtime with a working Chromium/Playwright installation, first regenerate
the complete analysis into an isolated output for review:

```sh
python3 scripts/build-decal-online-analysis.py /tmp/plateforge-decal-audit --cached-crops --baseline-root /absolute/path/to/clean-baseline --output /tmp/plateforge-decal-audit/gallery --report-dir /tmp/plateforge-decal-audit/report
```

`DECAL_ANALYSIS_CHROMIUM` can select an installed Chromium executable; the default
is `/usr/bin/chromium`. A browser-launch failure is a blocked browser check, not a
successful screenshot or renderer validation. `--render-only` and Inkscape
comparisons can still validate source inputs and actual exported SVGs; they do not
stand in for running this browser extractor.

On that working browser runtime, also run
`python3 scripts/test_decal_audit_browser.py`. Its four focused fixtures check
stroke-inclusive gaps, preservation of explicit `stroke="none"`, rotated text
direction and page-edge clipping. It does not silently skip a failed launch.

After the shared renderer changes and isolated review are complete, deliberately
regenerate **all 68** published records in one run by omitting `--output` and
`--report-dir`. That updates `docs/research/decal-online-analysis/analysis.json`
and `public/bc-decal-online-review/`. Inspect both linked and standalone HTML,
source/baseline/current labels, rejected-segmentation rows, stroke-inclusive gaps,
vertical runs, mobile layout, and exported SVG/PNG behavior. Re-run the project
checks from the reconstruction workflow. Update validation counts only from this
completed run; old study counts must not be copied forward.

## Inkscape correction gallery

`scripts/build-decal-correction-overlays.py` consumes the captured v2 render export
and verifies the same pinned local crops. It can produce the complete correction
gallery without launching a browser:

```sh
python3 scripts/build-decal-correction-overlays.py --render-json /tmp/plateforge-decal-audit/render-data.json --output public/bc-decal-corrections
```

Run this after renderer edits have settled and a fresh paired export has been
captured. It creates `evidence/<id>/source.png`, byte-preserved `before.svg` and
`after.svg`, rasterized before/after PNGs, equal-height aligned images, and both
placement overlays. The source is explicitly resized to the shared comparison
height, including upscaling small crops; `thumbnail` is used only to downscale
already aligned canvases for contact sheets. The nine design families have
source/before/after/after-overlay contact sheets. `index.html` supplies specimen
and family selectors, before/after choice, opacity, blinking, and visual bounds.

`render-metadata.json` records original-crop hash scope, display-image and raw SVG
hashes, complete baseline/current capture provenance, Inkscape version, per-role
visual bounds, natural/reduced fit state, and alignment. Inkscape queries temporary
ID-tagged copies; raw generated SVGs are not rewritten. Full records preserve
working-tree state and source-code hashes from the export rather than guessing
them from the live checkout. No photographic accuracy score or cross-photo glyph
accuracy claim is produced.

For a diagnostic subset, use `--ids 1970,1999,2017-nov`, or pass a subset export.
If that export lacks `beforeSvg`, the builder requires `--before-json` explicitly.
It reads the supplied file's `svg` by default; use `--before-field beforeSvg` to
select the clean baseline from a paired v2 export. The baseline must carry a
commit, source hash and `workingChanges:false`. An older after-only subset without
source-code provenance is visibly labeled as such; its SVG bytes are still pinned.

```sh
python3 scripts/build-decal-correction-overlays.py --render-json /path/to/after-subset.json --before-json /tmp/plateforge-decal-audit/render-data.json --before-field beforeSvg --output /tmp/plateforge-subset-review
python3 scripts/test_decal_correction_overlays.py
```

`--verify-only` checks all selected source bindings and both printed transcriptions
before writing gallery artifacts. Optional `--dispositions-json` accepts an object
keyed by specimen ID or an array of records with `id`; the viewer displays those
review decisions without generating its own conclusions. Keep the final 68-case
regeneration separate from diagnostics and inspect the resulting contact sheets.

## Browser CI gate for all selectable months

`scripts/verify-decal-browser-geometry.mjs` uses the existing
`render-decal-typography-fixtures.mjs` exporter and the repository's
`TYPOGRAPHY_BROWSER` / `TYPOGRAPHY_BROWSER_DEPS` convention. The typography workflow
runs it after the application/export checks in each Chromium, Firefox and WebKit
job. It writes `typography-evidence/browser-<browser>/decal-geometry.json`, which
is included by the existing browser artifact upload.

The gate requires exactly 572 unique catalogue/month renders across all 55
variants. It checks root-coordinate `getBBox()` geometry expanded by declared
`data-ink-padding`, run/barcode collisions, actual character occurrences against
printed labels, month/year/control inputs, and generated Code128 bar sequences
against the control. Code128 is decoded from bar widths and gaps and its checksum
is verified; a matching `data-control` attribute alone is insufficient. The
untranscribed 1983 catalogue control is explicitly classified as an illustrative
editor default. The observed MAY runs for 1998 Type II and thick-border 1999 must
fit naturally, and the established NOV 2014 / MAR 2023 minimum-height guards remain.

Those 572 browser bounds are **approximations**, separate from Inkscape visual
paint bounds. One additional MAR 2023 fixture runs `extractAuditRuns` and confirms
that actual alpha bounds retain the added month stroke, preserve all three
letters, and contain no empty/tiny glyph windows. It exercises the repaired
browser extractor without claiming that every 572-case box was raster-measured.

Pure checks can run without Playwright or a browser launch:

```sh
node --check scripts/verify-decal-browser-geometry.mjs
node --test scripts/test-decal-browser-geometry.mjs
```

The actual browser command is `node scripts/verify-decal-browser-geometry.mjs`
with the two browser environment variables configured by CI. A browser launch
failure records `status: "blocked"` and exits unsuccessfully; it is never reported
as a completed geometry check. The browser loop has a four-minute budget and the
workflow step has a six-minute limit.
