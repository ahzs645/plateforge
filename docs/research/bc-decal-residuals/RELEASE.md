# BC decal correction release

This release publishes the two reviewed BC decal correction passes, their source
evidence, comparison galleries, scripts and verification records. The first pass
starts at `17b974f51c687780c5d0b106fd9ae37e4c83ccae`; the second starts from the
complete first-pass tree. The recovered local publication checkpoint is
`5d1341370985c5a26b737e3616dc2c558d7b7bf8`.

The [second-pass review](README.md), [case ledger](case-ledger.csv) and
[method](METHOD.md) describe the supported changes and their limits. The
[first-pass review](../bc-decal-corrections/README.md) remains a historical
comparison. Both galleries retain all 68 reference comparisons.

## Published history and reproduction

The [publication mapping](publication-commits.json) records all eight original
capture commits and their published equivalents. Every published tree has exactly
the same Git object SHA as its original local tree, so file contents, paths and
modes are preserved. Commit metadata and commit IDs differ. Historical IDs inside
the saved galleries and validation records retain their original meaning.

The complete first-pass capture `2468924` is published as
`cb028c060bfc0f0438168187419c155e8ee8bca7`. Create a separate clean baseline from
that published commit before following the second-pass reproduction commands:

```sh
git worktree add --detach ../plateforge-decal-pass1 cb028c060bfc0f0438168187419c155e8ee8bca7
npm ci --prefix ../plateforge-decal-pass1
```

The integration also retains main's November 7 CI update, including one shared
build stamped with the workflow source revision and verified by every browser
job before use.

## Captured evidence and release verification

The original validation files are dated captures. Their `local-only`,
`blocked-unexecuted` and authorization-pending fields describe the state when
those captures were made. They are preserved rather than rewritten to suggest
that browser tests had run at that time. Publication was subsequently authorized
explicitly by the user.

The recovered application source and `package-lock.json` reproduce the captured
SHA-256 exactly:

`80f176a664755c5d41432cbac8150c9b77edf4d13694e82952f8b309b04bc6fd`

The hash input is the sorted tracked `src` files and `package-lock.json`, each
represented by its relative path, a NUL byte, and its file bytes. It confirms
which application source was recovered; it is not a photographic accuracy score.

Fresh release preparation confirmed:

- TypeScript and the production build pass, with the existing large-chunk warning.
- All 33 focused audit, segmentation, overlay and lettering-analysis tests pass.
- All 68 offered application reference selections and the additional leading-zero
  case preserve the expected printed inputs.
- The local Chromium retry still fails at its required singleton socket with
  `Operation not permitted`. It supplies no browser acceptance result.
- A fresh local full-suite attempt was terminated with SIGKILL before reporting
  test results. The earlier complete 1,969-test receipt remains a historical
  result; the release uses GitHub Actions for a new complete-suite result.

The machine-readable [release preflight](release-preflight.json) keeps these
fresh local results separate from the earlier capture and the subsequent CI
results.

The release workflow pins the browser runner to Ubuntu 24.04 for the existing
Playwright 1.56.1 dependency pin. Its Chromium, Firefox and WebKit jobs exercise
the real application/export path, the new decal comparison controls and mobile
layout, all 572 catalogue/month fixtures, and the existing source-photo report.
The workflow uploads each engine's results and failing-case diagnostics.

Use the release pull request and the [Typography validation workflow](https://github.com/ahzs645/plateforge/actions/workflows/typography-validation.yml)
for the result associated with the published revision. A successful Pages build
alone does not establish that these browser checks passed.

## Historical evidence still needed

Publication closes delivery of the supported corrections. The following research
limits remain explicit in the case ledger:

- The later-2018 printing group needs stronger documentation before an additional
  selectable variant or an expiry-month boundary can be established.
- Sharp enlarged modern year `3` and `9` examples are still missing.
- The 1999 MAY `Y` depends on one small independent source.
- Tiny 2004–2007 province lettering does not support confident contour recovery.
- The remaining 2012 NOV width shortfall, JAN/JUL contour differences and tall
  COLUMBIA residual need stronger evidence or better separation from source tilt.
- Exact colour, cutting radii, physical surface treatment and historical typeface
  identity need physical measurements or original production records.

The five previously retained references 1978, 1994, 1996-pink, 1997 and 1998
remain unchanged by the second pass. A reviewed reference, passing export, or
matching width does not establish a historically exact reconstruction.
