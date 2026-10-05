# Royal Tour 1951 and APEC 1997 fixed inscriptions

The two constructions replace unsuitable generic browser fonts with exportable filled outlines. The comparison page at `public/bc-font-comparisons/ceremonial/` overlays each complete inscription on its original photograph. Slider opacity exposes the original paint and the reproduction separately. Its SVG lettering is generated from the same paths, advances and layout values recorded in `layout.json`; full-photo registration remains approximate.

## 1951 Royal Tour

Source: [BCpl8s 1951 Royal Plate](https://www.bcpl8s.ca/images/LiuetenantGovenor/1951-Royal-Plate.jpg), 500 × 268 pixels. The gold numerals have strong stroke contrast, a narrow flagged 1 with hairline serif foot, an oval 9 descending into a curved ball terminal, and a flat-topped 5 with a ball terminal. Georgia's broad slab foot and heavy bowls do not match. Nimbus Roman, Latin Modern Roman optical sizes and Bodoni Moda optical variants were checked; none reproduces all three characteristic shapes together.

`royal-1951.ts` therefore supplies only observed 1, 9 and 5 as one smooth high-contrast construction. It does not copy wear, reflections or fuzzy paint edges. Measured source paint extents are approximately 18 × 53 pixels for 1, 34 × 54 pixels for 9 and 35 × 52 pixels for 5. The corresponding normalized master widths are 34, 64 and 65 at cap 100. Both runs use cap 33 mm and baseline 95 mm; pair spacing reflects the photographed gap without changing the glyphs. No historical typeface identity is claimed. The supplied coat of arms image is not changed.

## APEC 1997

Sources: [ICBC 121](https://www.bcpl8s.ca/images/APEC/ICBC-121(XL).jpg) and [ICBC 100](https://www.bcpl8s.ca/images/APEC/ICBC-100.jpg). Both show round geometric mixed-case sans lettering rather than a condensed sans. Diagnostics include the single-storey `a`, circular `o` and `C`, broad `V` and shallow `r` shoulder. The complete Vancouver, British Columbia, Canada and date lines were checked as photographic overlays.

TeX Gyre Adventor Regular is used as a visual substitute, without asserting it was the original historical font. Its native glyph paths and advances are normalized uniformly from cap height 739 to 100. Only the characters required by the four inscriptions are present. Main-line tracking is −3 cap units, preserving all glyph widths. Cap height, baseline, centre and tracking values are recorded in `layout.json`; there is no per-letter deformation. The small date remains limited by the available photographs.

The source font is not bundled. Provenance and copyright are recorded in `apec-font-provenance.json`, with the GUST Font License copied alongside it. Construction and render checks are in `src/templates/dies/event-lettering.test.ts`.

## 1987 Royal motorcade slogan

The screened serif slogan is checked against both [ROYAL 18](https://www.bcpl8s.ca/images/LiuetenantGovenor/ROYAL18(XL).jpg) and [ROYAL 1](https://www.bcpl8s.ca/images/LiuetenantGovenor/ROYAL1(XL).jpg). TeX Gyre Termes Regular provides the close Times-compatible high-contrast visual substitute; the historical typeface is unconfirmed. The complete mixed-case phrase preserves native outlines and advances, with cap 16.5 mm, centre 153 mm, baseline 37 mm and tracking −4 cap units. ROYAL 18 is the layout calibration specimen; the second plate supports the same serif construction but has small residual placement and photographic registration differences. The comparison page shows both photographic overlaps. No embossed rims or photographic paint defects were traced. Only the fixed phrase characters are imported; source font, copyright, license and layout are recorded in `royal-slogan-provenance.json`.
