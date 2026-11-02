# B.C. lettering: new source evidence and font candidates

Reviewed **2 November 2026** against PlateForge main `17b974f`. The machine-readable companion is [sources.json](sources.json).

The most useful new evidence is **ICBC's explicit separation of large-plate, motorcycle and other small-plate fonts**. There are also actual new-series passenger photographs of **U, Y and Z** and a BC-specific independently authored raster alphabet. None supplies a complete official vector font or supports replacing every BC die with one downloadable typeface.

## Official evidence to carry into the model

### Three font categories, with a dated dimensional reference

ICBC's [2013 RFQ 2013-056](https://www.bcpl8s.ca/PDFs/2013-RFQ/2013RFQ.pdf), preserved by BCpl8s, distinguishes three categories in **Questions and Answers #2, 12 July 2013, Q3/A3, PDF page 60**: large plates, motorcycles, and other small plates. Appendix A, **PDF/printed pages 10–11**, supplies these nominal dimensions:

| Item | 2013 specification |
| --- | --- |
| Large shell, height × width | 152 × 304 mm, ±2 mm |
| Small shell, height × width | 126 × 201 mm, ±2 mm |
| Large alphanumeric height | 65 ±1.7 mm |
| Generic small alphanumeric height | 44 ±1 mm |

These are historical specification values. They support separate research cohorts and a dimensional check; they do not establish every model's painted height. Nor do they identify an installed font. The RFQ's seven/eight *spaces* include the flag, so they must not be interpreted as seven/eight registration characters.

### Preserve the motorcycle size question

The [BC government's 30 April 2012 release](https://news.gov.bc.ca/releases/2012JAG0061-000569), in its licence-plate bullet and backgrounder section 3, states that new motorcycle plates had received lettering **0.95 cm / 3/8 inch larger since May 2011**. It gives no absolute final height.

There is therefore unresolved tension between a generic 44 mm small-plate entry in the later RFQ and the enlarged motorcycle evidence. Do not silently turn every small-format recipe into a 44 mm plate or infer a final 53.5 mm height by adding unrelated specifications. Record the two facts, then measure verified, straight-on specimens or obtain a motorcycle-specific drawing before altering the master.

The official [MV1675 (052011) guide](https://www.bcpl8s.ca/PDFs/2011-Licence-Plate-Guide.pdf) and [MV1675 (112014) guide](https://www.bcpl8s.ca/PDFs/2015-Licence-Plate-Guide.pdf) provide cross-class comparisons. The second file is named “2015” by the archive but is printed **112014**. Its full page was inspected: older/enlarged motorcycle samples and utility-trailer samples visibly need separate comparison groups. These are catalogue samples, not manufacture-dated field specimens.

PDF inspection found the plate specimens to be low-resolution raster images, generally a few hundred pixels wide. The embedded Helvetica Neue/Univers fonts belong to guide labels. Extracting them would not recover an official plate font. RFQ Appendix C likewise contains raster specimens.

### Contemporary repertoire has an official primary source

[ICBC bulletin 33, 9 June 2025](https://partners.icbc.com/assets/5GMseymkqs8E4Otb8osoGQ/bulletin-33-new-licence-plate-configurations.pdf), **pages 1–2**, confirms the passenger `A123BC` pattern, allows **U/Y/Z**, keeps **I/O/Q excluded**, and retains six registration characters. Rollout depends on inventory; Porteau Cove Parks precedes ordinary passenger plates. The bulletin says design, reflectivity and materials remain the same.

This supports current repertoire validation. It does not establish any particular U/Y/Z contour, a manufacturer's proprietary alphabet, or whether a syntactically valid serial was actually issued.

## Three new passenger-letter photographs

The [source-owner's 2025 passenger page](https://www.bcpl8s.ca/Passenger-2025.html), under “Official Confirmation,” supplies the following actual photographs. Each original was downloaded and visually inspected; byte hashes and each character occurrence are recorded in [sources.json](sources.json). Original photographs are not committed.

| Observed serial | New target | Original dimensions | Evidence value and limitation |
| --- | --- | --- | --- |
| [A907GU](https://www.bcpl8s.ca/images/Passenger/2025/2025-A907GU.jpg) | U | 222 × 123 px | Confirms U and offers G/7/0 comparisons; oblique view and frame obstruction. |
| [A820EY](https://www.bcpl8s.ca/images/Passenger/2025/2025-A820EY.jpg) | Y | 261 × 123 px | Confirms Y and offers E/8/2/0 comparisons; clearer outline, still low resolution and perspective. |
| [A250EZ](https://www.bcpl8s.ca/images/Passenger/2025/2025-A250EZ.jpg) | Z | 250 × 123 px | Confirms Z and offers E/2/5/0 comparisons; holder obscures physical corners. |

These add **18 photographed occurrences across 12 distinct characters** (`A E G U Y Z 0 2 5 7 8 9`). They are a useful qualitative holdout set. They have **not** been rectified, segmented, fitted or assigned an accuracy percentage. The existing constructed U/Y/Z can be compared with them, but should not be re-labelled as recovered or precisely traced glyphs. Source placement and filenames give series context; neither gives an exact manufacture or photography date.

## Downloadable alternatives: what was actually found

| Candidate | Creator's description / inspected form | Decision |
| --- | --- | --- |
| [Driver Gothic](https://canadatype.com/product/driver-gothic/) | Canada Type describes an Ontario-based design. | Useful comparison, not an identified BC font. No font binary downloaded in this review. |
| [Dealerplate](https://typodermicfonts.com/dealerplate/) | Typodermic lists 17 regional styles, including Ontario and Quebec; BC is absent. | No exact BC style to substitute. No binary downloaded or rendered. |
| [Googlefluff Canadian License Plate Pack](https://www.beamng.com/resources/canadian-license-plate-pack.912/) | Downloaded v1.2.1; BC-specific diffuse, normal and specular atlases, each 1024 × 512 px. | A useful independent BC recreation to compare against photographs; not production tooling. |

Driver Gothic's displayed ordinary web licence excludes interactive text/image-generation applications. Dealerplate distinguishes static desktop use from embedding licences. A normal website licence should not be assumed to cover a font-driven image editor or distributable font files. These product facts are recorded to avoid introducing an unsuitable dependency, not as a finding that existing PlateForge code uses those fonts.

### BeamNG candidate: inspected, but not promoted to ground truth

Googlefluff's listing and package metadata expressly allow reuse of the author's custom fonts with credit. The [12 August 2023 release note](https://www.beamng.com/resources/canadian-license-plate-pack.912/updates) describes a rebuilt BC font/background. The current listing identifies version **1.2.1, 7 August 2026**.

Inspection of `vehicles/common/licenseplates/british_columbia/platefont_d.png` shows sweeping 6/9 forms and a bent 7, making it a more relevant BC-specific comparator than a generic North American plate face. It is a **raster atlas**, with separate material maps, not TTF/OTF/WOFF. The package references default BeamNG metrics not included in the archive; this review therefore does not claim an independently reproduced game render.

The current template still generates the older **AB1-23C** arrangement and lists **all 26 letters**. Its grammar must not replace ICBC's repertoire rules. The creator's font permission also should not be generalized to every logo/background asset. The downloaded package and images remain temporary inspection material; only source identifiers and hashes are committed.

## Practical next comparison

1. Keep the existing era-specific masters. The earlier September Waldale study's 0/7/P/J/A/1 changes are already described as applied in [bc-dies.md](../../bc-dies.md); its older isolated-study README is a dated record, not proof the changes are still missing.
2. Add the three new passenger photos to the review queue with their actual limitations. Compare U/Y/Z and the repeated A/0/E occurrences without independently stretching width to hide differences.
3. Keep motorcycle and other small-format evidence separate even where the current renderer shares a parent profile. The 2013 font-category statement is stronger evidence for this separation than visual similarity alone.
4. Use the BC-specific atlas as an independent candidate, evaluated against real held-out plates. A recreation agreeing with another recreation does not establish historical accuracy.
5. Seek straight-on, sufficiently resolved specimens spanning the weaker letters, plus motorcycle-specific size documentation. Log scale, physical corners, paint versus embossed shoulders and manufacturing/date evidence before fitting reusable contours.

The review found **no downloadable official BC serial alphabet** in the inspected primary documents or candidate creator pages. That is a bounded search result, not proof that no official drawing or licensable manufacturer font exists elsewhere.

## Reproducibility: source archive not recovered from Git

On 2 November 2026, the repository was a **full, non-shallow clone**. Git advertised three branch heads (`main`, `claude/tender-knuth-1d7kye`, and `work/typography-consistency-20261013`), no tags, and 16 pull-request heads. Every advertised pull-request head was already an ancestor of inspected main **`17b974f51c687780c5d0b106fd9ae37e4c83ccae`**. Searching all **157 reachable commits / 6,561 reachable objects** found neither `catalog.json` nor `format-role-inventory.json`, none of the documented BC `review-package`/`continuation-*`/`refinement-*` source directories, and no tracked archive file (`zip`, `tar`, `tgz`, `tar.gz`, `7z`, or `rar`).

The introduction commit, [e55727438e445260027f1e22610b6fe1c99c26fd](https://github.com/ahzs645/plateforge/commit/e55727438e445260027f1e22610b6fe1c99c26fd), explicitly says the source studies were archived outside the repository and ignored by Git. Its tracked additions include the compiled `src/templates/dies/research-registry.json`, the builder, and the archive handoff. The [pinned builder](https://github.com/ahzs645/plateforge/blob/17b974f51c687780c5d0b106fd9ae37e4c83ccae/scripts/trace-bc-dies/build_research_registry.py) requires both missing inputs; its output keeps glyphs and bindings, but not the complete original observations or source catalogue. Reconstructing new inputs from that output would not recover the original evidence.

The committed registry remains available for deterministic rendering and the new occurrence audit. **Source-to-registry regeneration is not reproducible from the inspected Git history alone.** Recovery requires the separately archived review package referenced in [bc-research-dies.md](../../bc-research-dies.md), or a new, explicitly documented reconstruction of its sources. This check was confined to repository refs, objects and history; it does not establish whether an unpushed archive or the user's `~/Desktop/research` copy still exists elsewhere.
