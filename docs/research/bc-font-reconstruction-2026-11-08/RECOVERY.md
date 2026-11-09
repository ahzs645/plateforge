# B.C. font continuation recovery — 8 November 2026

This release continues the November 7 review from the available source and
evidence. It does **not** republish or claim to reproduce the missing complete
source tree of `93a100a4ede6c73b02e720960114cb17a617f6cf` or `f34cbab`.

## What was available

- Current `main`: `68d5fe07cf8b72cf3afb932d6b59d631b7eb2893`, containing the
  published BC decal correction release from PR #18.
- PR #17's complete source: `87f1250912301848bb0d86be86bc6769d9f56de3`, containing
  the passenger selection fixes, renderer audit, original frozen comparison and
  browser checks.
- The saved standalone file `Plateforge_BC_Font_Continuation_2026-11-07.html`.
  Its SHA-256 is
  `4c2b7eaea97b245c81670f0b61643594216b65b90d9c2d8d8159cfe75d05c911`.

Neither missing source checkpoint was present in GitHub or the accessible local
recovery files. Searches of saved artifacts and the connected Drive did not
locate a November source bundle. An older research archive was found but was
not used as evidence that either November checkpoint had been recovered.

## What the report actually recovered

The report contains **74 embedded figures**, including vector comparisons as
well as raster figures. Its historical source inventory describes nine
photographs and 54 serial-character occurrences, including repetitions.

The embedded SVG comparisons preserve the exact filled paths of U, Y and Z,
their reconstruction identifiers and their source URLs. Those three paths can
therefore be restored from the report, with fresh implementation tests. The
report's stated 53-unit advances are checked against the preceding production
fallbacks before use.

The Astrographic 3 and Classic 4 N comparisons survive as raster figures. They
show the intended rounded inner joins but do not preserve the old masters'
exact path data. The current two N masters are new source-informed recreations
from the original photographs. Their provenance identifies them as November 8
work. The current comparison generator uses the actual current renderer, not
the historical raster as a substitute for a newly rendered result.

The complete review-state source, grouping changes, generators and two-tab
browser test from the missing checkpoint were not recovered. Those components
have been implemented and validated anew. The old report's **1,997 tests** is a
historical result; it is not the test count for this release.

## Preserve the original evidence without changing its history

The [archived report](../../../public/bc-font-reconstruction-archive/index.html)
retains its original text and all original figure bytes. A prominent notice
separates its historical validation/publication statements from the current
release. Each figure has a content-derived filename and a SHA-256 entry in the
[archive manifest](../../../public/bc-font-reconstruction-archive/manifest.json).

`scripts/archive-bc-font-review.py` externalizes the embedded images without
changing their contents. Before adding the archive notice, it reconstructs the
original report and requires exact byte equality. The committed archive can
also reconstruct and verify the original report's SHA-256 without access to the
original saved file:

```sh
python3 scripts/archive-bc-font-review.py --check
```

The source photographs retain their original owner credits. Their hashes,
individual occurrences and current comparison limitations are recorded in the
new study. Original photographs used to construct the glyphs are not independent
holdout validation specimens.

## Integration boundaries

The release includes PR #17's passenger selection fixes while retaining the
published decal corrections and current browser/build workflow. It introduces
the five narrow passenger masters outside the generated research registry and
protected source geometry. Similar lettering on a motorcycle, collector,
commercial or other-small plate does not establish the same tooling, so those
contexts do not automatically acquire the passenger recreations.

The original PR #17 before/after comparison remains a historical selection
comparison. Current audit and reconstruction comparisons have their own input
fingerprints and validation. A newly passing build or exported SVG does not
establish complete photographic or historical accuracy.

## Review records

The new queue records decisions for individual components and the exact
rendering/evidence reviewed. A change to notes or reviewer metadata must not
silently approve a changed rendering. Concurrent edits must preserve a local
draft and show the newer saved record before an explicit replacement.

No saved user review records were recovered from the missing source checkpoint.
The new export format identifies unresolved drafts separately from saved
decisions. Browser storage remains local to that browser and origin; an export
is required to move a review to another device.

See the current study and release validation for the actual implemented scope,
fresh commands, results and remaining evidence questions.
