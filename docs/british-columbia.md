# British Columbia passenger system: 1940–1963

Implementation scope: 24 annual recipes, plus the documented 1962 four-digit no-dash variant. Region `ca-bc`, template `bc-historical`, group `Canada`. No other Canadian province or BC vehicle class is implied. Example routes: `#/ca-bc/1951`, `#/ca-bc/1953`, `#/ca-bc/1958`, `#/ca-bc/1962-no-dash`.

## Evidence and reconstruction

The supplied chart is a visual starting point, not a set of universal annual templates. Research sources are Christopher Garrish's BCpl8s passenger histories and their plate photographs, consulted September 26, 2026:

| Source | Implemented distinctions |
|---|---|
| [1940–1948](https://www.bcpl8s.ca/Passenger-1940-1948.html) | Stacked date at right; annual colours; 290 × 137 mm through 1946 and 287 × 137 mm for 1947–48. Supported prefix subsets change with year. 1948 excludes farm F and uncertain passenger T; includes documented replacement prefixes. |
| [1949–1951](https://www.bcpl8s.ca/Passenger-1949-1951.html) | 287/335 × 137 mm short/long bases. The 1951 renewal uses a 1950 base with a separately numbered blue-on-white strip, 270/318 × 36 mm. A six-digit numeric serial selects the long geometry. |
| [1952–1954](https://www.bcpl8s.ca/Passenger-1952-1954.html) | Shared 350 × 140 mm aluminum 1952 base. 1953 white-on-blue and 1954 yellow-on-black renewal tabs occupy 90 × 140 mm at right. Original 1952 date and emblem remain under the overlay. |
| [1955–1963](https://www.bcpl8s.ca/Passenger-1955-1963.html) | Source-reported 300 × 150 mm steel bases, lower date, changed lettering. Extra potential-tab attachments for 1955–57. Distinct 1958 centenary inscriptions. A 1962 no-dash variant is documented within 1000–1999. |

Dimensions are the site's reported millimetres, not a claim that rounded centimetres equal an exact conversion of nominal 12 × 6 inches. Serial lengths alone do not capture every manufacturing exception. Neither registration totals nor approximate over-run counts are treated as complete continuous issuance ranges.

### Accuracy boundaries

| Component | Status |
|---|---|
| Years, base/renewal relationships, colour names, broad layouts | Researched against BCpl8s; source attached to every format and SVG metadata. |
| Width/height and renewal dimensions | Source-reported measurements; not newly measured from an original plate. |
| Paint hex values | Digital approximations. Aging, scanning and illumination prevent calibrated paint recovery from the chart. |
| Original stamping dies | **Not reproduced.** Existing Barlow Condensed is a live-text proxy with rounded/italic and block profiles. Do not describe these as exact historical fonts. |
| Totem/maple-leaf emblem | One original, editable **approximate** vector master shared by the base and tabs. Needs a dedicated reference comparison before archival use. |
| Rim, corner radii, slots, text metrics, tab-ID positions | Estimated geometry; not a fabrication drawing. |
| Serial validation | Supported syntax and year-specific subset only; not actual registration verification or a complete issue-allocation database. |
| Weathering, repainted/re-stamped 1943 surfaces, late blank-base and suffix variants | Not reproduced. 1952-base W/Y over-runs and additional regional details remain outside this first subset. |

No source photographs or font files are included in this change. Existing app font imports are reused. BCpl8s photographs remain the property of their respective rights holders. Generated plates are for research, mockups and design, not official issuance.

## Shared implementation

`src/regions/canada/bc-data.ts` holds source records and year recipes. `bc.ts` owns editable fields, generation, normalization and validation. Neither owns an SVG drawing.

`src/templates/bc/scene.ts` builds one SVG scene tree from shared label, shell, rim, mounting-slot, date, strip, side-tab and emblem primitives. `src/templates/bc.tsx` is only the React adapter. The pure scene serializer also drives the standalone preview, so it is not a second set of plate drawings.

Five layout families compose the 25 formats:

- `stacked-year`: 1940–1950.
- `renewal-strip`: 1951, retaining the 1950 base date.
- `totem-base`: 1952–1954; optional renewal overlays.
- `annual-standard`: 1955–1957 and 1959–1963.
- `centenary`: 1958, province above and anniversary inscription below.

In default lettering mode all inscriptions remain SVG `<text>`. Optional construction-type modes render the serial as procedural paths; see [Serial lettering](lettering.md). The totem is a single `<symbol>` used by `<use>` instances. Hole masks cut through base and overlays. IDs are scoped using React `useId` to prevent cross-plate collisions in a batch. Flat rendering is the default; embossing is optional. Arbitrary serial text is escaped by the standalone serializer and handled as React text nodes in the app.

The existing region picker, format chips, seeded batches, CSV/JSON export and PNG/SVG export require no BC-specific UI branches. SVG exports include machine-readable year, baseYear, dimensions, source, material note and reconstruction status. An optional generic `PlateFormat.references` field adds source links to the inspector. `PlateTemplate.size` accepts optional parts for serial-dependent dimensions; current exports already use the rendered viewBox.

## Editable fields

`serial` is the actual plate identifier. `tabSerial` is a separate optional renewal-control number for 1951/1953/1954; it is not copied as part of the plate identifier and is not invented automatically. `finish` is flat or embossed. Design overrides can change `background`, `ink` and `serialFontFamily` without copying a renderer.

Random generation deliberately samples a conservative supported subset. Manual entry accepts a wider syntax domain and still does not certify historical allocation. The six-digit no-dash case is not generalized: the special 1962 format accepts only four digits in 1000–1999. Standard 1962 formatting remains separate.

## Tests and remaining work

`src/regions/canada/bc.test.ts` supplies 38 cases, including 400 samples for each of 25 formats (10,000 generated/rendered samples), determinism, chart examples, width boundaries, retained base dates, independent tab numbers, shared emblem references, XML escaping and reconstruction metadata. The repository-wide test already exercises every registered format.

Run `npm ci`, `npm test`, and `npm run build` in the complete repository. Local validation for this package used TypeScript compilation of the pure modules and a Node assertion harness executing these same test callbacks; this is not a claim of having run the full app/Vitest build in that environment. Browser preview checks are recorded separately in the delivery package.

For the next accuracy pass, audit original numeral/letter dies and the 1952 emblem against multiple straight-on specimens. Preserve profile IDs and replace masters, not 24 independent drawings. Then extend the same model to pre-1940 and post-1963 bases, later stickers/renewals and separate commercial, farm, motorcycle and trailer classes. Those are **future work**, not implemented coverage.
