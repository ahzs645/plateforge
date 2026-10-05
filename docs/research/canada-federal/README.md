# Canadian federal gallery inventory and reconstruction

Reviewed 2026-10-05. The federal selector now has **36 presets**: the national CANADA standard and two APEC military variants plus **33 gallery layouts**. [The source ledger](inventory.json) accounts for **41 federal-related photographic plate occurrences** and **13 provincial or territorial examples** excluded from this group.

The requested sources are [World License Plates · Canada](http://www.worldlicenseplates.com/world/CN_CDNX.html) and [License Plate Mania · Canada official](https://licenseplatemania.com/landenpaginas/canada_official.htm). The former explicitly links [Canadian Forces in France](http://www.worldlicenseplates.com/world/EU_FRAN.html#CN) and [Canadian Forces in Germany](http://www.worldlicenseplates.com/world/EU_GMIL.html#CN); their Canadian sections are included. Other countries' military plates are outside this import.

Open [the federal collection](https://projects.ahmadjalil.com/plateforge/#/ca-federal/standard) or [all 41 source/current comparisons](https://projects.ahmadjalil.com/plateforge/federal-reference-review/). Each photographic occurrence maps to an editable preset, credited source image, source caption and box coordinates. Repeated serials and colour variants can share a preset. Both SN475 compact and long layouts are preserved separately.

## What was added

- Canada-Fisheries side-tab and plain-number bases, plus bilingual Fisheries / Pêches 1976–1978, including the photographed leading zero.
- RCAF Sea Island 1957, its ambulance plate, DND 1968, black 1950s military shells, red-leaf and green-leaf CANADA variants, and two explicitly uncertain military-gallery references.
- Canadian Forces in Europe: blue and red bases, overlapping red block and narrow lettering, Exchange, trailer and compact motorcycle variants, and long/stacked CDN 2016-series designs.
- France and Germany RCAF wing plates, a 1 Wing attachment and a 4(F) Wing booster. The booster is a souvenir; the attachment's independent registration status is uncertain.

## Evidence and limits

All source occurrences were visually inventoried and their layouts compared with the new candidates. These small gallery photographs do **not** establish individual glyph outlines or identical physical tooling. New serial and legend constructions have `category` evidence, no manufacturer attribution, and protected profiles independent of B.C. research replacements. No alphabet is presented as a recovered historical font or an exact FE-Schrift reconstruction.

Captioned date spans are preserved. The 1990s–2016 caption uses 1990 as the decade’s lower bound for display, not as a discovered introduction year. The 2016 series is shown at its source-labelled introduction/example year; no end date is supplied. Website update stamps such as December 2024 and July 2026 are excluded from issuance dates. Undated designs have no `period`; related undated examples remain individually undated in the ledger even when their shared preset has a dated reference.

PPCLI Air Comdet is faded and its use uncertain. The flag/77·515 specimen is captioned “Unknown”; no date or issuer is invented. Small seals and validation-panel microtext are omitted or schematic. Physical dimensions are illustrative estimates, especially overseas long/compact shells; they are not measured factory dimensions.

The comparison page shows **actual photographic plate crops**, not traces. Its opacity overlay fits the approximate plate frame and explicitly does not claim perspective rectification or character alignment. Precise character isolation/contour validation of these newly imported photographs remains future work, distinct from the completed gallery inventory and layout import.

## Rebuild and verification

Implementation: `src/regions/canada/federal-catalog.json`, `federal-plates.ts`, `federal.ts`, `src/templates/dies/canada-federal.ts` and `src/templates/bc/art-federal.ts`.

Run `node scripts/build-federal-review.mjs` from the repository root. This uses Vite SSR and `scripts/crop-federal-references.py` (Python/Pillow). `FEDERAL_SOURCE_CACHE` optionally selects a cache directory. Downloads use the credited URLs and verify the ledger's SHA-256 before creating the 41 cropped thumbnails. Changed source bytes require reinspection and an explicit ledger update. Original composite gallery images are not committed. Thumbnail rights remain with their original photographers and galleries; credit and source links accompany every crop.

Run `npm test -- src/regions/canada/federal.test.tsx --maxWorkers=2`, then the complete bounded suite and `BASE_PATH=/plateforge/ npm run build`. The tests cover every new/old federal generator, national SVG metadata, photographic serials, leading zeroes, stacked serials, source coverage, uncertain/souvenir status, undated periods, and protection against inferred B.C. manufacturer assignments. Browser verification additionally covers every route, photo loading, opacity controls, group filtering, mobile layout and exports; recorded results live in [browser-verification.json](browser-verification.json).

The supplemental [APEC military comparison](../apec-military/README.md) adds the photographed red-maple-leaf No. 134 as a separate variant. The national CANADA standard and both APEC versions now share one layout factory. Total federal presets: 36; the original gallery ledger remains 41 photographed examples and 33 added layouts.
