# Alberta wordmarks and red wild rose

The supplied artwork now appears in both photographed Wild Rose Country styles: the older geometric wordmark and the later script wordmark. The site retains an editable serial independently of the printed artwork.

[Open the comparison](https://projects.ahmadjalil.com/plateforge/alberta-artwork-review/) or the [current script plate](https://projects.ahmadjalil.com/plateforge/#/ca-ab/standard), [six-character geometric plate](https://projects.ahmadjalil.com/plateforge/#/ca-ab/wild-rose-1984), or [seven-character geometric plate](https://projects.ahmadjalil.com/plateforge/#/ca-ab/wild-rose-geometric-2010).

`page-1-selection-1.svg` supplies the two geometric wordmark paths. Its white page background and unrelated text are excluded. `Alberta-government-logo2.svg` supplies the script Alberta compound path; the Government subline and teal rectangle are excluded. The supplied `red-wild-rose.svg` supplies the rose/stem/leaves compound path. Native curves are preserved, uniformly fitted and recoloured to the photographed blue/red plate inks. No system font or external raster is needed for these graphics in SVG/PNG exports.

Both EPS uploads are byte-identical and depict the geometric wordmark above GOVERNMENT OF ALBERTA. They were rendered and compared; the supplied wordmark-only SVG provides the corresponding geometry used on the plate. [Provenance](provenance.json) records all five upload hashes, selected components and limits.

The user's PWG-542 photograph guides the larger six-character layout and rounded square separator; CKZ-3449 guides the script variant. Further cross-checks use [World License Plates · Alberta](http://www.worldlicenseplates.com/world/CN_ALBE.html): GRS-152 is captioned “1984 Series”, BCJ-8178 “2010 Series”, and CHS-6596 “2019”. The prior generic description of a 1983 base was corrected to this source's 1984-series label. Source captions are not proof of every manufacturer's revision date or of the last use of an old plate. The six-character date span describes numbering, while 2010 marks the photographed seven-character geometric series; the exact end of that wordmark is unconfirmed. A 2019–2026 display span on the script preset describes this model's photographed revision/current coverage, not a certified tooling lifetime.

The fixed slogan now uses supplied Avant Garde Std Medium outlines with four explicitly reconstructed alternates; see [the font investigation](../alberta-slogan/README.md). The main serial remains independent approximate lettering. Neither the artwork nor the slogan reconstruction authenticates the historical production font or all character contours. Renewal wells are blank; the photographed 1995 decal and June expiry are not imposed on all old plates. Supplied artwork and credited photographic thumbnails retain their creators' rights.

Implementation: `src/templates/art/alberta-vectors.json`, `alberta.tsx`, the Alberta entries in `src/regions/canada/provinces.ts`, and optional artwork slots in `src/templates/ca.tsx`.

Rebuild the extracted vector data with `python scripts/import-alberta-artwork.py --geometric <page-selection-zip-or-svg> --script <government-logo-svg> --rose <rose-package-zip-or-svg>`. Only the named SVGs are read; uploaded Python files are not executed. `node scripts/build-alberta-review.mjs` rebuilds the source/current page and credited gallery crops. Recheck layout when source structure or bounding boxes change.

Validation covers wordmark/rose path presence, removal of the Government subline, six/seven-character patterns, separator placement, SVG/PNG export and mobile views. Browser results are recorded in `browser-verification.json`.
