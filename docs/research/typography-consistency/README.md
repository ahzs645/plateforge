# Typography consistency

This work makes the same selected font files, weights, styles and Unicode subsets
available to the preview and downloaded artwork. It does not identify new
historical manufacturing alphabets. The original source-derived outline masters
and the Iraq/Iran profile limitations remain separate.

## Implementation

- `scripts/typography-build-manifest.py` inspects the unmodified font files and
  pinned npm packages. It writes `src/templates/font-manifest.json`, URL imports
  in `font-assets.ts`, both inventories here, and public OFL notices. Unicode
  ranges are intersected with each font's actual cmap.
- `src/core/font-contract.ts` selects style and weight and emits face descriptors;
  `src/templates/fonts.ts` installs those descriptors for the preview.
- Generic serif, sans, script, syllabics and CJK text uses labelled portable
  substitutes. B.C. research replacement retains the original typeface lookup key
  and records the winning research unit per observed glyph.
- `src/templates/measure.ts` measures the rendered weight/style and counts
  tracking once. Font arrival redraws the plate without remounting editor inputs.
- `src/ui/exporting.ts` waits for requested preview fonts, checks character
  coverage, verifies selected asset hashes, freezes text styles and embeds the
  selected fonts and artwork. Each physical subset gets a private CSS alias to
  retain fallback precedence in standalone SVG images.
- Exported SVGs include an invisible, noninteractive, accessibility-hidden font
  sample group before visible text. Direct references to each selected subset
  prevent the first raster export from omitting fonts reached through a long
  fallback chain. `opacity: 0` preserves layout/font loading; `display: none`
  would skip it. There are no timing sleeps or font-byte modifications.
- PNG and Tesla exports use the same serialized SVG. Metadata records original
  font identities, aliases, hashes, profile notices and research unit IDs. Hidden
  font samples do not add visible artwork or certified glyph coverage.
- The application rejects an export if the plate or requested B.C. research
  version changes during preparation. Requested research loading failures must
  be retried or explicitly switched off.

## Reproduce

From the repository root:

```sh
npm ci
python3 -m venv /tmp/plateforge-font-manifest
/tmp/plateforge-font-manifest/bin/pip install fonttools==4.61.1 brotli==1.2.0
/tmp/plateforge-font-manifest/bin/python scripts/typography-build-manifest.py --check
node scripts/typography-verify.mjs
TYPOGRAPHY_EVIDENCE=1 npm test -- --maxWorkers=2
BASE_PATH=/plateforge/ npm run build
```

For an intentional font/package change, update the pins in `package.json` and
`scripts/typography-package-pins.json`, regenerate the lockfile, run the Python
script without `--check`, then inspect the generated metadata and notices.
Package versions and a font's internal version are different identifiers.

Install browser tools outside the application dependencies:

```sh
npm install --prefix /tmp/plateforge-browser --ignore-scripts --no-audit --save-exact playwright@1.56.1 pngjs@7.0.0 pixelmatch@7.1.0
node /tmp/plateforge-browser/node_modules/playwright/cli.js install --with-deps chromium firefox webkit
TYPOGRAPHY_BROWSER_DEPS=/tmp/plateforge-browser/package.json TYPOGRAPHY_BROWSER=chromium node scripts/typography-browser.mjs
```

Repeat the last command with `firefox` and `webkit`. Run browser suites
sequentially locally: each uses port 4173 and regenerates `qa-dist`. CI gives each
browser a separate runner. Output lives in ignored `typography-evidence/` and
`qa-dist/`. The test harness is not part of the deployed application.

The browser suite compares preview pixels with production PNG output, checks
standalone SVGs and Tesla output in fresh contexts with either raster export
performed first, and checks representative formats, real UI downloads, mobile
layout, focus preservation, research-load failure/retry, and cancellation when editing during export preparation. Chromium also renders all 878 registered formats.
Tesla references use preview pixels at the encoder's working resolution before
downsampling. Pixelmatch excludes antialias edges from plate and Tesla comparisons;
the raw pixel differences are retained as evidence. Font specimens and first PNG
exports also keep their raw-difference assertions. Pixel
thresholds detect missing/replaced lettering; they do not certify historical
accuracy. CI runs these assertions on PRs and main with read-only permissions.

## Review findings and remaining work

The original branch passed 1,946 unit tests but failed eight raster comparisons.
The first Chinese font specimen exported blank, and Chinese/Japanese/Korean plate
exports and Antonio/UK fallback specimens also differed from the preview. The
last green experiment did not assert image parity. The production exporter now
references embedded subsets directly, and the browser assertions run in CI.
Temporary branch-writing patch workflows and encoded payloads have been removed.

The current Iraq/Iran inspectors link to the reference-photo comparisons and the
offline report. Their smoke test follows those links, clears the picker's
initial Canada filter before searching another country, and checks every
candidate image and offline selection. It no longer targets the retired inline
comparison panel.

Before merging, require all CI jobs, including all three browser engines, and
inspect the saved preview/export pairs. Main pushes automatically deploy the
public site; merging and deployment remain a separate decision.

Further work should be scoped separately:

1. **Historical visual review.** Noto, Pinyon and Barlow substitutes provide
   portability, not authenticated plate dies. Compare each jurisdiction/role with
   credited specimens before claiming fidelity. B.C. observed research glyphs,
   constructed fallbacks and original outline masters keep separate provenance.
2. **Existing font permissions.** EuroPlate and UKNumberPlate already exist in
   main and retain their unverified deployment notices. Export success and a
   file hash do not resolve those notices. Any replacement needs an explicit
   visual comparison and provenance update.
3. **Loading cost.** The app still has a large main JS chunk and installs a broad
   font catalogue. Measure startup, font requests and navigation on mobile before
   choosing country-level code splitting or further font subsetting. Do not
   remove characters solely to reduce payload without checking editable inputs.
4. **Broader export coverage.** The suite renders every registered format but
   exports representative formats and all selected font specimens. Extend
   source-specific specimen coverage when changing a particular layout, script,
   joined-word master, or research family.

See [the reconstruction workflow](../../plate-reconstruction-workflow.md) for
photograph comparisons and evidence boundaries.
