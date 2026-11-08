# Colour, substrate edges, and historical typeface evidence

Reviewed 7 November 2026. This is the second pass, after `2468924`.

## What is now corrected

The selected 2004–2009 references support rounded outer silhouettes. The 2004
renderer had square corners; the 2005–2009 branch used a very small generic
radius. The audited layouts now use an approximate `0.08 × height` for 2004 and
`0.10 × height` for 2005–2009. The 2005, 2007, and 2009 references have the
clearest rounded boundaries. The 2006 source is damaged and the 2008 source is
blurred/tightly cropped, so their radius confidence remains lower. The larger
2006 APR image is cropped tightly to the decal and supplies no independent
radius measurement. [Substrate decisions](substrate-decisions.json) record each
source, previous value, chosen approximation, and exclusion.

The selected 2010–2016 photographs support square substrate corners. Their renderer
previously inherited a generic radius of `0.035 × decal height`. The audited
layouts now specify zero radius, and the two-digit solid renderer now respects
that existing layout field. The 2017
January–June layout remains square; July onwards retains its separate rounded
layout.

The physical transition is supported by ICBC's [Bulletin 14, dated 3 February
2016](https://www.partners.icbc.com/assets/3mOlwuSlJiQqbPjb7gfnBi/bulletin-14-leap-year-2016-insurance-decal-changes.pdf).
It identifies rounded corners, a slight colour change, and reduced font size
beginning with July 2017 expiry decals. The bulletin does not provide a corner
radius, cutting tolerance, measured colour, or decal typeface name. Its document
date differs from the publication date shown by the bulletin index; the
document's date is used here.

The regression checks the actual background rectangles for 2004–2016 and the
June/July 2017 boundary. A zero SVG radius represents the observed square design;
it does not certify physically perfect cuts, adhesive thickness, edge wear, or
the material's optical properties.

## Colour decision

The existing approximate palette is retained. [The colour observation
figure](colour-observations.png) shows six explicitly located blank substrate
patches in the enlarged 2015 and November 2017 photos. The accompanying
[measurement file](colour-observations.json) preserves the pixel boxes, source
hashes, medians, and per-channel 10th/90th percentiles. These statistics describe
the decoded photograph pixels only.

For example, the three November 2017 patches have different green values, and
the existing model's green is darker than those patches. That is a real digital
comparison. It does not resolve the physical green: no calibrated target,
controlled illumination, or measured material sample accompanies the photo.
The official illustration is also a raster illustration, with a visible
security pattern; it is not a colour standard. This pass does not invent an
exact replacement RGB, Pantone, or CMYK specification.

The underlying material is another limit. Bulletin 14 says the watermark's
appearance in person differs from the accompanying photos. ICBC's [Bulletin
17, dated 7 February 2017](https://www.partners.icbc.com/assets/4R45ykMZi3RDDG0z2BP6mA/bulletin-17-decal-replacements.pdf)
also documents fading affecting the date, control number, and barcode. Pale
or broken ink in an old photograph is therefore not automatically the intended
ink colour or a hole in a glyph master.

## Typeface decision

No exact historical typeface identity is established by the primary documents
reviewed here. Bulletin 14 describes a size reduction without naming a font.
The project distinguishes portable native-font candidates, authored glyph
reconstructions, and supplied artwork. Close outlines, a matching width, or a
documented supplier alone would not establish which font version or printing
master produced a decal.

The second-pass lettering records therefore describe the particular observed
characters, repeated specimens, construction decisions, and remaining
uncertainty. An unobserved glyph is not promoted to a historically verified
character because another digit in its profile matches.

## Evidence that would settle the remaining material questions

| Question | Useful additional evidence |
| --- | --- |
| Exact colour | A physical sample measured under a specified illuminant, or an original production colour specification. A photograph with a calibrated colour target would improve digital comparison but still needs its capture conditions. |
| Exact substrate size and corner radius | An intact sample measured directly, or a dimensioned cutting specification. Photographs with all physical corners visible can support approximate registration. |
| Surface finish and security layer | Multiple controlled lighting/viewing angles of the same specimen, or the material specification. A single flat photo does not capture directional effects. |
| Historical font identity | Original artwork/font records or sufficiently detailed production documentation; visual similarity remains a candidate identification. |

## Reproduce

```sh
python3 scripts/analyze-decal-material-evidence.py
npx vitest run src/templates/bc/decal-residuals.test.ts --maxWorkers=1
```

The original bulletin bytes, archive URLs, official URLs, and SHA-256 values
are recorded in [primary-documents.json](primary-documents.json). The source
photographs remain credited to BCpl8s. Analytical patch annotations do not alter
the underlying photographic colours.
