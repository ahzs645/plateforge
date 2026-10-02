# Iraq website patch: baseline and application guide

## Exact target

Repository: https://github.com/ahzs645/plateforge

The complete patch targets PlateForge commit:

```
28150d7d4e2ba175e7795911e3bfd993b455825d
```

It is a **full patch from that baseline**, not an incremental update to the earlier Iraq customizer patch. Apply it once. The included `repo/` source tree is a review aid, not a replacement for the entire PlateForge checkout.

The baseline already supplies React, React DOM, TypeScript, Vite, Vitest, the Iraq region/data modules, the existing application, and `src/ui/exporting.ts`. The patch supplies the additional Iraq outline renderer, editor, timeline/workspace, evidence fixtures, tests, styles, and standalone build entry, plus App routing and Iraq region label/note updates. No uncommitted British Columbia work is required. `package.json` and `package-lock.json` remain the baseline dependency manifest and lockfile.

Use Node 24 for the commands below. Validation used Node 24.19.0 and npm 11.9.0. The baseline Vitest package requires Node `^22.12.0 || ^24.0.0 || >=26.0.0`; Node 20 is not sufficient for the complete test workflow.

## Safest clean application

Keep the patch file outside the destination worktree, and use its absolute path. Review the patch before applying it. These commands create a separate review branch and leave any current working-tree changes untouched:

```sh
BASE=28150d7d4e2ba175e7795911e3bfd993b455825d
PATCH=/absolute/path/Iraq-Flat-Customizer.patch
git cat-file -e "$BASE^{commit}"
git worktree add -b review/iraq-timeline-customizer ../plateforge-iraq-review "$BASE"
cd ../plateforge-iraq-review
git rev-parse HEAD
git status --short
git apply --stat "$PATCH"
git apply --check "$PATCH"
git apply "$PATCH"
npm ci
npm run typecheck
npm test
npm run build
node scripts/build-iraq-customizer.mjs "$PWD/preview/iraq-customizer.html"
node docs/research/iraq-customizer/render-presets.mjs
```

Choose another review branch/directory name if either already exists. The `rev-parse` result must be the exact baseline above; the status should be clean before applying. Stop on any failed command. Do not use `--reject` to bypass a failed application check, and do not overwrite unrelated application changes with the package's copy of `App.tsx`.

For an existing **clean** checkout already at the exact baseline, the worktree creation step is optional. Use the same check/apply/validation sequence there. For a different commit, first inspect and port the changes in a separate branch; clean application is only guaranteed for the stated baseline.

After `npm run dev`, open `#/iraq-timeline` for the source-aware history view or `#/iraq-customizer` for the editor. A preset may be opened with `#/iraq-customizer/<preset-id>`. `npm run build` produces the complete site's `dist/` directory. The standalone build produces a self-contained HTML file plus its build manifest; it does not deploy the website.

## If v1 was already applied

Do not apply the full replacement patch over v1. Most added files will already exist, and the App route change will overlap.

The original v1 patch audited for this handoff has SHA-256:

```
4429bd14a85e62ace4b1cea6c5e7bdcb66333eeaf483513fda8313f6fade3d60
```

The preferred migration is the separate clean-baseline worktree above. Keep the previous checkout as the reference, validate the replacement there, and then port any intentional, unrelated local edits. This also works if v1 was committed or subsequently customized.

Only if the prior application is still exactly reversible, and all subsequent work is safely saved, the old patch may be removed first:

```sh
OLD_PATCH=/absolute/path/original-v1-Iraq-Flat-Customizer.patch
NEW_PATCH=/absolute/path/replacement-Iraq-Flat-Customizer.patch
git status --short
git apply --reverse --check "$OLD_PATCH"
git apply --reverse "$OLD_PATCH"
git apply --check "$NEW_PATCH"
git apply "$NEW_PATCH"
```

`OLD_PATCH` must be the actual original v1 file, not the replacement with the same filename. If the reverse check fails, stop and use the clean worktree method. Reversal removes v1-created files, so never force it across local modifications. Do not use a broad `git reset --hard`, `git clean`, or directory replacement to perform this migration. Rerun all validation commands after either migration path.

## Runtime dependencies versus research regeneration

The website and offline HTML use included canonical SVG outlines. They do not require installed TTFs, remote webfonts, source photographs, Python, HarfBuzz, or the earlier `docs/research/iraq-complete/` research directory. Optional TTF/PNG binaries are companion artifacts, not prerequisites for TypeScript or the website build.

Rebuilding the original canonical outline data is a different operation. `fonts/build_fonts.py` reads research inputs under `docs/research/iraq-complete/` that are absent from the baseline and are not all supplied by this patch. It additionally needs Python `fontTools` and native HarfBuzz. See `fonts/input-sha256.json` for the exact original inputs. Do not run it as an installation step or claim the patch is a complete raw-source reconstruction archive.

`fonts/build_ttf.py` can generate the optional subset fonts from the included `canonical-font-data.json` with Python `fontTools`; the normal application does not load those TTFs. Font and source-specific rights restrictions remain in `fonts/README.md`, `fonts/licences/`, and per-profile metadata. Baseline-wide assets and licences are unchanged by the Iraq patch.

**Public-deployment gate:** the legacy private traced subsets remain private-study-only. A successful website build does not clear them for public redistribution. Before public launch, obtain source reuse clearance or select licensed candidate profiles and exclude the restricted subset data from the public bundle. Merely changing the default dropdown selection does not remove restricted outlines bundled in the runtime module. Preserve the applicable licence and attribution requirements for any retained profiles. No public launch is authorized or performed by this handoff.

## Validation scope

Validation is performed in a fresh **full** `git archive` of the exact baseline, then the patch is applied. Checking only an extracted `App.tsx` proves hunk compatibility but cannot prove the application builds or its tests have their fixtures. The audit uses the existing, locked `node_modules` via a symlink; a fresh network `npm ci` was not performed during that isolated audit. The baseline lockfile SHA-256 is `40e0390b8abf0b55cb492b83efde9c32118e84b904a1d5b264a69aa47cf66227`.

The unpatched baseline passes **1,249 tests in 27 files**, with no skips. The audited original v1 applies, typechecks, builds the website, builds standalone HTML, and renders all 38 presets. Its full clean-baseline suite has **1,344 passing and 2 failing tests**. The failures are missing research-only input files (`utility/specimens.json` and `anbar-taxi/complete-plate.svg` under `docs/research/iraq-complete/`), rather than missing runtime imports. The replacement includes compact independent evidence fixtures and redirects those two tests to them; `fixtures/source-fixture-provenance.json` records the exact source hashes and extraction rules. The previous 1,355-pass/two-skip result belongs to the broader working checkout and must not be substituted for a clean-baseline result.

### Replacement patch: isolated full-baseline results

The final runtime implementation was verified after clean application to a newly extracted full baseline on 2 October 2026:

| Check | Result |
| --- | --- |
| `git apply --check` and actual application | Passed; one harmless existing licence-text trailing-whitespace warning |
| `npm run typecheck` | Passed |
| `npm test` | **1,356 passed, 32 test files, zero failures or skips** |
| `npm run build` | Passed; Vite's large-chunk advisory remains |
| Standalone offline HTML build | Passed; 722,323 bytes |
| Standalone HTML SHA-256 | `01d6438a7e6ca3b35dce1e64cc3b3e622d36318d96c8a98ce40f14009c006df8` |
| Standalone manifest and source hashes | All 14 source hashes and output hash verified |
| Preset SVG renders | All 38 presets rendered, zero renderer errors |

The complete suite includes the scene, editor, timeline/workspace, and font runtime tests. These counts are for **baseline plus this Iraq patch only**. Any larger result from the concurrent working checkout includes separate research/BC tests and is not the patch's baseline result. The raw research directory remained absent during validation; the compact fixtures close the original v1 test dependency gap. No additional npm package or font installation was necessary in the isolated build using the shared installed dependencies.

Browser interaction, actual browser download completion, and visual browser QA are separate from typecheck/test/build validation; they remain **unverified**. The earlier permitted local browser attempt was blocked, and no successful browser QA is claimed. No commit, push, publication, or deployment was performed by this handoff.
