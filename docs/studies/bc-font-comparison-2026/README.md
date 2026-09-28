# Plateforge: modern B.C. serial-lettering comparison

Study date: 28 September 2026.

## Open the comparison

Open `output/bc-font-comparison.html` in a modern browser. The geometry and all
notes are included in that file. Select **Load online references** to display the
three original BCpl8s photographs and the two published font specimens. Those
five external image files require an internet connection. Source links remain
available when a site prevents an image from loading.

`output/geometry-comparison.png` is the offline overview of the four procedural
variants. It is NOT a composite of the photographs or the two downloadable fonts.

## What was actually done

- Selected `skeleton.ts` formulas and the `bc-waldale` parameters were manually
  transcribed from Plateforge's public `main` source as inspected on the study
  date. The transcription was executed in an isolated Node.js harness.
- Four alternatives were rendered for `098 SJF`, `976 SKP` and `JA7 91L`:
  current; a zero-only stadium override plus stock curved seven; global stadium
  plus stock curved seven; and the zero override plus an exploratory seven.
- Reference photographs were visually inspected through web tools. There was no
  automated local photograph segmentation, perspective correction, overlay
  registration, or image-match percentage.
- Driver Gothic and Dave Hansen's License Plate were compared using their
  published specimen images, not installed font binaries. This is NOT a fresh
  rendering of those fonts in the three registration strings.
- 11 isolated harness checks and four offline HTML interaction/layout checks
  passed. Neither set is Plateforge CI or a claim of font accuracy.

Direct GitHub cloning and binary downloads into the execution environment
failed. No commit-pinned checkout or full application build was performed.

## Findings

The zero-only change is supported by the straight-sided zero in `098 SJF`.
The stock curved seven gains the right lower-end direction but its upper bend
is still unlike the two photographed sevens. The exploratory seven illustrates
a more promising bend, but is hand-set rather than fitted or validated.

The commercial/free font specimens have more upright hooked six/nine forms,
where the B.C. photographs have sweeping diagonal extensions. Their narrower
construction and other details also differ. These are not exact substitutes.
The current procedural six/nine construction is more promising, although it
still requires outline, terminal and paint/embossing refinement.

Changing the global bowl style is not equivalent to fixing zero: it also changes
6, 8, 9 and P. The test does not establish a net improvement from that global
change. P needs a more rounded-rectangular enclosure, J a small top projection,
and the A/1 details also deserve individual attention. No production patch has
been applied or validated.

## Run the isolated checks / regenerate the SVGs and HTML

A recent Node.js installation is sufficient; no npm dependencies are needed.
Run from this directory:

```sh
node test-study.mjs
node render-study.mjs
node build-report.mjs
```

The renderer deliberately supports only the characters used in this study;
unsupported input raises an error instead of silently substituting a font.
The displayed geometry retains the source width 53, stroke 11 and tracking 8
at a nominal 100-unit cap-height. Padding allows square-cap overshoot to remain
visible. Each variant is calculated independently, without shared die-cache
state.

The optional Python browser check requires Playwright and Chromium. The supplied
script used `/usr/bin/chromium` and a local DejaVu Sans font to test the file-input
panel only. Edit those paths for another environment. This system-font smoke
check is not one of the candidate-font comparisons. It does not export the font.

To regenerate the PNG with CairoSVG installed:

```sh
python -c "import cairosvg; cairosvg.svg2png(url='output/geometry-comparison.svg', write_to='output/geometry-comparison.png')"
```

## Files

- `glyph-study.mjs`: selected source formulas and explicit experimental variants.
- `test-study.mjs`: isolated assertions; writes `output/test-results.json`.
- `render-study.mjs`: comparison board and 12 registration-strip SVGs.
- `build-report.mjs`: self-contained HTML and source manifest.
- `browser-check.py`: offline HTML checks; writes browser results/preview.
- `output/sources.json`: original source URLs and specimen descriptions.
- `output/test-results.json` / `browser-checks.json`: recorded run results.

## Rights and scope

No TTF, OTF, WOFF, WOFF2 or other font binary is included. The HTML can optionally
load a font file supplied locally by the viewer; it does not upload it. The
original photographs and published specimen image files are not bundled either;
the HTML links them from their original hosts and credits their sources.

This is an illustrative design/research comparison. It does not identify an
official B.C. font, recover manufacturing tooling, establish new-series glyph
coverage, or provide an official plate-production specification. The slogan
font was not tested in this study.
