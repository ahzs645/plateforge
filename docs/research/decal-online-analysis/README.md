# Online photographic and font research

This review extends the earlier glyph audit with independent online evidence. It
covers all **55 catalogue variants**, all twelve expiry months of 1986, and the
July/November 2017 change: **68 selected specimens**. A downloadable before/after
comparison is in `public/bc-decal-online-review/standalone.html`.

## What the sources establish

- [BCpl8s decal gallery](https://www.bcpl8s.ca/Decals-Gallery.html) and
  [decal history](https://www.bcpl8s.ca/Decals.htm): 547 distinct passenger-image
  URLs inventoried, with dimensions and SHA-256 hashes. Contact sheets were
  inspected across the years, and the selected 68 references were examined in
  detail. An inventory entry does not imply a sharp image, an issued specimen,
  or a verified glyph. Several larger photographs still have faded lettering.
- [1978 Motor Vehicle Branch placement guide](https://www.bcpl8s.ca/PDFs/Decals/1978DecalGuide.pdf):
  its embedded 5409 × 8431 scan preserves the wide squared B/C construction.
  The cropped SAMPLE decal is supplemental artwork, not an issued control.
- [ICBC Bulletin 14, February 3, 2016](https://www.bcpl8s.ca/PDFs/ICBCBulletin14.pdf):
  explicitly dates the smaller lettering, rounded corners and colour change
  to **July 2017 expiry onward**. Its JUL 2017 illustration is supplemented by
  the gallery's 1000 × 446 issued NOV 2017 photograph. Example controls in the
  bulletin are illustrative. JAN–JUN 2017 keep the earlier format.
- [ICBC Bulletin 17, February 7, 2017](https://www.bcpl8s.ca/PDFs/ICBCBulletin17.pdf)
  documents fading and a third party supplier, without identifying a typeface.
  BCpl8s identifies CCL Industries as the maker as of 2012; this does not prove
  earlier suppliers or font choices.

## Typography decisions

The comparison examines every line and every repeated letter/number separately.
Original line breaks remain explicit renderer strings, rather than browser wrap.
The 1975/1977 class line now includes the photographed `PASS. COMM.` punctuation.

Native font candidates replace the earlier outlines where source overlap improves:
1970 province (Orbitron 900); 1971 year (Russo One); 1974 digit 7 (Archivo 900,
native width 75) and province/class (Archivo 900); 1975 year (Archivo 900,
width 75), province/class (Nimbus Sans Bold); 1976 BRITISH (Nimbus Sans Bold);
1977 year (Archivo 900); 1978 B/C (Orbitron 900); 1980 month (Archivo 900);
1983 province (Archivo 900); 1991/1997 month (the existing compressed heavy
profile); and 1996 month (Anton). Unchanged letters and years remain visible in
the report, including uncertain tiny lettering. These are reconstruction choices,
not declarations of historical font identity.

For 1986, all twelve month photographs expose the rounded M/A and other capitals.
M and A have explicit geometric reconstructions supported by repeated specimens;
other letters use separately documented native candidate outlines. The profile
is deliberately identified as a mixed reconstruction. The supplied EXPO artwork
is excluded from ordinary font fitting.

[Microgramma](https://fontsinuse.com/typefaces/1847/microgramma),
[Eurostile](https://fontsinuse.com/typefaces/3424/eurostile),
[ITC Ronda](https://fontsinuse.com/typefaces/10234/itc-ronda), and
[Handel Gothic](https://fontsinuse.com/typefaces/985/handel-gothic) documentation
provides relevant family and period comparisons. Ronda documentation describes
alternate capitals omitted by some modern releases. None of these references
names the face used to print the BC decals. Orbitron is a modern open candidate,
not an assertion that it existed in 1970. No proprietary font binaries are bundled.

## Comparison method and limits

Each source is SHA-verified and cropped using `reference-manifest.json`.
The renderer is uniformly centered at crop height. Images retain their original
perspective; no unmeasured corner rectification is presented as exact alignment.
Pink marks thresholded source paint, blue model paint, and dark overlap.
Glyph comparisons normalize height and center only, never horizontal scale.
Archivo/Roboto width-axis instances are authored font designs, not arbitrary
horizontal fitting. Existing compressed profiles retain their documented earlier
transforms; they are not relabeled as native designs.

Independent paint projections or connected components permit relative scoring.
If these do not isolate the known string, windows are explicitly tentative and
receive no font score. Low-resolution characters are labeled. Mean overlap ranks
candidate shapes; scores depend on threshold, blur, damage and perspective and
are not font-identification probabilities. The faint 1983 control is excluded.
The before renderer is frozen at commit `d6d686b`, including its previous
punctuation and geometry. Before and after shape columns use the actual profiles from the respective
renderings; newly added punctuation is marked as absent in the before rendering.
The previous glyph report remains available without replacing its evidence.

## Rebuild and provenance

`python scripts/build-decal-online-analysis.py /tmp/plateforge-online-review`
downloads selected public references, validates their hashes and rebuilds the
portable report. Requires Python PIL/numpy/scipy/playwright and Chromium at
`/usr/bin/chromium`. The credited small embedded bulletin JPEG is retained under
`sources/`, with both document and image hashes in the manifest.

`python scripts/extract-decal-online-fonts.py /tmp/plateforge-online-fonts`
reproduces the new candidate outlines with fontTools. Candidate sources, hashes,
native axes and OFL notices accompany this directory. `candidate-outlines.json`
combines these candidates with the earlier audit candidates. The rounded capitals
are rebuilt by `scripts/build-decal-rounded-month.py`, which additionally needs
svgpathtools and Shapely. Production uses outlined JSON paths and has no new runtime
font or Python dependency.

## Final verification

1,864 tests in 59 files pass, along with the production build at `/plateforge/`.
All 572 selectable renderings pass clipping/collision checks. The new report
contains 1,875 unique occurrence records across 68 specimens; 765 have independently
segmented paint windows and 144 runs permit relative shape scoring. The remaining
windows retain explicit uncertainty. All 1,157 images load in both the linked and
portable report, with no 390px mobile overflow or browser/resource errors. Production
gallery and SVG/PNG exports pass, including Code 128 decoding. The June/July 2017
app export boundary is separately verified in `transition-validation.json`.
