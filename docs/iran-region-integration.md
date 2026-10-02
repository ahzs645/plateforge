# Iran: ordinary registry integration

Snapshot: 2 October 2026. The registered `iran` region exposes **53 source-guided presets plus one compatibility route**. These are distinct editable recipes from a bounded inspected source set, not a claim that every Iranian plate ever issued is represented.

## One renderer, all main-app modes

- `src/regions/asia/iran.ts` supplies the ordinary Single/Gallery/Batch format contracts and the original timeline metadata
- `src/templates/iran-region-bridge.ts` translates their identifiers into `IranCustomState`
- `src/templates/ir.ts` delegates size to `iranCustomSize` and drawing to `renderIranCustom`, removing only the generated outer SVG before React supplies its own. Export and visible rendering therefore have exactly one SVG root and the same geometry
- `IRAN_CUSTOM_PRESETS` supplies the new recipe fields, source links, evidence notes, defaults and scene choice. A recipe receives `design.customPreset`; it does not need a parallel renderer

Examples: `#/iran/historical-1326`, `#/iran/full-city-gilan`, `#/iran/temporary`, `#/iran/diplomatic-old`, `#/iran/free-zone-old-qeshm`, `#/iran/international-teh`, and `#/gallery/iran`.

All 16 original format IDs remain. Their generators and validation semantics are preserved, including D/S `mission` (the documented 214 example), the national starting code 11 constraint, nonzero ordinary serial digits and motorcycle allocations. The `free-zone-study` route retains title-case zone options and nonzero serial validation, but now selects the corresponding local source-guided composition and emblem. It no longer renders a logo-pending placeholder.

Identifiers (`serial`, `prefix`, `letter`, `code`, `city`, `year`, `expiry`, `zone`) are Parts. The bridge maps the existing `mission` field to the scene’s serial position. Appearance (`fontProfile`, `missingPolicy`, `layout`, `nationalVariant`, `aspectRatio`, `bg`, `ink`, `strip`, `tracking`, `mainScale`, `border`) is edited in the inspector's Style section: those fields are marked `preserveOnGenerate`, so Generate replaces identifiers and keeps appearance. The bridge parses appearance Parts to the state's own types (numbers, `on`/`off` for the border) and ignores values that do not parse; Design may still supply typed appearance defaults, and Parts take precedence. Vehicle class is fixed by the format and is never read from Parts or Design, and Design cannot overwrite serial data. Validation reports the scene's errors too, such as glyphs the chosen profile lacks in strict mode or an invalid colour.

New historical generators retain the source preset’s year, city, class and supported letter by default while generating deterministic serials and numeric prefixes. This is structural test data, not an issuance database. Joined city names are supplied complete wordmarks; editable isolated Persian series use supported choices. Temporary expiry is Solar Hijri year/month; the older temporary month is 1–12. All synchronized bilingual rows use one serial.

## Chronology, without invented introductions

The original timeline accepts numeric periods only. A dated recipe can represent a specimen/tab year, a collector-attributed window or a reported modern milestone; its description and era summary state which. Unknown dates are not filled from `sortYear`, file names or a succeeding system’s introduction. Undated recipes remain in the format picker and Gallery.

- SH 1326–1342 samples appear at their two-calendar-year Gregorian spans, from 1947/48. The year tab dates the specimen, not a nationwide annual redesign
- Full-city layouts retain collector attributions and the disputed 1969/1972 boundary. No blanket 1979 domestic split is introduced
- The city-band family preserves the 1993/1998 disagreement and phased replacement
- 2003 is a catalogue label. [Radio Farda’s 26 April 2004 report](https://www.radiofarda.com/a/340739.html) establishes operation since Esfand 1382 (February–March 2004) and 520 × 110 mm. Private/public national formats use a 2004 coverage start; other undated national subclasses are not assigned the same launch
- Police has the separately reported 2012 date; military classes use their separately reported 2016 milestone. D/S was unveiled 6 March 2016, with operation planned for April–May 2016; that is not proof of complete fleet replacement
- Protocol, motorcycle, temporary, historic-vehicle and earlier political/service introductions remain unresolved. Old government is not dated from an image filename
- Only the Qeshm collector specimen receives a circa-2010 marker. Other local zone layouts remain undated rather than receiving that year by association
- Bilingual AA public transport, additional foreign-travel plates, and foreign forces/UN observers are separate parallel families
- The 2026 endpoint is the research cutoff, not a withdrawal date

The old broad “pre-national,” temporary, historic-vehicle and earlier-diplomatic implementation gaps are removed because those layouts now have editable recipes. Two evidence barriers remain: earliest registration without an authenticated pre-1947 specimen, and the separate 2017 common free-zone redesign. The latter’s report confirms dimensions/class colours but its inspected image is a generic placeholder; exact geometry and zone-code assignments cannot be inferred from it.

## Verification

Run:

```sh
npm run typecheck
npm test
npm run build
```

`iran-region.test.ts` tests all current source presets and original routes; 20 deterministic generated/rendered examples per route; each selectable city, Persian letter and zone; actual React SVG structure and matching size; legacy mission and alias mapping; malicious edits; appearance/identifier separation; and dated/undated timeline contracts. The existing country suite also performs 500 generation/validation iterations per recipe. Fonts, artwork and custom scenes have their own independent tests.

See [font provenance](research/iran-customizer/fonts/README.md), [artwork scope](research/iran-customizer/artwork.md), and [Iraq/Iran notes](iraq-iran.md) for reconstruction limits. Candidate typography and source-guided artwork are not authenticated production dies or official issuance.
