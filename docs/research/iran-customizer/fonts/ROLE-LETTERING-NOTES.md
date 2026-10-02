# Iran lettering roles: source-guided pass

Frozen 2 October 2026. This pass changes only role studies, original licensed font inputs, and review evidence. It does not claim an official manufacturing font. No proprietary Arial, B Roya, or IR Plate binary is added, and no PUA alphabet is fabricated.

## Ready-to-integrate contracts

`role-studies.json` contains thirteen source profiles. Every path is authored manually using smooth curves and a bounded number of anchors in its linked `sourceFile` pixel plane. Photographic source files are the already rectified/cropped review images, not the full original photographs. Whole words are single atomic paths, including every connected part and diacritic. Use **evenodd** fill for the counters. The generator must preserve attribution, source URL, license, and adaptation notices.

| Profile | API item | Intended use |
| --- | --- | --- |
| `source-national-lettering` | word `iran`; series glyph `ع` | Actual national plate photograph; rounded monoline country heading and public-transport series |
| `source-national-diagram-lettering` | word `iran` | Current national/temporary right header in diagram-derived layouts; geometric square-stem version |
| `source-diplomatic-lettering` | word `political` | Current diplomatic right header `سیاسی` |
| `source-service-lettering` | word `service` | Current service right header `سرویس` |
| `source-national-heh-lettering` | series glyph `هـ` | Connected national plate heh, with two counters and left connector |
| `source-previous-diplomatic-lettering` | word `political` | Bottom `سیاسی` in the older compact diplomatic layout |
| `source-previous-service-lettering` | word `service` | Bottom `سرویس` in the older compact service layout |
| `source-previous-temporary-lettering` | word `temporary` | Whole `گذر موقت` heading in the older compact temporary layout |
| `source-protocol-lettering` | word `protocol` | Large `تشریفات` heading in the red protocol layout |
| `source-historic-lettering` | word `historic` | Large `تاریخی` heading in the brown historic-vehicle layout |

The current squared political/service words must never be projected backward onto earlier compact plates. The two Iran masters likewise retain the visible difference between a drawing and a manufactured specimen.

Use `renderIranWordmark(profileId, wordId, x, baseline, inkHeight)` for whole words. For the two class glyphs, use `renderIranRoleGlyphRun(profileId, 'series', text, x, baseline, nominalHeight)`. Keep main Persian numerals, the class glyph, the right-header word, the right-box code, and Latin legends as independent roles. A source-wordmark profile supplies no implied numeral alphabet: code `10` must still use the expressly selected full candidate numeral profile, rather than trying a missing source zero and silently borrowing it.

## Latin roles and visual selection

`role-latin-comparison.png` and its vector original compare the actual source crops with unmodified complete licensed fonts. The entries use original font outlines and natural advances; no character is stretched independently.

- `latin-freezone-candidate`: **Noto Sans Regular 2.004**, SIL OFL 1.1. Preferred plain free-zone Arabic numerals. The key visual distinction is a **footless 1**, as in Anzali, Aras, and Maku source drawings. Its bowls, spacing, and terminals remain a candidate approximation, not a traced plate alphabet
- `latin-sans-candidate`: **Liberation Sans Regular 2.1.5**, SIL OFL 1.1. Use for normal-width Latin zone labels and the small I.R. / IRAN strip. Its ordinary digit 1 has a base foot, so it is a less faithful free-zone numeral choice despite otherwise close Arial-compatible proportions
- `latin-sans-bold-candidate`: **Liberation Sans Bold 2.1.5**, SIL OFL 1.1. Use for TAXI and the visibly heavier MAKU label; compare the actual source weight before using it for every zone label
- `latin-candidate`: existing **GL-Nummernschild Eng**. Keep it available for separately researched international/travel-style serials. Its condensed weight, closed bowl construction, serifed I, and footed 1 are visibly unsuitable as the default free-zone digit or I.R. IRAN strip font

PROTOCOL in the source is narrow in its own legend box; choose a normal sans candidate and size uniformly within that box. Do not force the whole plate into the condensed FE font to achieve that one label.

Original source binaries and the complete notices are under `source/`. `role-source-audit.json` records their SHA-256 hashes. Font notice files intentionally retain the distributor's full upstream copyright/license record; Debian packaging terms do not relicense the font itself. No font was modified, renamed, subsetted, or installed system-wide.

## Proportions and role boxes

`role-metrics.json` records actual pixel measurements and percentages. These are observed ink boxes, not an official drawing specification. Each class may occupy a different part of the common number band.

Important examples, with plate height normalized to 100:

- Real public plate: `ع` starts around 11.4 and is 78.6 high; surrounding digits span roughly 80 high
- Real connected heh: its ink is about 63.6 high, below the digit top and above the digit bottom. Two counter shapes and a broad left connector are essential; replacing it with isolated `ه` is incorrect
- Private diagram `ب`: top 15.2, height 64.3, including the dot below the bowl
- Taxi diagram `ت`: top 44.2, height 38.9. TAXI has its own upper box. Fitting the class glyph to the full main-numeral height creates an obvious overlap
- Public diagram `ع`: top 13.3, height 69.9. Its source is shorter than the photographed glyph, so the diagram and photograph should not be conflated

Fix the class role's ink box rather than globally stretching a candidate font. Uniformly scale and position each complete role. A class may be an isolated glyph or a whole atomic word, but internal word tracking must stay fixed. Main number runs keep their shared numeral cap/baseline and original glyph advances.

## Human visual acceptance criteria

1. At normal plate size, the Iran header must read as a low monoline geometric sign, with upright alefs, low joined baseline, and two yeh dots. A slanted Naskh-shaped word is a visible regression
2. Current political/service headers must retain their short squared teeth and stepped baseline. Older words must retain their calligraphic terminals and long curved final forms
3. Source-mode `ع` keeps its open upper bowl and deep lower crescent. Source-mode `هـ` has two distinct counters and the left connector; its outline must remain clean at export scale
4. TAXI and its Persian glyph share a column without overlap. The right-box header remains above the code, rather than borrowing the number run's baseline
5. Free-zone numerals have normal sans width and thin-to-medium strokes. Anzali/Aras/Maku `1` must be footless in the preferred complete candidate. Qeshm's lower row is visibly shorter and wider-spaced in the source and needs its own layout box; it is not evidence to stretch the font's glyphs
6. The I.R. / IRAN strip has ordinary sans letters and a separate size/line gap. Serifed I or the heavy condensed FE style fails this role even if the main serial looks plausible
7. Inspect source/master/overlay at large scale and the entire plate at natural size. A good isolated master does not certify its integrated placement, weight, or spacing

## Rights and limits

The photographic sources are [Dickelbers, Iran licenceplate 02](https://commons.wikimedia.org/wiki/File:Iran_licenceplate_02.JPG) and [MohsenKalali, Iranianplate](https://commons.wikimedia.org/wiki/File:Iranianplate.jpg), each CC BY-SA 4.0. The police/previous/special-class diagram masters retain their individual CC BY-SA 3.0 credits; current diplomatic/service diagram masters use their CC0 dedication. License pages were checked on 2 October 2026. See each JSON profile for the exact source and credit. These paths are expressly distributed as adaptations under the respective source license, separately from the OFL candidate font inputs.

The private-vehicle SVG was inspected but not imported as a font source. Its current Commons page labels an own-work 2023 drawing as PD-Iran without explaining an applicable expiration basis, and names a proprietary B Roya source. That is not used here as evidence of font redistribution permission. The candidate comparison board retains small source crops for visual criticism; it is not a blanket license claim about all source drawings.

Rebuild studies and comparison SVGs with `python docs/research/iran-customizer/fonts/build-role-studies.py`. Render the SVGs with Inkscape. This script only writes files in this research directory. The runtime font generator is owned and tested separately.

## Final five-class refinement

Added only the explicitly reviewed class forms: taxi `ت`, agricultural `ک`, government whole-word `الف`, diplomatic thin-serif `D`, and the lighter source `S`. The original nine wordmaster objects remain byte-for-byte equivalent after JSON parsing. `role-final-class-overlay.png` isolates these five comparisons.

New profiles are `source-taxi-lettering` and `source-agricultural-lettering`, with glyphs in the `series` role, and `source-government-lettering`, with atomic wordmark `alef`. Existing current diplomatic/service profiles now also expose `D` / `S` in their `series` roles; their political/service whole-word paths are unchanged.

Recommended observed ink boxes, normalized to plate height 100:

| Role | Top | Ink height | Main numeral top | Main numeral height |
| --- | ---: | ---: | ---: | ---: |
| Taxi ت | 44.25 | 38.94 | 12.39 | 70.80 |
| Agricultural ک | 13.27 | 67.26 | 12.39 | 70.80 |
| Government الف | 16.81 | 63.72 | 12.39 | 70.80 |
| Diplomatic D | 20.81 | 56.56 | 16.29 | 63.35 |
| Service S | 20.36 | 55.20 | 16.29 | 63.35 |

These are independent ink-height targets. If using shared-cap role rendering instead of ink-box fitting, the first two class profiles preserve source cap 80 and baseline 94; D/S preserve source cap 140 and baseline 176. Do not use the class's shorter cap as the cap for the surrounding serial. D retains its top/bottom horizontal serifs and open counter; S uses the source's normal stroke weight, not a bold-sans replacement.

The three Isochrone 2023 diagram-derived studies retain the declared Commons PD-Iran label **with an unverified expiration-basis caveat**. They do not assert that a proprietary source font was licensed or that source-image redistribution rights were independently established. The D/S studies retain the already verified CC0 sources.
