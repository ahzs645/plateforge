# Source-specific free-zone whole words

The `zone-studies.json` input holds two hand-authored smooth word paths. They retain complete Persian word identities, including joining forms, dots, loops, and the Qeshm descender. No character alphabet, PUA mapping, generic font outline, or independent width/height stretching is used.

## Source and reuse

- Chabahar: [Anvaripour, Pelake MAT Chabahar.png](https://commons.wikimedia.org/wiki/File:Pelake_MAT_Chabahar.png), 26 September 2016
- Qeshm: [Anvaripour, Pelake MAT Qeshm.png](https://commons.wikimedia.org/wiki/File:Pelake_MAT_Qeshm.png), 26 September 2016
- Both file-description pages verified 2 October 2026: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- This adaptation is also CC BY-SA 4.0. Changes: isolated whole-word smooth vector reconstruction from the inspected 250×125 article thumbnail. These are illustrative plate diagrams, not certified manufacturing masters. The 2016 artwork date is not a plate-series introduction date.

## Placement and audit

The path coordinates are the original 250×125 reference plane. `sourceBox` records actual Bezier extrema; `sourcePlateFractions` supplies proportional placement. Retain a uniform scale when rendering. Do not share one Chabahar/Qeshm word rectangle: Qeshm is taller and starts higher.

`*-fixed-overlay.png` shows reference, reconstruction and registered overlay. Red is source-only ink, cyan reconstruction-only, black intersection. Alignment is fixed identity in source coordinates, uniformly rendered at 4×. No independent fitted scale, warp or local glyph alignment is permitted. `fixed-overlay-metrics.json` reports threshold-dependent ink overlap, not a certification or OCR accuracy score. Thumbnail anti-aliasing and manual smoothing limit exact pixel agreement. The white divider is excluded from Chabahar's mask.

To reproduce: render each `*-ink.svg` with Inkscape at width 1000, then run `python build-fixed-overlays.py`. Pillow and NumPy are required. PNGs are diagnostic only; the editable production input is `../zone-studies.json`.

## Other free-zone observations

- Qeshm and Chabahar diagram Latin rows use broad, shallow sans-serif figures. Their roughly 148×26 source-pixel rows differ from the taller roughly 149×39 Latin rows on Anzali, Aras, Arvand and Kish. A common row rectangle or generic width fitting flattens the latter or inflates the former.
- Anzali, Aras, Arvand and Kish English names are light sans-serif capitals low in the blue panel; Maku is explicitly heavier/bold. Letter spacing must be native/proportional, with independent word sizing rather than using main serial tracking.
- Chabahar has white lettering on blue; Qeshm black on white. Both left panels are about one-quarter width, while the other pictured free-zone panels are wider. A universal left-panel fraction misplaces both numbers and legends.
- The Qeshm/Chabahar diagrams repeat different serials in Persian and Latin (12365 / 12356). The generator should maintain internally consistent editable serials and preserve the inconsistency only in reference/audit notes.

## Native Latin numeric roles

Two additional profiles now supply full 0–9: `source-freezone-latin-wide` for Qeshm/Chabahar, and `source-freezone-latin-tall` for the other five bounded free-zone diagrams. Digits 1,2,3,5,6 are source-observed smooth studies; 0,4,7,8,9 are original source-style inferences, explicitly labelled individually. They are not official dies.

The wide source is the Qeshm image cited above (Anvaripour, CC BY-SA 4.0). The tall source is [Pelake MAT Aras.png](https://commons.wikimedia.org/wiki/File:Pelake_MAT_Aras.png), **Haghal Jagul, 9 October 2012, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)**, verified 2 October 2026; its adaptation remains CC BY-SA 3.0. Do not substitute the Qeshm author/license for Aras.

Fixed source-mask native row boxes are approximately [87,82,225,107] wide and [101,72,238,110] tall in the 250×125 plane. Earlier rough estimates of 148/149-pixel widths included surrounding whitespace; measured ink widths are 138 and 137 pixels. The registered role overlays compare the observed reference sequence only. Final overlay IoU: wide 0.7836; tall 0.7749. Path precision: 0.8740 / 0.8634; source recall: 0.8834 / 0.8832. These are diagnostic thumbnail thresholds, not semantic accuracy guarantees.

Advance is native 25 source pixels for 1 and 29.5 for other digits, with one shared cap/baseline per role. Keep the five-digit repeated serial internally consistent and do not reuse these numeral metrics for Latin zone names. Use the main source master for Persian numerals.
