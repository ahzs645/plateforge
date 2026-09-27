# Serial lettering in PlateForge

The B.C. passenger system is integrated in the main application under **Canada → British Columbia**, with 25 formats (1940–1963 plus the separate 1962 no-dash variant).

## Using the controls

The inspector's **Serial lettering** control is available for B.C. and all existing U.S. regions. Default preserves the existing editable-font rendering. Four optional vector modes are provided: semicircular/DIN-style, squarish, oval, and hybrid. Expand **Compare the four construction types** for clickable specimens. The control affects the large serial only, not province/state legends, dates, renewal-strip text, slogans or emblems.

The selection and B.C. finish survive **Generate**. Selecting a different format starts with that format's default. Batch generators use the default rendering; selecting a batch result restores any lettering value carried in its parts. SVG/PNG exports follow the preview. CSV/JSON include the `lettering` part. Existing share links continue to identify region/format only, not edited serial or lettering.

## Reference and limits

The conceptual categories are attributed to [Leeward Productions](https://www.leewardpro.com/articles/licplatefonts/licplate-fonts-nam-class.html). The article groups curve construction, not four downloadable font files. Its general B.C. entry is DIN-style; it does not establish the dies used in each historical year. No year-by-year B.C. assignments or present-day U.S. state assignments are inferred from that entry.

The vector shapes are **original, category-inspired procedural drawings**, not scans, digitizations, exact jurisdiction dies, commercial replica fonts, or official DIN 1451. The hybrid implements one example: squarish letters and oval numbers. Other hybrids are possible. Existing Barlow text proxies and the approximate B.C. emblem remain available unchanged. No fonts or article photographs are added.

## Implementation

- `src/core/lettering.ts`: reference, category records, field enrichment, validation, metadata, and preserving appearance during regeneration.
- `src/templates/lettering.ts`: shared stems/bowls/quadrants, A–Z, 0–9 and separators, hybrid character dispatch, and uniform run fitting.
- `src/templates/svg-scene.ts` / `SvgScene.tsx`: common safe SVG tree, serializer and React adapter. B.C. and the U.S. renderers use the same lettering implementation.
- `src/ui/LetteringPicker.tsx`: accessible select, status text, and four clickable specimens; no country-specific UI branch.

`lettering` is stored in `Parts`, so no renderer-specific state is lost between preview and export. Default SVG serials remain `<text>`. Opt-in vector serials are `<path>` groups: they are editable as shapes, **not live font text**. Their serial text remains in `<title>`, accessibility labels and JSON metadata. Surrounding inscriptions remain live text. Unsupported input falls back to the existing text renderer and is flagged in metadata rather than silently dropped. Procedural runs require no external font assets; existing header/legend fonts still use the app's existing export pipeline.

Tests cover the category catalogue, glyph coverage, distinct curves, hybrid composition, persistence, legacy parts, source/accuracy metadata, default text, unsupported input, empty strings, and every B.C. base. The pull-request workflow also opens the actual production build in Chromium and checks the picker, 25 presets, typography controls, regeneration, SVG/PNG downloads, mobile width and a U.S. plate. Test outcomes are reported by CI, not assumed by this document.
