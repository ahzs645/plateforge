# B.C. corrections after photographic review

These changes respond to the flagged report specimens. They improve separate
printed, embossed and artwork components; they do not certify recovered tooling.
Original supplied vector/glyph JSON files remain untouched. New native font
subsets are reproducible with `scripts/build-bc-correction-fonts.py`; their source
hashes and licences are in `font-provenance.json`. No font binaries are added.

- **APEC motorcade 121:** independent narrow 1/2 constructions and larger spaces;
  heavier geometric heading. Supplied globe and corner marks are retained. Their
  map, caption and small emblem contours remain unresolved.
- **APEC military:** enlarged Canada-149(XL) supports the separate bold 1/4/9
  constructions. Native Nimbus Sans Narrow Bold is only a candidate for other
  digits and CANADA. Sticker proportions are wider, with a separate light
  geometric caption. The original small 180/134 photographs are still available.
  National registration and the ordinary federal shell/alphabet are preserved.
- **Carrier:** full-face print now compresses the upper flag to 60% of its
  original height, places the wave field and sun separately, and reduces the
  crown uniformly. The exact supplied path strings remain unchanged. New compact
  serif province and bold sans class outlines replace live font substitution.
  Serial spacing and baseline are source-guided separately. The blank renewal
  panel grows and moves up to match its photographed footprint. Source colours,
  halftone texture and exact serial curves remain approximate; this print
  composition is specific to the 2005-style carrier and checked against 2024.
- **Prince George bicycles:** narrow outer lettering and broader square centre
  numerals use independent constructed profiles. Side dates shrink and move
  inside the rim. A complete source-specific alphabet remains follow-up work.
- **Collector:** tighter Collector tracking, bold serif MULTI-VEHICLE and a
  shallow motorcycle wave. Supplied Harrington and shared passenger serial
  masters are preserved. The earlier straight-dash interpretation was incorrect.
- **1970:** rounded square native Russo One capitals and heavier concentric
  outline numerals. It is a visual candidate, not a historical font attribution.
- **1976:** the supplied flower occupies only about 78% of its canvas height.
  Its placement box grows from 30% to 40% of decal height, yielding about 31%
  painted height. Other years retain their independent settings.
- **2014–2023:** months retain the narrower construction from previous main, with
  a 2.5-cap-unit same-ink stroke to increase weight without sacrificing height.
  Years use native Anton outlines; controls use broader Nimbus Sans Bold. Province lettering stays
  independent. Native spacing is retained and complete runs fit uniformly.
  The July 2017 design transition remains month-dependent; its date group moves
  slightly right for province clearance. Unobserved font identity remains open.

Compare originals, main and revised captures in `public/bc-visual-review/`.
Photographic overlays use uniform fitting and retain perspective, wear and
lighting. Digital pixel differences measure branch changes, not accuracy.

## Month size follow-up

The wider Anton month candidate reduced NOV 2014 to about 48 cap units and MAR
2023 to about 37 in a 100-high decal. The retained narrow month construction fits
at about 56 and 46 respectively before painted overshoot. Only print weight is
added to those paths; original glyphs and advances remain untouched. The 2014
month retains its revised horizontal placement and available width. Month/year
profiles are independent; July 2017 keeps its later, smaller layout. The month
collision verifier includes the added ink padding and checks both examples stay
above their minimum source-supported heights. Exact historical font identity
remains unconfirmed.

The comparison viewer now bounds its decoded-image cache and releases temporary
and superseded canvases. A full 2700×4200 atlas requires about 45 MB decoded;
retaining all old surfaces could prevent the last offline atlas from decoding
after a complete navigation pass. The report check exercises that transition
and includes the failing asset name in any decode diagnostic.
