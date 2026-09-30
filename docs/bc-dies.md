# B.C. die library

British Columbia presets default to **Source die** lettering. The serial, province legend, slogan, date and tab numbers are drawn from die profiles for the plate's period and maker, instead of a stand-in font squeezed to fit.

## How a die works

A die profile is a set of monoline glyph skeletons (`src/templates/dies/skeleton.ts`) plus the parameters that distinguish one die from another:

- advance width and stroke weight
- bowl construction: stadium, oval or rounded box
- diagnostic shapes: open or closed 4, a flag or foot on the 1 (long or short flag), a flat or pointed A, a spur on the J, flat-topped or round 3, straight, curved or bent 7, bowl styles for single glyphs such as the 0 and P, and the tails of 6 and 9
- the separator: dash, square or round dot, or the long leading bar used 1933–39

`src/templates/dies/engine.ts` places glyphs at their own advances and scales a run **uniformly**. If a run cannot fit, the whole run is reduced and marked `data-fit="reduced"`; glyphs are never stretched individually. Legends that were stamped across the full plate width are spread with letter spacing, not by widening letters.

The serial remains an editable string. The drawing is vector paths, and the text is kept in `<title>`, `aria-label` and the SVG metadata.

## Evidence levels

Each profile records how it was derived (`evidence.status`):

| Status | Meaning | Profiles |
|---|---|---|
| `specimen-matched` | Width, stroke and digit shapes read from BCpl8s straight-on 0–9 digit comparisons (measured ratios ±0.02). | ACME 1978 and 1979, Hi-Signs 1982, the four Astrographic forms (male/female, neoprene-top, non-passenger, Classic), Waldale |
| `legend-approximation` | Read from gallery plate photographs; BCpl8s has no digit comparison for these years. | 1913–14 porcelain, 1915–17 tin, 1918–23 block, 1924–39 Tacey and straight dies, 1940–54 early dies, Oakalla 1955–77, and all legend dies |

Letters on every profile use the same construction as its digits. They were checked against plate photos only, so they are less certain than the digits.

## Waldale glyph fixes (September 2026)

The study in [studies/bc-font-comparison-2026](studies/bc-font-comparison-2026/README.md) compared the Waldale die with BCpl8s photographs of 098 SJF, 976 SKP and JA7 91L. Open `output/bc-font-comparison.html` in that folder for the side-by-side comparison. The study's scripts use a transcription of the die as it was before these changes. They record the evidence and are not tests of the current code.

The Waldale die now changes these glyphs:

- **0**: straight sides (`glyphCurve: { '0': 'stadium' }`). The other bowls stay oval. Switching the whole profile to stadium bowls would also have changed 6, 8, 9 and P, and that was not an improvement.
- **7**: `bent`. The bar turns down early, and the stem ends almost vertical. The older `curved` 7 leaves the bar too steeply.
- **P**: a rounded-rectangle bowl (`glyphCurve: { P: 'box' }`, `boxRadius: 16`), with a straight top, right side and bottom.
- **J**: a short spur to the left at the top of the stem (`j: 'spur'`).
- **A**: the legs meet in a short flat top, and the bar is lower, at 70 (`a: 'flat'`).
- **1**: a short, shallow flag (`one: 'short-flag'`) instead of the long diagonal one.

Every other glyph, advance and stroke weight is unchanged (`src/templates/dies/waldale.test.ts`). The 7's bend and the letter details are set by eye from the photos, not fitted.

The study also compared published Driver Gothic and License Plate specimens. Their upright, hooked 6 and 9 do not match the sweeping B.C. forms, so neither font replaces the die.

The narrower Waldale **"Mississippi"** die on Memorial Cross plates was checked against MC000R, MC1000 and MC127R. It has straight-sided bowls throughout (O, 0, C and R), so the whole profile is `stadium`. Its 1 has a flag and a base, and its 7 is close to a straight diagonal.

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

## 1940–54 bases and renewal pieces, measured from photos (September 2026)

The 1940–51 stacked-year bases, the 1951 strip, the 1952 base and the 1953/54 tabs were overlaid on BCpl8s photographs (1940 99·830, 1949 71·064 and 121·464, 1950 230·229, 1951 217·639 and the loose long/short strips, 1952 42-289, 1953 148879 and loose tab, 1954 306142 and loose tab). Positions were then measured from the photos rather than estimated. The photographs are references only and are not bundled.

- **Separator**: 1940–51 bases carry an 11 mm raised **round dot**, not a dash (`dot: 'round'` on `bc-early-1940`). The 1952 base has a short, thick 14 × 12 mm dash.
- **Serial** (`bc-early-1940`): cap about 71 mm, W/H about 0.55, stroke about 0.145, gaps about 7.5 mm. On 1940–51 bases it spans about 13 mm to w − 29 mm on a 90 mm baseline; on the 1952 base it spans 15–258 mm on a 92.5 mm baseline.
- **Stacked year** (`bc-year-1940`): 32 mm digits 15 mm from the right edge, level with the top and baseline of the serial.
- **Legend** (`bc-legend-1940`): 20.5–21 mm bold caps with ordinary 3–6 mm gaps. Only the word gap widens on long bases.
- **Slots and rim**: 1940–51 slot centres are ±80 mm from the middle and 12.5 mm in from the edges, on both widths. The rim is a heavy raised band at the edge.
- **1951 strip** (`bc-strip-1951`): the strip top sits at about 94.5 mm and the bolts go through the lower slots. The legend has 21 mm caps about 9.5 mm in from each end, with a slightly smaller 51 set about 4 mm higher. The face is white, the ink a mid blue, and the stamped number uses small serif digits.
- **1953/54 tabs** (`bc-tab-1953`): 32.5 mm year digits paired across 14–70 mm. The holes, digits and leaf centre about 41.5 mm across, because only the right side has a rim. The corners are rounder, and the colours were sampled from the photographs.

