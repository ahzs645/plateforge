# Plate reference library and extended B.C. passenger bases

## Open it in the application

Choose **Library** in the main mode tabs, or open `#/library`. This is part of PlateForge, not a standalone preview. The source browser and lettering catalogue are separate from the plate editor and batch generator.

The source browser starts with passenger-base chapters. Search title/URL/heading metadata, select either source, change the collection, or filter by a page's indicated period. Open a collection to browse image references and document links. Image previews are **off by default**; enabling them loads only the visible page's allowlisted remote images. Broken previews retain their source link. Images, captions and dates are not all individually reviewed.

Where a source page has an implemented base recipe, its detail view offers links into the actual editor. That relationship is source-page-to-recipe, not a claim that every photograph on the page has been reconstructed. Opening an editor leaves its own documented defaults intact.

## What has actually been brought in

The September 27, 2026 metadata snapshot contains:

| Item | Scope |
|---|---|
| B.C. source pages | 320 successfully indexed HTML pages out of 350 discovered links; the other 30 returned HTTP 404. The discovered queue was exhausted, but unlinked material is not covered. |
| B.C. passenger histories | All 20 linked passenger-history chapters, covering the site's 1904 to 2025-and-later sequence. These are reference chapters, not 122 individually finished annual renderers. |
| Image references | 16,474 unique URLs, occurring 17,385 times across the indexed pages. Counts include supporting documents, people, page decorations and other images as well as plates. They are not counts of unique plate designs or verified working images. |
| Leeward article series | Ten browser-verified article links. The automated HTTP response did not establish usable article-series coverage, so it is explicitly marked partial rather than silently treated as a successful complete crawl. |
| Leeward jurisdiction classifications | 70 dated records transcribed from the classification article: 51 U.S. entries including D.C., 13 Canadian provinces/territories, five other source jurisdictions, and one aggregate Mexico entry. The introduction dates the survey to February 2011. |
| Editable B.C. generators | 433 designs in 16 families; the original 1940–1985 passenger presets are described here, the rest in [bc-coverage.md](bc-coverage.md). |

The committed `public/data/reference-library/coverage-report.json` preserves the exact missing URLs and import limitations. Neither this documentation nor the UI calls the whole task a complete archival reconstruction.

## New editable base systems

The new files `src/regions/canada/bc-later.ts` and `src/templates/bc/later-scene.ts` share recipes and primitives, rather than embedding a separate image for each plate.

- **1964–1969 annual BEAUTIFUL plates:** annual colours and date placement, including a separate approximate 1967 over-run subset using the split 19/67 arrangement.
- **1970 base / 1970–1972:** first ten-letter alphabet and a distinct KLL–KXX over-run preset, with the small lower-centre renewal box.
- **1973 aluminum base / 1973–1978:** LAA, LLA and LLL allocation-block presets, plus the documented ACME subset. The renewal box is at the upper right.
- **1979 aluminum base / 1979–1985:** AAA, AAL and ALL block presets, plus the 1985 fourth block (ALA–AXK, BLA–BRB) issued while the flag base was delayed; white-on-blue with a wider lower-centre renewal box.

Sources, dimensions, issue periods, base years and limitations are recorded in each recipe and SVG metadata. Annual number ranges and alphabet combinations are supported subsets, not a registration database or an exhaustive official allocation engine. The generator avoids a small application-level list of offensive combinations; that is not an asserted complete official blacklist.

Renewal boxes are rendered **empty**. Actual year/month decal artwork, every production exception, exact stamping dies, calibrated paint colours and historic emblem accuracy remain outside the implemented fidelity. The 1979 source contains inconsistent first-block endpoint text; the recipe records this and omits KKK conservatively rather than presenting an exact allocation claim.

## Lettering catalogue

The catalogue records the survey's categories without assigning them automatically to current state plates or all historical B.C. years. Virginia's serif exception is preserved. The Canal Zone entry is labelled historical. Mexico remains an aggregate entry rather than 32 invented state-specific designs.

Category specimens use PlateForge's original illustrative procedural glyphs. They are **not** imported commercial fonts or exact jurisdiction dies. The serif specimen is a system-font illustration, not an added Virginia font. Actual plate-specific links, when opened, retain their existing editor defaults and periods.

Sources:

- [Leeward classification](https://www.leewardpro.com/articles/licplatefonts/licplate-fonts-nam-class.html)
- [Leeward introduction and survey date](https://www.leewardpro.com/articles/licplatefonts/licplate-fonts-intro.html)
- [B.C. passenger chapter index](https://www.bcpl8s.ca/Passenger.html)
- [1964–1969](https://www.bcpl8s.ca/Passenger-1964-1969.html)
- [1970–1972](https://www.bcpl8s.ca/Passenger-1970-1972.html)
- [1973–1978](https://www.bcpl8s.ca/Passenger-1973-1978.html)
- [1979–1985](https://www.bcpl8s.ca/Passenger-1979-1985.html)

## Import and runtime design

`scripts/import_reference_library.py` is a bounded, sequential, robots-aware metadata importer using Python's standard library. It records source URLs, short bibliographic labels, page hashes and image references; it does not mirror photographs, fonts or article bodies. External Plate Shack / 15Q archives and document contents are not recursively imported. The one-off branch-writing workflows used to create this snapshot are removed before integration; there is no recurring crawler or production write credential.

`scripts/prepare_reference_library.py` turns the raw import into a small page index and one JSON shard per page. It explicitly distinguishes link-only Leeward entries from parsed B.C. pages. The application lazy-loads the library component, then its index, then the selected page's metadata. It never requests 16,000 photographs at startup.

`src/library/catalogue.ts` validates runtime metadata, restricts preview hosts/formats, filters metadata and resolves source-to-editor links. `ReferenceLibrary.tsx` adds abortable fetches, retry UI, safe external links, 24-item pagination, source credits and coverage reporting.

No photographs, article copies, new font binaries, or external scripts are included. Rights remain with the source creators and credited contributors; indexing a URL does not grant republication rights.

## Verification and remaining work

Unit tests validate every committed JSON shard and recompute image totals, source associations and category coverage. They also exercise seeded generation, serial boundaries, retained base years, SVG escaping and optional lettering on the new bases. Browser scripts test the actual production build, including all 42 B.C. presets, exports, library filters, navigation, privacy defaults, failed previews, retry and mobile layout. Browser tests mock external photographs; a successful test does not certify every remote image is available. Actual pass/fail results are reported by CI.

Still reference-only: B.C. pre-1940 and post-1985 base reconstructions, most non-passenger and specialty classes, individual specimens/decals, downstream external archives, and exact jurisdiction-specific fonts. These require further source review and dedicated reusable artwork, not a generic recolour labelled complete.
