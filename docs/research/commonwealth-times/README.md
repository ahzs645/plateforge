# Supplied lettering for the 1994 Commonwealth Games plates

Both the issued Royal Visit plate and its numeric prototype now use the uploaded `Times BoldItalic.ttf` for **XV COMMONWEALTH GAMES**. The heading is outlined, so the browser and exported SVG/PNG retain the same appearance without an installed font. The blue decal’s VICTORIA B.C. inscription uses the separately uploaded Helvetica Compressed Regular font. The embossed serial retains its independent Astrographic construction.

The supplied font identifies itself as Times / BoldItalic, PostScript name Times-BoldItalic, with 1,000 units per em. Its SHA256 is `34ac7d31dd92048c75ae7a66a85f0a57eb57224bff172bfb1b4f1369649063b1`. Only fixed-word glyph geometry is retained; the font software and archive readme are not bundled. Font curves and advances are normalized using the H cap height of 669 units. The complete heading is fitted at a cap height of 11.5 mm, baseline 36 mm and maximum width 232 mm against the clear Royal1994-R1 photograph; individual letters are not redrawn.

`python scripts/build-commonwealth-times.py /path/to/Times-BoldItalic.ttf` reproduces the glyph outlines. Both protected profiles are excluded from research-outline replacements and have no generated fallback for unrelated characters.

Source: [BCpl8s Royal Visit gallery](https://www.bcpl8s.ca/Royal.html). The uploaded digital font is used as requested; its exact identity with the original production version and exact photographic outline registration remain unconfirmed.

The supplied decal font identifies itself as Helvetica / Compressed, PostScript name Helvetica-Compressed, with 1,000 units per em and an H cap height of 712. Its SHA256 is `527a04336e66738691d16f740863fe853ff5fff022bce5b1270c8039b6b61a39`. Reproduce its fixed white inscription with:

```sh
python scripts/build-commonwealth-times.py /path/to/Helvetica-Compressed.otf "VICTORIA B.C." commonwealth-helvetica.json
```

The decal remains a separate screened component: native font curves and spacing, a declared 13 mm cap, baseline 134 mm and maximum width 96 mm. Any whole-run fit is recorded separately in the lettering timeline; drawing dimensions are not measured stamping-tool sizes.
