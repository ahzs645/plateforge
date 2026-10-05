# PlateForge reconstruction workflow and lessons

This handoff records lessons from the B.C. lettering, specialty artwork, municipal, decal and federal work. It is intended for the next maintainer and complements the reusable [skill](../skills/plate-reference-reconstruction/SKILL.md).

## Evidence and dates

Use a coverage ledger before saying every plate or glyph was checked. Record each occurrence, including two 8s on one plate. Multiple serials of one layout are references, not automatically separate presets. Keep provincial examples in their province even when a national gallery displays them.

Group dies by source attribution and observed construction, not just year. Passenger, commercial, trailer and motorcycle plates may share tooling, use different sizes, or overlap suppliers. Compare their smaller province/date/prefix stamps independently. The B.C. Gantt separates declared model coverage, selectable alternatives and source evidence; its bars do not certify a tooling lifetime. See [the die-grouping ledger](research/bc-die-grouping/README.md).

Distinguish manufacture year, base year, decal year, event year, photograph label and website publication date. Omit a period for undated designs; never manufacture a broad date range just to fill a timeline. A captioned interval is evidence from that source, not a complete issuance history.

## Photograph comparisons

Rectify from the four physical plate corners to a supported physical aspect ratio. An image's outer border is not necessarily the plate. Perspective correction does not remove embossing, paint spread, curvature or lens distortion. Poor newspaper photographs are useful for context, not precise contour fitting.

Keep the full original, rectified view and actual paint crop available. A trace cannot replace the original crop. Use a consistent viewing background. Preserve individual repeated occurrences. A source box measures an approximate extent, not an exact paint outline.

Placement overlays retain position and reveal spacing/run offsets. Shape overlays match center and height uniformly and retain relative width. Independent width scaling would conceal width errors. Compare stroke thickness, both counters, bowl balance, pinched waist, terminal flats and lean. Wear and embossed shoulders should not become part of the master contour.

## Implementation lessons

- `src/regions/canada/bc-kit.ts` registers format recipes, grammars, palettes and optional periods. `src/templates/bc/kit.ts` draws the scene. New national recipes need unique IDs and `design.jurisdiction: 'CA'`; their exported title must say Canada.
- `src/templates/dies/` holds independent serial and legend profiles. Shared maker or calendar year does not justify borrowing B.C. dies for overseas federal plates. Protect fixed source-derived lettering with `allowResearchReplacement: false`.
- Fixed screened words can use outlines from supplied fonts. Frankfurter, Harrington, Times Bold Italic and Helvetica Compressed belong to different roles. Preserve font provenance and native spacing, fit each whole word deliberately, and do not bundle proprietary font software. Font identification alone does not establish the historical production version.
- `maxWidth` reduces a complete run uniformly, including its height. Nominal cap height is not the fitted painted height. Check rendered stroke extents and clearance rather than declaring a match from boxes alone.
- Screened legends render before ordinary recipe shapes. An opaque later rectangle can hide text despite valid SVG. Put a plain decal background and its text in one `KitPanel`; use `rim: false` when no inset rim exists.
- Place portable artwork with uniformly transformed groups when possible. Nested SVGs can inherit global preview sizing rules or exporter assumptions; compare the actual exported PNG with the browser and standalone SVG, including artwork bounds.
- Preserve supplied compound-path fill rules and negative spaces. A successful path import does not establish that holes and inner contours render correctly; test the rebuild script against the actual uploaded archive.
- Artwork, serial tooling, screened text, decal system and palette are independent. A colour variant should not acquire a new alphabet by accident. Keep uncertain alternate assignments visible.
- Validation checks a supported pattern, not an actual registration or exhaustive allocation. Preserve leading zeroes where photographed. An uncertain attachment or souvenir should not appear as an authenticated issued registration.

## Verification and publication

Run targeted meaningful tests, then the project checks: `npm test -- --maxWorkers=2` and `BASE_PATH=/plateforge/ npm run build`. Use a production preview with the same base path for screenshots. Recheck SVG and PNG exports, visible text/layers, national metadata, serial generation/editing, palette selection and mobile controls. Avoid concurrent heavy builds/browser suites that cause artificial timeouts.

Keep stable source/current comparison artifacts and a coverage ledger in `docs/research/`. Partial regeneration can overwrite a combined report; deliberately refresh all affected records. Search targeted source files with `rg`; large single-line research JSON can flood output. Temporary `/tmp` artifacts are useful during work but do not constitute a durable handoff.

The public site deploys through `.github/workflows/deploy.yml` from `main`. Check the GitHub Pages run and the live routes after an authorized publication. Local tests alone do not establish live availability. Respect the user's existing authorization without adding a new approval workflow.

Preserve working credited source URLs. World License Plates currently serves the supplied HTTP URL while its HTTPS endpoint fails; this does not require bypassing TLS checks. Source photos and proprietary font binaries remain with their owners. The federal review retains source-box coordinates, source hashes, credited cropped thumbnails and links to full originals; it does not copy the complete raster gallery panels or imply a redistribution licence for their originals.
