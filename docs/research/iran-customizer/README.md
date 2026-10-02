# Iran: source-backed editable plate system

Research cutoff: **2 October 2026**. Baseline: **66c4de5fbb9e4d50f49a23afca11c1626a0a8b22** from `ahzs645/plateforge` main. This work was not pushed, merged, or deployed.

## Bounded coverage

- 53 editable flat presets, available in the main app, Iran workshop, chronological source explorer, and offline app
- 54 main Iran routes: the 53 presets plus the preserved `free-zone-study` route alias
- 52 image records from the two requested sources: 23 WorldLicensePlates rows and 29 Wikipedia diagrams/vehicle photographs
- One WorldLicensePlates plate explicitly marked **fake** is excluded as an issued specimen
- 11 additional previously inspected historical photographs are retained as evidence
- Three text-only 2017 free-zone class records have an explicit geometry barrier
- Earliest-registration claims have no invented 1920s plate template

These are separate counts. Several sources support one editable preset; aliases are not additional designs.

## Important corrections

- An April 2004 contemporary report says national rollout began in **Esfand 1382 (February–March 2004)** and already describes **520 × 110 mm** plates. Collector attribution to 2003 and the secondary 2005 dimension claim are kept separate
- **Solar Hijri specimen years** are never silently treated as Gregorian introduction years. The earliest inspected dated specimen is **1326 SH / 1947–48**
- The 1993/1998 city-band attribution is disputed, with phased replacement documented in 2004
- The 6 March 2016 diplomatic/service date is an **unveiling**, with operation planned for Ordibehesht 1395 (April–May 2016), not proof of completed replacement
- Foreign-travel TEH, THR, and touring-club plates are parallel additional plates. The 2002–03 AA bilingual plate is public transport, not a travel plate
- All seven old free-zone layouts are distinct. The 2017 report establishes a Qeshm pilot and class colours, but its image is only a generic news placeholder. No exact 2017 layout or zone-code arrangement is fabricated
- The 2010 travel plate’s tiny touring-club medallion is omitted and disclosed; the source does not establish its internal artwork clearly enough

## What is editable

Identifiers are rebuilt as vector runs: serial, prefix, isolated series letter, regional/mission code, joined city form, SH year/expiry, and free-zone choice where applicable. Supported class changes update letter/colour together. Layout adaptations, explicit aspect ratio, palette, uniform size, tracking and border controls are explicit. Private/public national plates offer a separate photographed arrangement via `nationalVariant`, preserving the distinct diagram geometry and its source labels.

Joined Persian words are whole OpenType-shaped outlines from licensed fonts. Isolated letters are not concatenated into fake joined words. Numeric input accepts Western, Persian and Arabic-Indic digits and normalizes to real Persian Unicode. A numeral zero retains its native small geometry and common baseline. Historical zero remains permitted; ordinary national serials exclude it.

All numeric source roles now have reusable 0–9 outlines. There are 62 profiles: 55 source-specific profiles (including observed and expressly inferred forms) plus seven licensed full candidates. The 61 numeric alphabets contain 183 observed and 427 inferred numeric entries, with no missing digits. Source-specific profiles expose 689 glyph/role/word entries representing 631 distinct profile/path pairs. These counts are not counts of authenticated dies.

Every inferred numeral remains labelled in the editor, SVG and audit. Strict mode permits those embedded completions but blocks genuinely unsupported letters or joined words; fallback is an explicit setting. The complete source-plane and whole-plate overlays disclose residual photographic uncertainty, low-resolution contours, diagram/physical aspect differences and the two internally inconsistent bilingual free-zone illustrations. See `fonts/README.md` and `artwork.md`.

## Navigation and builds

- `#/iran/<preset-id>` opens a preset in the main editor; every editor control is in the inspector (identifiers under Serial, glyph profile, policy, layout, ratio, spacing and palette under Style), with a *Source & font coverage* section
- `#/gallery/iran` lays out every preset by family and era, with the two evidence barriers
- The older `#/iran-customizer/<preset-id>` and `#/iran-timeline` links redirect to those; the separate editor and source explorer pages remain only in the offline HTML
- `node scripts/build-iran-customizer.mjs preview/iran-customizer.html` creates one offline HTML app using the same React components and scene engine, all licences embedded, no network dependency
- `node scripts/build-iran-review.mjs preview/iran-review` renders every preset and a standalone review board
- The older combined Iraq/Iran preview builder is retained and now resolves Iran through the same custom renderer

## Rights and reuse

OFL and GL font licences are bundled in full. Source photos and third-party illustrations retain their owners’ rights; the comparison pack is a **private research reference**, not an image licence for public deployment. The website renderer contains new flat geometry and licensed candidate outlines, not source-photo backgrounds. Source-guided historical outline studies have separately stated private-study restrictions. Obtain applicable clearance or exclude those profiles before public release. Existing repository assets outside this Iran change keep their pre-existing licence constraints.

## Verification

The package includes automated scene, glyph, bridge, route, reducer, export-lock and SSR tests; full-suite/type/build results are recorded in the delivery’s `VERIFICATION.txt`. Independent raster QA compares all inspected source images to source-matched editable states. Actual interactive cloud-browser testing remains blocked by `ERR_BLOCKED_BY_CLIENT` on the local preview URL; no browser-click verification is claimed. No restriction was bypassed.

## Number generation and per-preset format audit

The workshop’s **Generate valid number** button and ordinary Iran recipes share
`src/templates/iran-number-generation.ts`. A seeded `Rng`, string or number makes
its output reproducible. Generation uses the complete format-permitted numeral
repertoire, rather than just digits seen in one photograph. Observed outlines and
inferred completions remain separate in the rendered SVG and its metadata.

“Valid” is deliberately format-bounded. The tool does not certify issuance,
county/letter combinations, a diplomatic mission’s identity, manufacturing dies,
or the legal validity of a printed expiry. Historical zeroes remain available;
ordinary modern national serials and motorcycle serials exclude zero. Mission
identifiers are preserved, rather than randomly assigned. Existing valid codes,
Solar Hijri years, expiry months, city, zone and styling are also preserved. Invalid
identifier fields are restored to a format-supported value when generating.

Each source layout enforces its modelled number lengths. A photographed
four-digit historical serial is a four-digit reconstruction preset, not evidence
that an entire historical series universally had four digits. Historical initial
and Latin-legend controls are limited to their observed source forms. Modern
private plates expose the researched 13-letter list. Modern official classes
model starting allocation 11; unverified later allocations are not offered.

The ordinary editor offers source-covered city forms. The workshop lists supplied
cities and marks those requiring another profile or explicit fallback. Strict
mode permits embedded, labelled inferred numerals, but still blocks genuinely
missing glyphs or complete words. Generation does not silently turn fallback on.

Run `node scripts/build-iran-number-audit.mjs` to regenerate
[`numbering-audit.json`](numbering-audit.json). It audits all 53 presets separately:
active fields; numeric lengths and repertoires; class/letter/code constraints;
year behavior; actual numeral provenance; every digit in numeric roles; invalid
input; alternate layouts; and 32 seeded generated scenes per preset. Its pass/fail
status is computed from both the shared validator and actual renderer. The
associated Vitest tests also cover repeated editor edits/generation/navigation,
reset isolation, exact SVG snapshots and overlapping asynchronous exports.

Verification boundary: UI event orchestration is exercised through the immutable
reducer, rendered React markup and export service. PNG encoder tests verify the
exact SVG, dimensions and 4× scale passed to the encoder using a test double;
they do not verify real browser rasterization or a completed download. Browser
click/download verification is separately required when a permitted browser
surface is available.
