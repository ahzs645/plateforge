# BC passenger glyph recovery and reconstruction — 2026-11-08

This study restores three exact vector paths from the recovered November 7
report and adds two newly recreated N masters. It does **not** recover commits
`93a100a` or `f34cbab`, their implementation modules, or the former N coordinates.
The source-informed masters remain qualified recreations, with no independent
holdout specimen and no complete-alphabet approval.

## What was recovered and what is new

The report `Plateforge_BC_Font_Continuation_2026-11-07.html` has SHA-256
`4c2b7eaea97b245c81670f0b61643594216b65b90d9c2d8d8159cfe75d05c911`.
Its extracted archive is preserved under
`public/bc-font-reconstruction-archive/`, with an exact asset manifest.

| Master | Recovery | Scope | Photographed observations |
| --- | --- | --- | --- |
| Modern U | Exact filled path in report SVG occurrence 8 | Ordinary `2025-flag` / `bc-waldale` | U at occurrence 6 of A90-7GU |
| Modern Y | Exact filled path in report SVG occurrence 14 | Ordinary `2025-flag` / `bc-waldale` | Y at occurrence 6 of A82-0EY |
| Modern Z | Exact filled path in report SVG occurrence 20 | Ordinary `2025-flag` / `bc-waldale` | Z at occurrence 6 of A25-0EZ |
| Astrographic 3 N | New November 8 authored path; prior N figure was raster-only | Ordinary `1985-flag` / selected `bc-astro-3` | N at occurrence 1 of NJB-300 |
| Classic 4 N | New November 8 authored path; prior N figure was raster-only | Ordinary `1985-flag`, or selected `2001-flag`, / `bc-astro-4` | N at occurrences 1 and 3 of NPN-030 |

All five original photographs downloaded on November 8 match the original
SHA-256 hashes recorded in the recovered report. `sources.json` records URLs,
credits, exact hashes and original dimensions, source crop boxes, approximate
paint extents, inferred physical corners and the limits of each comparison.
The original JPEG files are retained in `sources/`. Source rights remain with
BCpl8s.ca / Christopher John Garrish and credited contributors.

The restored U/Y/Z paths keep their prior report IDs. Their exact recovered
coordinates establish continuity of those vectors, **not** historical tooling
accuracy or recovery of the full lost implementation. The new N IDs include
`20261108`. Their clean cubic inner transitions are designed from the source
paint's broad rounded joins, without tracing embossing shoulders, chipped paint
or photographic noise. Type 3 and Classic use independent shapes and retain the
preceding research outlines' outer widths of 45.938 and 49.062 cap units.

## Application behavior and safeguards

`src/templates/dies/passenger-reconstruction.ts` defines the five filled masters.
`research-dies.ts` applies them using the **outer plate format**, independently
of a nested context used to borrow a passenger research pool. This is necessary
because collectors, commercial and small plates can deliberately borrow those
pools. Their previous geometry remains unchanged. The only new-series scope is
ordinary `2025-flag`; trial, earlier passenger, motorcycle and other classes do
not acquire U/Y/Z from these three photographs.

Each master has the **same filled path in production and research mode**. Its
advance is copied from the preceding glyph in the active mode. U/Y/Z retain
53-unit advances; N retains each profile's existing production or research
advance. Changes to contours therefore do not move following characters or
change run fitting. Unchanged glyphs retain their preceding paths and advances.

Reconstruction is available even if the research registry is disabled or has
not loaded. It applies to serial rendering and its width measurement; it does
not replace unrelated slogan/legend/date lettering. The production profiles and
generated research registry are not edited.

Rendered glyphs have `data-provenance="profile-override"`, plus explicit
`data-reconstruction-id`, `data-reconstruction-status="source-informed"`,
`data-reconstruction-source` and `data-reconstruction-recovery` attributes.
The latter is `report-vector` or `new-2026-11-08`. Recreated N is removed from
the research-character/source-unit maps because its path no longer equals the
registry candidate. It is never mislabelled as an observed registry outline.

The selected 2001 Classic application is a reuse of the same model profile.
This study supplies no additional 2001 N specimen, so it does not independently
verify that application or establish identical tooling across dates.

## Comparisons and findings

`public/bc-font-reconstruction/` provides the fresh review page, 30 occurrence
figures, nine whole-serial placement overlays, source display copies and two
1200-pixel PNG overview images. The 30 observations retain all six characters
from every source plate. Repeated Ns and zeros remain separate observations;
the two Ns on NPN-030 do not count as independent holdouts.

“Previous production” and “Previous research” mean the preceding application
profiles, with the new reconstruction layer excluded. They do not represent
the unavailable November 7 N master. The renderer is the same in each case;
the study uses an outer comparison context to exclude the narrowly scoped new
layer, while preserving the exact inner research pool and full serial layout.

For **shape**, the actual vector ink bounds and photographic paint extents are
aligned at a common height and centre using uniform scaling. No separate width
fit is permitted. U/Y/Z use image-plane comparisons and preserve unresolved
foreshortening. Their 18 original report crop rectangles and alignment values
were recovered from embedded SVGs; every crop matches the downloaded original's
pixels exactly. Both N photographs use one rectification from visible physical
shell edges to a 2:1 plane. Approximate paint boxes measure extents, not contours.

For **placement**, the entire photograph receives one shell-corner homography
and the renderer's 300×150 plate coordinates are kept unchanged. The comparison
layer omits separator artwork only; serial positions and flag-space advances
remain intact. No per-glyph translation, height fit or width fit is applied.
Corners are manually inferred from straight shell edges around rounded corners,
with ±8 px uncertainty for the high-resolution N sources and approximately
±2 px for the small Y source. These are visual registration estimates, not
calibrated measurement errors. U and Z placement is withheld because holders
obscure their upper physical corners.

The strongest visible change is the N's broad inner diagonal transition. The
preceding production and research contours have deep sharp notches; the new
paths replace those with rounded joins seen in all three N occurrences. Type 3
still has visible inward block placement and compressed numeral positions in
the whole-serial comparison. Classic still has digit offsets and cap-height
differences. These residuals were not hidden by fitting each character.

The restored Y has the source-informed rounded fork. U's bowl and Z's diagonal
joins differ from the previous stroked constructions, while width and
perspective residuals remain apparent in the small photographs. The Y
plate-plane overlay retains residual cap-height/registration uncertainty. None
of these comparisons constitutes a precise contour or historical-accuracy
claim. Independent specimens are needed before stronger conclusions.

The broader six-family study survives in the dated archive. Its remaining
A-counter, 3-waist, 6/9-terminal, K-join, cap-height and spacing questions are
not settled by these five masters. Separate motorcycle and small-plate evidence
is still needed.

## Reproduce the study

Run from the repository root. The render step uses the application's installed
Vite dependency. Python needs Pillow and numpy. PNG and SVG ink-bounds rendering
uses `sharp`, loaded from a local installation or the managed runtime's
`CODEX_PRIMARY_RUNTIME_NODE_MODULES` directory. It is a study tool, not an added
application dependency.

```sh
python docs/research/bc-font-reconstruction-2026-11-08/fetch-sources.py
python docs/research/bc-font-reconstruction-2026-11-08/recover-report-crops.py
node docs/research/bc-font-reconstruction-2026-11-08/render.mjs
python docs/research/bc-font-reconstruction-2026-11-08/build-comparisons.py
node docs/research/bc-font-reconstruction-2026-11-08/rasterize.mjs
python docs/research/bc-font-reconstruction-2026-11-08/verify.py
npm test -- src/templates/dies/passenger-reconstruction.test.ts src/templates/dies/research-dies.test.ts --maxWorkers=2
```

For a lightweight CI check, the following commands need only the app's existing
Node dependencies and Python's standard library. The first compares freshly
rendered glyph/serial SVG, advances and provenance against `rendered.json`;
it reuses stored ink bounds instead of loading an image renderer. The second
checks the source/rendered fingerprints, generated SVG/WebP/HTML/PNG hashes,
all occurrence geometry and preserved serial transforms, without rewriting
files. Run the full regeneration above after geometry or evidence changes.

```sh
node docs/research/bc-font-reconstruction-2026-11-08/render.mjs --check
python docs/research/bc-font-reconstruction-2026-11-08/verify.py --check
```

The targeted suites passed **35 tests across two files**. They check exact
U/Y/Z path recovery from the archived vectors, preservation of all advances and
unmodified characters in both modes, real-render provenance, nested class
isolation, registry-unloaded behavior, exception restoration, stable edited
serials and separation of nonserial roles. The comparison verifier checks 60
mode-specific character occurrences and 10 full serial placements, including
all repetitions, and verifies the original and overview image hashes.

See `glyph-validation.json` for the fresh scoped receipt. Full-suite, production
build, browser and deployment results belong to the release validation and are
not claimed by this file.
