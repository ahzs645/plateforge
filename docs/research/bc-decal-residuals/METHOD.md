# How this overlay pass separates font, spacing, width and placement

This review starts from the complete first-pass commit
`24689246670c25f91e0d1676a0647f053dbca68e`. Every comparison has an exact
catalogue variant, month and control string. A control is transcribed from the
photograph; the filename is only an identifier. Leading zeroes remain text.
Supplemental image captions and preliminary transcriptions that proved wrong
are retained in the evidence correction logs.

## 1. Establish what the source can support

Keep the original image beside each cropped or thresholded derivative. Record
its URL, credit, licence, original dimensions and SHA-256. Two crops of the same
marked specimen are one specimen, not independent corroboration. A government
illustration is labelled as an illustration. A sample with an all-zero control
can support its visible layout without establishing normal issuance.

For shape comparisons, reject empty masks, clipped ink, inadequate contrast,
insufficient painted height and an unexpected number of characters. Vary the
threshold and validate every sample. Rejected samples retain their reason and
cannot enter an accepted range. A whole run may have stable extents even when
blur joins its characters; in that case, withhold individual-glyph scores.

Tiny province lettering can sometimes support approximate whole-line location
and extent. Five to eight source pixels do not support a detailed capital
reconstruction. The larger independent photographs supply that evidence.

## 2. Use two different overlays for two different questions

**Shape overlay:** isolate a word, number or character and give source and
renderer the same actual painted height. Scale each uniformly, preserving its
width-to-height ratio, then align horizontally on its centre. Magenta shows
source-only ink, blue model-only ink, and dark their overlap. This reveals
counter shape, stroke weight, terminal shape and disproportionate letters.

The width ratio is:

`(model painted width / model painted height) / (source painted width / source painted height)`

A value of `1.075` means the model is about 7.5% broad at equal painted height.
It does not mean that the model is 92.5% accurate. A ratio of one can still hide
the wrong J hook, an A counter, a narrow first letter and a wide last letter.

**Composition overlay:** give the complete decal and photograph the same frame
height and align their horizontal centres. Preserve both original aspect
ratios. This exposes baselines, side margins, line spacing, province position,
control boxes, borders and barcodes. A broad photographic frame remains broad;
the renderer is not stretched to make its edges coincide.

Neither overlay rectifies photographic perspective. Tilt, blur, damage and ink
spread remain explicit limits. These overlays are diagnostics, not physical
measurements of a decal or authentication scores.

## 3. Change the parameter responsible for the mismatch

| Observation | Parameter to inspect | What the review does |
| --- | --- | --- |
| Every printed group is displaced together | Frame registration or source crop | Check the crop and aspect before changing type. |
| A whole run has the right shape but is high, low, left or right | Anchor and baseline | Translate the run; retain its contours and advances. |
| Width and height differ by the same proportion | Cap height | Resize uniformly, including native overshoot and stroke. |
| Only one letter is broad, a counter is wrong, or a terminal differs | Glyph construction | Compare native candidates and repeated occurrences; use a limited authored subset where evidence supports it. |
| Individual shapes are close but gaps drift across the word | Advances, tracking or pair spacing | Compare starts and actual ink gaps separately; do not use one global width factor. |
| A run unexpectedly becomes short | Maximum-width ceiling | Inspect `data-fit`; raising a ceiling only prevents reduction and does not create missing glyph breadth. |
| Text fits the frame but misses its own box | Control panel geometry | Measure the panel separately and verify actual ink remains inside it. |
| Same expiry year has visibly different forms | Printing group or specimen variant | Keep distinct evidence groups. Do not invent a date boundary from one photograph. |

An existing native font is useful when its diagnostic forms are closer. A
matching overall width alone is insufficient. New vector profiles explicitly
refuse fallback characters and contain only the observed letters or numerals.
Their labels describe reconstructions, not confirmed historical font names.

## 4. Choose the narrowest supported scope

The fixed `04` can be shared across 2004 because six month photographs support
the same year construction. A margin calibrated from one JUN, MAY or JUL
specimen is an exact-month adjustment. That scope is a software calibration
choice, not a historical claim that a printing design changed that month.

The 1998 Type II and thick-border 1999 MAY masters remain separate. Early and
later modern numeral groups remain separate. Modern year and control digits
also remain separate. Fixed province words do not become evidence for an
entire unobserved alphabet.

## 5. Verify the assembled result

Render the actual production engine after integration. Inspect each changed
reference against the clean baseline, then every selectable month in each
affected family. Verify actual painted bounds, collisions, the printed glyph
sequence, exact controls, control-panel containment and natural fitting where
required. Check glyph components and counters from rasterized vector paths.

The application preflight uses its offered format/decal combinations,
validation and actual glyph output, including a leading-zero control. The
full application tests and TypeScript/production build check integration.
Browser interaction and exported PNG/PDF parity are a separate gate; an
Inkscape render or a passing server-side selection is not a browser pass.

The final ledger retains changed, corroborated and unresolved cases together.
It records what improved, the remaining discrepancy, the relevant source and
the next kind of evidence that would resolve it. Calibrated colour, precise
cutting dimensions and historical typeface identity require evidence beyond
these uncalibrated photographs.
