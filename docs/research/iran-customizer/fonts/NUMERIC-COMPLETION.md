# Complete source-specific numeric repertoires

The numeric source studies support arbitrary ten-digit input. Original observed
contours stay unchanged. Absent digits are **original source-style reconstructions**
with per-glyph `provenance: "inferred"`; they are not certified die shapes. Licensed
candidate profiles remain separately identified and are never substituted silently.

## Coverage and review

- `numeric-coverage-report.json` records every source main/role numeric alphabet,
  its observed/inferred/missing digits, source image and URL, cap/baseline, and every
  inferred glyph's design rationale
- `numeric-repertoire-01.svg` and subsequent numbered sheets show every alphabet
  beside its source photograph. Dark **O** means observed; ochre **I** means inferred
- The seven complete licensed candidates remain indexed in `coverage-index.md`;
  they are not source-observed profiles
- Class letters, city initials, complete wordmarks and nonnumeric roles remain
  bounded to their declared coverage. Completing digits does not invent those
  alphabets or authorize unsupported text

The 1947–1963 year roles and city extension roles have their own master outlines.
The small 1947 tab uses a flat crown, while the 1949 and 1954 tabs use independently
constructed block crowns and heavier strokes. They are not reduced main-row
outlines. 1949's stepped terminal system, the post-1963 squared six, later hooked
sixes and right-leaning city-band forms retain explicit local design hypotheses.
Where a photograph shows only one digit (notably consular and UNIIMOG), the
completion is low-confidence stylistic inference, not further photographic evidence.

## Inference metadata and metrics

Each inferred item records:

- `provenance: "inferred"`
- `inference.method`, `inference.basisCharacters` and concrete `designNotes`
- an explicit inferred `note` and source-linked `sourceId`
- no invented source crop or observed occurrence

The runtime emits explicit inferred warnings and SVG provenance. Every numeric
alphabet has one cap scale and baseline; paths retain their native widths and
individual natural heights. No individual horizontal squeezing, font-glyph alias,
bitmap trace or paint-wear contour is used. Source `sourceAdvance`, when supplied,
is uniformly normalized; otherwise advances use the clean contour width with
consistent four-unit sidebearings.

## Rebuild and verify

The JSON study files are authoritative source inputs. To reproduce the Persian
inference construction after authoring changes:

```sh
python docs/research/iran-customizer/fonts/complete-persian-numerals.py
python docs/research/iran-customizer/fonts/check-observed-paths.py
python scripts/build-iran-fonts.py
python docs/research/iran-customizer/fonts/build-numeric-review.py
npx vitest run src/templates/iran-custom-fonts.test.ts
```

`check-observed-paths.py` verifies all 152 pre-existing observed glyph paths and
observed provenance against their pre-completion SHA-256 records. New source
studies are additional, separately audited inputs. Legacy authoring scripts that
recreate only the original observed studies must be followed by numeric completion;
do not replace the authoritative completed JSON with an older subset.

Tests require every numeric source main and contextual alphabet to render 0–9 in
strict mode without fallback or candidate substitution. They check inference
metadata, candidate-path non-aliasing, linear cap scaling and the original observed
specimen strings. Truly missing letters, roles and unknown words remain tested
strict failures.

All source-image rights and critical-study restrictions remain unchanged.
Completion does not confer source-photo redistribution rights or authenticate a
historical font.
