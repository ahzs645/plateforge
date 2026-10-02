# City-specimen lettering: bounded private critical studies

Eleven source-specific profiles are in `city-studies.json`. Their source JPEGs are in `city-reference/`. Each profile has a source identifier, URL, credit, image SHA-256, source-relative boxes, shared numeral metrics, and explicit limits. These photographs have no verified redistribution licence: this folder is a private critical study, not a redistributable font-source package.

## Method and limits

Every outline was drawn manually after viewing enlarged source pixels. The paths use a small set of deliberate line, quadratic and cubic segments; there is no threshold vectorization, pixel-stair contour, photograph warping or image-backed plate output. Wear and glare are omitted. Repeated numerals use one inspected occurrence per source, rather than pretending every worn instance is a new character. Source photographic perspective has not been presented as authoritative engineering geometry.

Main glyphs retain one source-plane scale and baseline per specimen. Small numeric/letter extensions have independent `extension` role metrics when their lettering differs. Complete joined Tehran, Rasht and consular words are atomic paths, with their own dots and relative joins. They are not a reconstructed alphabet, private-use Unicode substitutions, or modern font labels relabelled as historical dies. Missing characters require a strict error or visibly labelled licensed fallback.

The overlay boards show original source, aligned red contours, and clean contours. Only one traced instance of each repeated glyph appears on the clean source-plane layer; this is a subset review board, not a static whole-plate reproduction. `city-studies-geometry.json` supplies the full observed serial ink extent and actual plate crop separately. Use these ink-role boxes proportionally; preserve each wordmark's aspect with a single uniform scale.

## Source-dependent details retained

- 1964: compact deep-tailed Tehran; narrow tall numeral ۱; observed small extension ۱۳ remains explicitly uncertain because earlier recovered notes transcribed ۱۲
- 1969 Rasht: the city has a long low left sweep and detached reh; reducing this to a compact generic city word loses the defining source feature
- 1969 Tehran and recovered ۹۴۶۹۹: curved old-form ۴ and squared-top ۶; the source styles remain separate
- Circa 1970 commercial: narrow angular ۸ and squared-top ۶; source-sized ۱۲ extension
- Older government ۳۴۰۲۷: source-height diamond zero remains small and raised, not fitted to numeral cap height
- 1993 private: main ۱۴ل۷۷۴ and independently drawn header ۱۴; source Tehran is separate from the other city-band specimens
- WLP 1993 commercial: ۱۵ط۱۶۱; damaged photograph, with provisional repairs limited to the legible skeleton; not mixed with the DNA commercial example
- WLP 1993 government: ۱۶ب۲۴۵; two-lobed ۵ kept despite paint loss; source-specific ب
- DNA city-band truck: ۱۹ط۴۹۷; distinct thick wordmark and larger numeral forms
- 1960s consular: thin slanted complete کنسولی and a single observed numeral ۱; no wider consular numeral coverage claimed

## Integration mapping

| Preset | Profile | Main coverage | Wordmark | Extra role coverage |
|---|---|---|---|---|
| full-city-1964 | historic-1964-city-study | ۱۲۳ | tehran | extension: ۱۳ |
| full-city-gilan | historic-1969-rasht-study | ۱۲۳۷ | rasht | none |
| full-city-numeric | historic-1969-tehran-study | ۱۲۴۶۹ | tehran | extension: ۱۹- |
| full-city-letter | historic-fullcity-letter-study | ۴۶۹ | tehran | extension: ج- |
| full-city-commercial | historic-1970-commercial-study | ۱۶۸ | tehran | extension: ۱۲- |
| old-government | historic-old-government-study | ۰۲۳۴۷ | none observed | none |
| city-band-header-code | historic-1993-private-study | ۱۴۷ل | tehran | extension: ۱۴- |
| city-band-commercial-wlp | historic-1993-commercial-study | ۱۵۶ط | tehran | none |
| city-band-government | historic-1993-government-study | ۱۲۴۵۶ب | tehran | none |
| city-band-commercial | historic-cityband-truck-study | ۱۴۷۹ط | tehran | none |
| consular-1960s | historic-1960s-consular-study | ۱ | consular | none |

The proposed WLP commercial preset is explicitly separate and must use prefix 15, letter ط, serial 161. The existing DNA commercial default remains prefix 19, letter ط, serial 497.

## Known uncertainty

Collector years and vehicle classes are metadata, not authenticated issue/die dates. The pink 1969 Tehran photograph has conflicting passenger/diplomatic catalogue classification. The full-city letter-extension boundary is uncertain. City-band introductions are variously labelled 1993 and 1998. The government serial-only specimen has no observed city label and no reliable photograph date. Tiny and worn source areas constrain drawing precision. No profile is a certified official die.
