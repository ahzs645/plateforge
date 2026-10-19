# B.C. visual review, 19 October 2026

The typography branch is suitable for technical review with its existing
historical approximation labels retained. This review is not a claim that all
B.C. serials, logos or printed legends are exact. The interactive report is at
`public/bc-visual-review/`, linked from every B.C. inspector.

## Coverage and conclusions

- Chromium 141.0.7390.37 rendered the same deterministic default inputs for all
  **448 B.C. formats** from main `5c8538a` and the reviewed branch sources, with
  research lettering loaded. **93 formats** exceed 0.1% changed pixels. Most
  changes are portable Noto text substitutions; the issued 1994 Royal visit
  badge placement is an intentional artwork placement correction.
- **85 photographed specimens** receive three-way comparisons: **30 plates**
  and all **55 catalogued renewal decals**. The collection opens with logos.
  Monograms, totems, waving and full-face flags, personalized flowers, the
  Olympic mountain-sun, Centennial, royal, APEC and governor marks are included.
- Inspected original photographs, main and branch captures, isolated logo crops
  and equal-height overlays. Preserve original width proportions; do not stretch
  a source crop to make its contour agree with a reconstruction. Covered artwork
  (the 1995 Centennial emblem behind a renewal panel) has no shape comparison.
- The supplied logo and glyph masters remain unchanged. The review found and
  corrected one clear **placement** mismatch: the 1994 issued Royal visit badge.
  See `royal-1994-placement.json`. Its prototype retains its previous placement
  because that specimen needs independent calibration.
- The two governor designs need different source pairings. The 2003 and 2016
  photographs both depict the older gold arms. The circular plaque is paired
  with `LG(XL).jpg`; a photograph date does not establish a design introduction.

The manifest records every native main/branch pixel comparison, captured art
bounds, live-text families, typed specimen inputs, source links, source hashes,
stored-image hashes, findings and limits. Its branch commit plus source SHA-256
identifies the checkout and reviewed working changes; it is a dated snapshot,
not a claim that an arbitrary later commit has the same pixels. Hash source
paths and bytes in sorted `git ls-files src package-lock.json` order, separating
each path from its bytes with NUL, as the renderer does.

## Next reconstruction work, in order

1. **Monograms and totems:** equal-height comparisons expose differences in
   interlock width, bowls, diagonals, leaf proportions and bird contours. Keep
   these as explicit reconstructions. Obtain larger, frontal specimens before
   replacing supplied contours or asserting shared tooling between classes.
2. **Carrier full-face flag:** source geometry is retained, but sun placement,
   screened printing, white wash and passenger/carrier labels differ visibly.
   Calibrate the 2005 and 2024 plates independently before defining shared print
   settings. Their decal dates do not establish manufacture dates.
3. **Older governor arms:** the flat filled reconstruction has substantial
   supporter/shield contour and relief differences. It needs its own traced
   source study rather than borrowing the circular crest.
4. **Printed marks and captions:** waving-flag width/colour, Centennial printing,
   APEC globe/caption, Expo's final 6, gold Olympic legends and the governor
   shield/sun retain visible source limits. Supplied artwork is not an official
   historical production master. Treat print placement separately from paths.
5. **Serials and decals:** bicycle lettering remains a broad construction;
   collector serial paint/contours vary by source. Renewal colours, small text,
   and barcode bars remain approximate. The barcode is synthetic and is not
   decoded registration data. Tiny dogwood, Olympic and military APEC photos
   support arrangement, not precise contour validation.

These are documented reconstruction follow-ups, not hidden typography/export
failures. The report exposes them beside the originals so later work can be
assessed against the same evidence.

## Reproduce

Keep a detached, immutable main checkout and install the pinned tools separately:

```sh
git worktree add --detach ../plateforge-main-visual 5c8538a
# Install app dependencies in both checkouts, or share node_modules by symlink.
npm install --prefix /tmp/plateforge-visual-tools --ignore-scripts --no-audit --save-exact playwright@1.56.1 pngjs@7.0.0 pixelmatch@7.1.0
node /tmp/plateforge-visual-tools/node_modules/playwright/cli.js install chromium
BC_VISUAL_BASE=../plateforge-main-visual \
  TYPOGRAPHY_BROWSER_DEPS=/tmp/plateforge-visual-tools/package.json \
  node scripts/build-bc-visual-review.mjs
# Python 3 + Pillow 12.3.0, installed in an isolated environment:
python scripts/pack-bc-visual-review.py
python scripts/bc-visual-review-offline.py
BASE_PATH=/plateforge/ npm run build
TYPOGRAPHY_BROWSER_DEPS=/tmp/plateforge-visual-tools/package.json \
  node scripts/bc-visual-review-smoke.mjs
```

Run `python scripts/bc-visual-review-offline.py` before the smoke check to create
`typography-evidence/bc-visual/offline.html`. It embeds all photographs, captures,
controls and evidence in one HTML file, which opens without a server or network.
CI publishes it as the `bc-visual-review-offline` artifact. This bundler uses only
Python's standard library and can rebuild the portable file from the committed
public report without rerendering either branch.

The renderer uses the actual PlateView in each checkout, waits for fonts and
images, checks resource/page failures and preserves photograph/sample serial
exceptions explicitly. It writes full captures into ignored
`typography-evidence/bc-visual/`. Packaging checks the source hashes and specimen
inputs, verifies logo bounds, and stores lossless WebP capture atlases. Existing
reference crops are reused; a small number of missing credited specimens are
stored as bounded WebP copies. Original URLs remain available. For fresh downloads, the reference hash and
pixels describe the downloaded original; for reused catalogue crops they identify
the local crop, without asserting the remote original-byte hash. Each record
labels this scope. The stored-copy hash always identifies the exact image shown.

The report offers native main/branch placement, approximate source-frame
placement, uniformly aligned logo shape, differences, opacity, blink, manual
translation/uniform scale and PNG download. Reset restores the recorded fit.
It never derives a historical accuracy percentage from photographic pixels.

The CI browser matrix exercises every report specimen, available comparison
mode, source asset, the inspector link, keyboard controls, blink, download and
390-pixel mobile layout in Chromium, Firefox and WebKit. The separate typography
suite covers actual application SVG/PNG/Tesla export and font-loading behavior.
