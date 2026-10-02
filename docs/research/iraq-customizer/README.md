# Iraq: reusable flat plate customizer

This continues the earlier photograph-reconstruction work, but it is a different deliverable: **a parametric editor**, not a fixed source-photo tracing gallery. Frames/dividers are canonical rectangular geometry; no photographed bends, perspective, hardware or damage are part of the templates.

## Use it

### Standalone offline app

Open `iraq-customizer.html` in a modern browser with JavaScript enabled. The file includes the actual React UI, renderer and outline font data, with no runtime network or font download. A Library/file preview may not execute an app; download the file and open it in a browser.

1. Select a preset
2. Edit the serial, available province/code/letter/year and vehicle class
3. Choose long/compact layout, colors, font profile, scale and tracking
4. Use strict source coverage for observed-only characters, or deliberately enable the labelled fallback option
5. Save SVG or PNG. Strict unsupported content visibly boxes missing shapes and blocks export

Edits are retained while switching presets within the open session. Restore preset resets only the selected design. Closing/reloading the app does not save the session. SVG exports contain canonical settings metadata, including selected font/policy, normalized serial and layout values.

### In PlateForge

Run the existing development/build workflow and choose **Iraq editor**, or open `#/iraq-customizer`. Existing country pages and BC work are preserved. This is a separate explicit editor, not a silent replacement of every historical country default.

## Implemented scope

- 38 editable presets: all 27 existing Iraq recipes, seven flat specimen-derived presets and four additional illustration-based layouts
- All 39 source artworks link to reusable layout interpretations, including distinct bilingual-period motorcycle, inspection temporary, ICTS and international Erbil templates
- Seven reusable font profiles with 172 glyphs and 33 complete joined-word options
- Seven newly normalized TTF subsets with explicit cmap/PUA mappings, in `fonts/ttf/`
- Shared advance widths, 100-unit runtime cap-height and baseline-zero outlines; 1000-unit cap height in TTF exports
- No independent glyph width fitting. If a run is too long, its glyphs shrink uniformly and the app reports it
- Arabic/Persian/Western numeral keyboard input maps to the selected profile's own numeral style, preserving leading zeroes
- Whole Arabic words remain complete source-specific or pre-shaped licensed paths. PUA word symbols in optional subset TTFs are not a general Arabic shaping font
- Source-derived incomplete digits are not silently filled. Truck's damaged 8/9 and hidden motorcycle contours were excluded from observed font coverage; fallback is explicit

Some class descriptions and unsourced combinations are clearly labelled candidates/experimental interpretations. A renderable template is not proof that a registration was issued or that its font is an official die. Canvas sizes are editing coordinates; only pre-existing nominal size claims retain their stated source status.

## Files and architecture

- `src/templates/iraq-custom-types.ts`: explicit editor state/types
- `src/templates/iraq-custom-data.ts`: presets, controls, source mapping and palettes
- `src/templates/iraq-custom-fonts.ts`: reusable outline font/wordmark API and evidence metadata
- `src/templates/iraq-custom-scene.ts`: actual parametric layout/validation/export SVG renderer
- `src/ui/IraqCustomizer.tsx`: React controls, pure state reducer and export actions
- `src/ui/iraq-customizer.css`: isolated UI styling
- `src/ui/iraq-customizer-main.tsx`: standalone entry
- `scripts/build-iraq-customizer.mjs`: builds the offline app from those exact modules, not a second renderer
- `fonts/`: normalization, licensed-source provenance, proofs, canonical TTFs and tests
- `fixtures/`: compact evidence snapshots needed by the independent tests

## Build and verify

From the PlateForge repository root:

```
npm run typecheck
npm test
npm run build
node scripts/build-iraq-customizer.mjs /absolute/path/iraq-customizer.html
node docs/research/iraq-customizer/render-presets.mjs
```

The included reviewable patch contains the new source, tests/docs/fixtures and the small App route change. Canonical TTF and PNG binaries accompany it separately in this package; the running editor uses self-contained SVG outlines, so it needs no installed font. Apply only after reviewing against your checkout; no commit or push was made.

## Validation and exact limits

Passed on the final implementation: TypeScript, full 1,355-test suite (two pre-existing skips), production build, 85 independent scene/UI-state/SSR/export-state tests, 12 font runtime tests and 60 SVG-to-TTF raster checks. All 38 presets in both layouts render without errors, and example SVGs parse correctly. Font and plate raster proofs were visually inspected. The offline HTML's checksum and ten source-file hashes match its build manifest; it has no external runtime assets.

**Actual browser interaction/download/navigation QA was not completed.** The permitted cloud browser rejected local Vite with `ERR_BLOCKED_BY_CLIENT`; no successful browser screenshots or downloads are claimed. UI state transitions, conditional fields, reset/reselection and strict/fallback export-button behavior were tested directly and via React server rendering. PNG conversion uses the existing browser export helper, but actual browser download completion is unverified here.

## Rights

See `fonts/README.md`, `fonts/licences/` and per-profile metadata. GL-Nummernschild is an explicitly permitted FE-style candidate, not an identified official Iraqi font. Noto Naskh is OFL. Anbar and truck derivatives retain their source share-alike notices. Legacy private subsets remain private-study-only because source redistribution rights were not established. No EuroPlate/IRPlate/B Roya binary or outline data is added to this customizer. No security patterns, authentication marks or legal-validity claims are generated.
