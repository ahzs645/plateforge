# British Columbia: coverage gaps and lettering plan

This summarises a family-level audit of [BCpl8s](https://www.bcpl8s.ca/) against PlateForge, reviewed 2026-09-27 at commit `ffadf0e`. The machine-readable inventory is `public/data/reference-library/bc-coverage.json`, browsable in the app at `#/library/coverage`. It has 67 **research topics**. That is not 67 distinct plate designs, and not a verification of every photograph.

## What exists

| Area | Presets |
|---|---|
| 1940–1963 passenger | 24 annual presets + 1962 no-dash = 25 |
| 1964–1985 passenger | 17: annual BEAUTIFUL plates, the 1967 and 1972 over-runs, 1970/1973 decal-base blocks, the 1978 ACME subset, and four blocks on the blue 1979 base |
| Renewal pieces | 1951 strip, 1953/54 side tabs, loose/base-only/blank-base modes, W/Y over-run prefixes |
| Non-passenger and specialty | None |

"Through 1985" means the blue 1979 base, which stayed in use while the 1985 flag base was delayed. It does not include the flag design.

Fixed since the audit: the **1985 fourth block** (`1985-fourth`, ALA–AXK then BLA–BRB, Hi-Signs) is now a preset. The documentation now describes all registered presets. The manifest records both changes under `repositoryUpdates`, and a unit test checks that its preset list matches the registry.

## What is missing

**Passenger periods.** The 1904–1939 chapters and everything from the 1985 flag base onward (1985–2001, 2001–2014, 2014–2025, 2025 configurations) have no preset yet. `BC_GAPS` in `src/regions/canada/index.ts` lists these. The timeline and gallery show them as dashed placeholders, so the history has no silent holes.

**Smaller gaps inside built periods.**
- 1972 dashless and re-struck production variants.
- Real ACME glyphs for the 1978 subset. The serial block exists; the die does not.
- A dated decal library. Renewal boxes on later bases are currently blank.
- Suffix over-runs on the 1952 base.

**Other families.** 60 families have no renderer. They keep their subtypes rather than collapsing into a single "design":
- BC Parks: three separate artwork masters.
- Olympics: six vehicle classes.
- Veteran, Collector and Antique: passenger, motorcycle and floater layouts.
- Consular: CONSUL bases and the red DL/CC/HC/CS/SR series.
- Also Memorial Cross, Personalized, commercial, farm, trailers, motorcycles, dealer and industrial classes, carrier/tax, official, ceremonial and municipal plates.

Samples, prototypes, movie props, boosters, reproductions and accessories are **not** issued plates. They need an explicit status and should not calibrate historical dies.

ICBC's 9 June 2025 bulletin announced new six-character serial arrangements; examples are listed in the app. Keep artwork version, serial-pattern version and die version independent. A new serial pattern is not a new plate design.

## Why the lettering looks wrong, and the plan

- **Default text is a proxy.** Barlow Condensed / Arial Narrow is fitted with `textLength` and `lengthAdjust="spacingAndGlyphs"`, which stretches or squeezes glyphs to fit a box.
- **The procedural "construction types" are generic.** They use one advance width, one gap and one stroke weight. They are category illustrations, not recovered dies.
- **Only the serial changes.** The province name, dates, slogans and renewal inscriptions stay in the proxy typeface.

The fix is a **source-backed die library**, not a better substitute font. Each profile would hold reusable glyph outlines with their own advances, side bearings and baseline. There would be separate profiles for serials, province legends, dates, slogans, class prefixes and tab numbers. The serial stays an editable string; the renderer places glyphs from the profile. Where a run does not fit, use a documented narrow die or flag the plate as an approximation, instead of silently stretching it.

Proposed profiles (none drawn yet): early rounded 1940–54, Oakalla block-era, ACME 1978, ACME 1979-base, Hi-Signs "Nova Scotia" dies, four Astrographic forms (male/female, neoprene-top, non-passenger, classic), Waldale, and small-format (motorcycle and similar). BCpl8s has digit-by-digit die comparisons (0–9) for ACME, Hi-Signs and Astrographic, which are the best starting specimens.

Glyph workflow:
1. Pick several straight-on, unrepainted originals per die. Record serial, year, maker and URL.
2. Keep pixel measurements separate from millimetres.
3. Redraw outlines with editable curves, starting with the digits.
4. Compare glyph by glyph, then as whole runs.
5. Check against a held-out specimen before marking a profile reviewed.

Source photographs remain on BCpl8s. They are references and are not copied into this repository.
