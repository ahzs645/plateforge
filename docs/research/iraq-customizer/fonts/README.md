# Canonical reusable Iraq lettering

This is the font/wordmark layer for the customizable editor. It is distinct from the earlier photograph-coordinate specimen studies. Serial changes reuse the same canonical masters and advances. No source photograph, plate frame, bolt, lamp, security patch, occlusion mask, dirt, or paint-damage notch is part of these glyphs.

## Deliverables

- Runtime: `src/templates/iraq-custom-fonts.ts`
- Machine-readable canonical outlines and metrics: `canonical-font-data.json`
- Flat proofs: `flat-font-profiles.svg` / `.png` and `flat-wordmark-profiles.svg` / `.png`
- Seven installable, explicitly limited canonical TrueType subsets: `ttf/*-canonical-subset.ttf`
- Font cmap/wordmark mapping: `ttf/font-mapping.json`
- Exact input hashes: `input-sha256.json`
- Per-character canonical normalization matrices: `normalization.json`
- Build-time HarfBuzz word-shaping records: `wordmark-shaping.json`
- TTF cmap/metric/raster equivalence validation: `ttf/validation.json`
- Twelve focused runtime tests: `iraq-custom-fonts.test.ts`

The runtime renders paths directly. It does not depend on installing a font, waiting for a webfont, a browser Arabic fallback, or PUA text shaping. The TTF files are optional editing/installable convenience assets; they are generated from the same normalized masters, not the old photograph-positioned partial TTFs.

## Available profiles

| ID | Supported serial masters | Observed joined words | Provenance |
| --- | --- | --- | --- |
| `legacy-erbil` | ٠٣٤٥٦٨ | Erbil, Iraq | Observed source-guided subset; private-study rights restriction |
| `legacy-sulaymaniyah` | ٢٣٦٩ | Sulaymaniyah, Iraq | Observed source-guided subset; private-study rights restriction |
| `anbar-taxi` | ١٢٥٩ | Anbar, Iraq | Observed source-guided subset; CC BY-SA 3.0 derivative |
| `utility-truck` | ٠١٣ | Erbil, Iraq | Clean complete source-guided subset; CC BY-SA 4.0 derivative |
| `modern-eng` | 0–9, A–Z, hyphen | None | Licensed GL-Nummernschild Eng candidate |
| `modern-mtl` | 0–9, A–Z, hyphen | None | Licensed GL-Nummernschild Mtl candidate |
| `naskh-candidate` | Arabic digits, isolated Arabic series letters, connected هـ token, Latin letters | Country + 19 governorates + 13 descriptive classes | Licensed Noto Naskh Arabic Bold candidate |

A source-guided “observed” glyph is a clean hand-built outline based on a visible specimen. It does not mean an official manufacturing die was obtained or that the original photograph's perspective uniquely determines the true die. The canonical layer removes specimen placement, consistently rebases glyphs, uses advances, and retains the source-derived proportions. It does not invent missing outlines or claim certified die accuracy.

The damaged truck ٨ and ٩ are deliberately excluded. The less-clean first truck ١ is not a second arbitrary variant; the second complete photographed ١ supplies the reusable master. All partly occluded motorcycle digits and motorcycle wear-dependent wordmarks are excluded. No unobserved historical alphabet is synthesized.

## Coordinates and sizing

Serial outlines have a baseline of 0 and a nominal cap height of 100. Each historical profile uses exactly one uniform scale based on its median full-height numeral height. Individual glyphs are only translated onto the baseline and into their bearing/advance cell. Their widths are never stretched independently. Native small ٠ retains its source-relative height and vertical placement against the shared source baseline, rather than being enlarged to a full-height “digit.”

Licensed GL and Naskh outlines use a single font-derived cap metric. The natural Naskh alphabet has descenders, which may extend below baseline. Latin and Arabic serial aliases share the same chosen profile master; input script does not secretly choose a different font.

A complete wordmark is a semantic, already-joined unit. Its entire outline is proportionally scaled to an ink height of 100 with ink-bottom baseline 0. Its components never receive individual transforms. The runtime uses only `translate(...) scale(singleNumber)` per canonical unit. The plate layout may uniformly scale a complete run; it must not width-fit individual characters.

## Runtime API

`IRAQ_FONT_PROFILES`: typed profile metadata, glyphs, observed/candidate wordmarks, notes, rights, and source URL

`IRAQ_WORDMARKS`: metadata for Iraq, all 19 governorate slugs, and all 13 class slugs requested by the editor (33 complete candidate wordmarks)

`renderGlyphRun(profileId, text, x, baseline, capHeight, tracking = 0, missingPolicy = 'strict')`

`renderWordmark(profileId, wordmarkId, x, baseline, capHeight, missingPolicy = 'strict')`

Both return `{ markup, warnings, bounds: { x, y, width, height }, advance, provenance }`. The bounds are actual unioned ink bounds, not a synthetic fixed cell. Tracking is in output SVG units. SVG markup includes escaped titles, source IDs, and `data-provenance`. Invalid coordinates and unknown profile IDs throw a RangeError.

- `strict`: unsupported content is a visible crossed box and a warning
- `fallback`: unsupported historical content can use explicit, labelled Noto Naskh Bold outlines. The warning and provenance both say fallback. Characters unavailable even there remain crossed boxes
- Digits may be supplied as Western, Arabic-Indic, or Persian digits. Historical profiles render their observed Arabic-Indic masters; modern profiles render their licensed Latin masters
- Serial runs are left-to-right sequences of digits/isolated series tokens. They are not a general Arabic paragraph shaper
- Words must go through `renderWordmark`. Source observed spellings are separate from normalized label metadata, e.g. observed Anbar `الأنبار` versus fallback label `الانبار`

Extra class words for construction, customs, police, military, temporary and motorcycle are explicitly described as generic labels whose historic plate wording is unverified. Being drawable is not evidence that a particular plate carried that wording.

Special-layout candidates include `inspection-temporary` → `فحص مؤقت` and `counter-terrorism` → `جهاز مكافحة الارهاب`. Each complete phrase is HarfBuzz-shaped right-to-left as one proportional path, preserving joined contextual forms and inter-word spacing. Both remain explicit Noto candidates, separate from the eight observed source wordmarks. Motorcycle layouts reuse the existing `motorcycle` → `دراجة` candidate. The two new IDs are appended to preserve all earlier PUA mappings: inspection-temporary uses U+E01F and counter-terrorism uses U+E020.

## TrueType use and limitations

Each TTF has 1000 units per em and nominal 1000-unit cap height. Arabic/Western/Persian numeral aliases map to the exact same outline in that profile. Missing glyphs remain `.notdef`; there is no implicit fallback embedded in any TTF.

Whole words use explicitly listed private-use tokens beginning U+E000, with the same global word-ID order in every subset. The connected هـ class token uses U+E100. `ttf/font-mapping.json` is the authoritative mapping. A PUA word token is a complete joined shape, never an Arabic alphabet letter. These convenience subset fonts intentionally have no GSUB/GPOS tables. Typing an arbitrary Arabic word into one will not produce correct connected shaping; use the pre-shaped token or the SVG wordmark API. The original Noto Naskh typeface is a separate full OpenType font, not something these limited exports pretend to replace.

The TTF conversion changes cubic curves into TrueType quadratics with a maximum 0.35 font-unit conversion error. Even-odd research contours are converted into equivalent nonzero outer/counter winding before export, without changing the geometry. TTF raster tests compare the actual exported glyphs against canonical SVG paths, including counters and joined-word holes.

The current build contains seven profiles, 172 serial/series masters, 33 candidate wordmarks and eight observed wordmarks. Validation covers all seven TTFs and 60 raster comparisons, including both special-layout phrases; minimum SVG-to-TTF mask IoU is 0.991578.

## Rights and provenance

No EuroPlate or IRPlate files or derived outlines are included.

### GL-Nummernschild Eng and Mtl

Copyright 2009–2026 Gutenberg Labo. The supplied licence grants unlimited use, modification and redistribution, commercial or noncommercial, without warranty. Full original licence: `licences/GL-LICENSE.txt`.

Pinned source: https://github.com/Gutenberg-Labo/GL-Nummernschild/tree/c108a385ad67eab0e4e7cc9e1f5c3b9072bdbbd2

The runtime and canonical renamed TTF subsets are derivatives of these actual licensed font outlines. They are documented FE-style candidates, not authenticated Iraqi official dies. Source binaries and SHA-256 values are recorded in `input-sha256.json`.

### Noto Naskh Arabic

Copyright 2022 The Noto Project Authors: https://github.com/notofonts/arabic

SIL Open Font License 1.1. Full original licence: `licences/Noto-Naskh-Arabic-LICENSE.txt`. The variable font is instantiated at weight 700 for export. Complete Arabic wordmarks are shaped using the native HarfBuzz OpenType GSUB/GPOS engine, then emitted as self-contained path outlines. The derivative subset font has the new family name “PlateForge Iraq Naskh Candidate Canonical.”

### Anbar taxi subset

Original photograph “Iraq licenceplate.JPG,” Dickelbers, CC BY-SA 3.0:
https://commons.wikimedia.org/wiki/File:Iraq_licenceplate.JPG

Licence: https://creativecommons.org/licenses/by-sa/3.0/
Full legal code: https://creativecommons.org/licenses/by-sa/3.0/legalcode

Modifications: existing manually authored smooth source-guided contours from the plate-wide rectified study; canonical baseline/bearing/advance normalization; outline-font packaging. The derived observed glyphs and wordmarks are offered under the same CC BY-SA 3.0 licence. Original photography and security artwork are not embedded in the runtime or these fonts. No endorsement by the photographer is implied.

### Erbil commercial truck subset

Original photograph “Erbil Iraq number plate truck 2015.jpg,” Kurdistantolive, CC BY-SA 4.0:
https://commons.wikimedia.org/wiki/File:Erbil_Iraq_number_plate_truck_2015.jpg

Licence: https://creativecommons.org/licenses/by-sa/4.0/
Full legal code: https://creativecommons.org/licenses/by-sa/4.0/legalcode

Modifications: existing manually authored source-guided clean complete contours; selected canonical ١ master; exclusion of damaged/occluded glyphs; baseline/bearing/advance normalization; outline-font packaging. The derived observed glyphs and wordmarks are offered under the same CC BY-SA 4.0 licence. Source image, surface damage, hardware and lamps are not included. No endorsement by the photographer is implied.

### Legacy Erbil and Sulaymaniyah subsets

Source photographs: O. A. Berke / Olav's plates

- https://www.olavsplates.com/foto_i/irq_548306_close.jpg
- https://www.olavsplates.com/foto_i/irq_3296_front_close.jpg

No source-photo reuse licence was verified. These remain private critical-study materials with a rights-review blocker for public redistribution. The normalization and TTF packaging do not manufacture a redistribution licence. These TTFs also set restricted embedding in the OS/2 table as an additional warning. Do not describe these historical subsets as freely licensed.

## Rebuild and validate

From repository root:

```
python docs/research/iraq-customizer/fonts/build_fonts.py
python docs/research/iraq-customizer/fonts/build_specimens.py
python docs/research/iraq-customizer/fonts/build_ttf.py
python docs/research/iraq-customizer/fonts/test_ttf.py
npx vitest run docs/research/iraq-customizer/fonts/iraq-custom-fonts.test.ts
```

Required local tools: Python with fontTools; native libharfbuzz; Inkscape for proof/raster validation; Pillow and NumPy for raster validation. No network download, system-font shaping, or optional EuroPlate/IRPlate asset is required. The runtime template is `runtime.ts.txt`; edit it and regenerate rather than editing the generated module.
