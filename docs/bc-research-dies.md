# B.C. research dies in the renderer

The source-led lettering research (2,046 glyph units traced from plate
photographs) is drawn by default on B.C. plates, compiled into
`src/templates/dies/research-registry.json`. These
are **unvalidated research candidates**, not certified historical alphabets.

## How a plate picks its glyphs

`src/templates/dies/research-registry.json` binds each B.C. format, and each
production die (or proxy typeface) it uses, to research units ranked best first:
explicit format match, year inside the format's period, same kind of lettering
(serial / legend / date / decal), review-ready, the plate's own class (passenger,
commercial…) and the die's own maker (ACME, Hi-Signs…).

While a plate renders (`withResearchContext` in `src/templates/bc.tsx`):

- `dieProfile(id)` returns that die with research outlines layered over it. Each
  character comes from the first unit that observed it; **anything unobserved
  keeps its production glyph**, so every serial still renders.
- A run of text prefers one unit that observed the whole run, so a word is not
  stitched together from different sources when it need not be.
- Proxy-typeface text (Georgia, Barlow) is replaced only when one unit observed
  every character; otherwise the typeface stays.
- Research outlines carry their own source slant; on slanted dies only the
  production fallbacks are skewed.

The 1951 renewal strip is an independent manufactured piece and always uses
`bc-strip-1951`, regardless of the base serial's font setting. Its profile sets
`allowResearchReplacement: false`: the dedicated two-photo reconstruction is
normalized to a 100-unit cap, while registry candidates include raised-year
placement inside their paths. Replacing the strip master would change its
alphabet and apply the year lift twice. This exception preserves the dedicated
source reconstruction; it does not certify exact tooling. Photograph comparisons
are published at `public/bc-font-comparisons/renewal1951/index.html`.

Collector serials and the corresponding flag-base passenger recipes use shared
Astrographic Classic (`1985-flag`) and Waldale (`2001-flag`) masters. These
canonical bindings contain only their named family's source units; unobserved
characters use that production profile's constructed fallback. A shared serial
freezes the merged alphabet before measuring and splitting the run, preventing
different digit groups from switching to another unit. Other selectable
Astrographic variants retain their separate profiles. Collector inscriptions
use fixed Harrington Regular outlines, independently of these serial masters.

Research glyphs are tagged `data-source="research"` in the SVG. The **Research
lettering** checkbox in the B.C. inspector switches back to the production dies
(remembered per browser).

## Regenerating the registry

The finished research is archived outside the repo, in `~/Desktop/research`,
with the repo's paths preserved:

- `START-HERE.html`: the review interface (vectors, source links, comparison images).
- `docs/research/bc-lettering/continuation-*`, `refinement-*`: every study's masters,
  observations, glyph and engine renders, proofs and checksums.
- `docs/research/bc-lettering/review-package/`: the catalog, format inventory and scope audit.
- `scripts/trace-bc-dies/continuation-*`, `refinement-*`, `review-package/`: the study
  pipelines and review build tools.
- `src/templates/dies/research.ts`, `research.test.ts`, `research-artifacts.test.ts`: the strict
  opt-in research-profile bridge and the contract test over those files (it needs `research.ts`).

Those paths are git-ignored here so a copied-back study is not committed by accident.

```sh
python3 scripts/trace-bc-dies/build_research_registry.py            # reads ~/Desktop/research/…/review-package
python3 scripts/trace-bc-dies/build_research_registry.py <dir>      # or any folder with catalog.json + format-role-inventory.json
```
