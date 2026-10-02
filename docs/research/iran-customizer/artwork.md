# Iran special artwork: source-guided flat studies

`src/templates/iran-custom-artwork.ts` supplies seven separate legacy free-zone emblems and a simplified Bagh-e Melli gateway illustration. It does not embed photographs, copy complete plate drawings, use network-loaded artwork, or add security marks. All contours in the helper are hand-authored SVG geometry.

## Evidence and inspection

The bounded source set is the Wikipedia plate diagrams already selected for the Iran inventory. The actual downloaded 250 × 125 pixel drawings were inspected, including enlarged views of their emblem pixels. The historic diagram contains a small inset photograph; those actual photograph pixels were also inspected before drawing the facade. Larger independent logo masters were not established. The helpers therefore report **source-guided approximation**, never an official/certified reconstruction or exact trace.

The diagram images are sources for visual study. Their creators' artwork, underlying logos and photographic rights remain separate from this implementation. No permission or public-domain status for those source assets is asserted.

| Zone | Observed visual structure retained | Inspected source |
| --- | --- | --- |
| Anzali | Gold central form between a dark-blue upper ribbon and cyan lower wave | [Wikipedia diagram](https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Pelake_MAT_Anzali.png/250px-Pelake_MAT_Anzali.png) |
| Aras | Green triangular mark divided by an open curved band, with a yellow sweep | [Wikipedia diagram](https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Pelake_MAT_Aras.png/250px-Pelake_MAT_Aras.png) |
| Arvand | Cyan and red square fields divided by a diagonal white folded strip | [Wikipedia diagram](https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Pelake_MAT_Arvand.png/250px-Pelake_MAT_Arvand.png) |
| Kish | White near-circular wave and open spiral, with negative-space gaps | [Wikipedia diagram](https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Pelake_MAT_Kish.png/250px-Pelake_MAT_Kish.png) |
| Maku | Dark-blue and gold circular form crossed by a tapering, winding white route | [Wikipedia diagram](https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Pelake_MAT_MAKU.png/250px-Pelake_MAT_MAKU.png) |
| Chabahar | Fine white outline with a tall curved sail-like form, inset loop and water lines | [Wikipedia diagram](https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Pelake_MAT_Chabahar.png/250px-Pelake_MAT_Chabahar.png) |
| Qeshm | Orange circular caps surrounding two blue waves and open separating gaps | [Wikipedia diagram](https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Pelake_MAT_Qeshm.png/250px-Pelake_MAT_Qeshm.png) |

### Historic-vehicle panel

The [historic-vehicle diagram](https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Pelak_melie_tarikhi.png/250px-Pelak_melie_tarikhi.png) shows a Bagh-e Melli photograph in the lower left blue panel. The new 180 × 130-unit flat illustration retains the raised, stepped central tower, the large central arched gateway, smaller flanking portals, paired columns and approximate tan/blue architectural accents. Sky and ground are plain fills. Fine tilework, inscriptions, heraldry, texture, plants and photographic lighting are omitted; they cannot be reliably recovered from the inspected inset. It is a simplified architectural illustration, not a replacement for the original photographic asset or a claim to exact issued-plate artwork.

## Rendering contract

- `renderIranZoneEmblem(zoneId, x, y, width, height, ink?)` returns `{ markup, warnings }`
- IDs are `anzali`, `aras`, `arvand`, `kish`, `maku`, `chabahar`, and `qeshm`; surrounding whitespace and letter case are normalized
- `renderIranHistoricArtwork(x, y, width, height)` returns the same shape
- The whole emblem/facade fits uniformly and is centered within its box, without independent horizontal stretching
- Default zone palettes reflect the inspected illustrations approximately; the helper does not paint a plate-side background. White elements need a contrasting panel, except Arvand's internal white separator
- Optional `ink` is an explicitly labelled customization that replaces coloured marks, retaining white separators and transparent gaps. Use the default palette for reference studies; a one-ink rendering can merge adjacent coloured regions
- Invalid coordinates or non-positive dimensions produce no markup and a warning. Unknown zone IDs produce no generic stand-in. Paint input accepts only hexadecimal colours or `currentColor`
- These helpers do not supply zone labels, country names, flags, numbering or layout rules. Those remain separate, editable scene elements
- Every rendered result includes honest approximation warnings and machine-readable artwork provenance; neither export nor small rendering removes those warnings

## Checks

The focused `iran-custom-artwork.test.ts` suite covers all seven distinct masters, characteristic palettes, uniform fitting, deterministic output, unknown IDs, invalid boxes, paint injection, font-independent geometry and historic-source attribution. It does not claim that passing automated tests authenticates the emblems. A visual contact-sheet check should accompany contour changes.
