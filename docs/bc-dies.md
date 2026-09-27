# B.C. die library

British Columbia presets default to **Source die** lettering. The serial, province legend, slogan, date and tab numbers are drawn from die profiles for the plate's period and maker, instead of a stand-in font squeezed to fit.

## How a die works

A die profile is a set of monoline glyph skeletons (`src/templates/dies/skeleton.ts`) plus the parameters that distinguish one die from another:

- advance width and stroke weight
- bowl construction: stadium, oval or rounded box
- diagnostic shapes: open or closed 4, a flag or foot on the 1, flat-topped or round 3, straight or curved 7, and the tails of 6 and 9
- the separator: dash, square dot, or the long leading bar used 1933–39

`src/templates/dies/engine.ts` places glyphs at their own advances and scales a run **uniformly**. If a run cannot fit, the whole run is reduced and marked `data-fit="reduced"`; glyphs are never stretched individually. Legends that were stamped across the full plate width are spread with letter spacing, not by widening letters.

The serial remains an editable string. The drawing is vector paths, and the text is kept in `<title>`, `aria-label` and the SVG metadata.

## Evidence levels

Each profile records how it was derived (`evidence.status`):

| Status | Meaning | Profiles |
|---|---|---|
| `specimen-matched` | Width, stroke and digit shapes read from BCpl8s straight-on 0–9 digit comparisons (measured ratios ±0.02). | ACME 1978 and 1979, Hi-Signs 1982, the four Astrographic forms (male/female, neoprene-top, non-passenger, Classic), Waldale |
| `legend-approximation` | Read from gallery plate photographs; BCpl8s has no digit comparison for these years. | 1913–14 porcelain, 1915–17 tin, 1918–23 block, 1924–39 Tacey and straight dies, 1940–54 early dies, Oakalla 1955–77, and all legend dies |

Letters on every profile use the same construction as its digits. They were checked against plate photos only, so they are less certain than the digits.

## Which die a plate uses

`src/templates/bc/dies.ts` maps the original 1940–1985 presets to their dies by year and base:

| Plates | Serial die | Separator |
|---|---|---|
| 1940–54 | early rounded | dash |
| 1955–69 | Oakalla block | square dot |
| 1970–77 | Oakalla (open 4 from 1973) | square dot |
| 1978 ACME subset | ACME 1978 | dash |
| 1979 AAA and AAL blocks | ACME 1979 | dash |
| 1982 ALL block and 1985 fourth block | Hi-Signs | dash |

Plates built with the plate kit name their dies in their recipes. Flag-base plates let you choose the die, because several dies were used within one serial generation.

## Other lettering modes

The lettering control still offers editable font text and the four procedural construction categories (see [lettering.md](lettering.md)). Choosing **Source die** records `lettering.mode: "source-die"` and the profile ids in the SVG metadata.

## Limits

- These are reconstructions for illustration, not recovered tooling.
- Paint spread, wear and die damage are not modelled.
- Several documented variants are available as options:
  - the 1961 late date stamp
  - the 1964 long legend die
  - the Oakalla separator on the 1972 over-run and 1973 blocks
- The 1940 and 1949 samples' pear-shaped zeros are not drawn.
- The flag base's slogan is a typeface stand-in (serif, mixed case). Dies here cover capitals, digits and separators only.
