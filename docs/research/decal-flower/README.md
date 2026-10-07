# 1976 and 1977 renewal decal flower

The user supplied Flower_Vector_Package.zip on 2026-10-06 and requested its flower replace the existing emblem on these two decals. The exact compound path is retained in flower-compound.svg and embedded in src/templates/bc/decal-flower.ts for portable scene/SVG/PNG exports. Its five petals, transparent center and gaps are preserved. Each decal supplies its existing ink color; the original square canvas scales uniformly to 30% of decal height at the existing emblem center. No surrounding opaque shape is added.

The supplied package describes a cleaned vector reconstruction, not a recovered original master. BCpl8s photographic comparisons remain in public/data/decal-review/sources/1976.webp and 1977.webp; the original links remain in the specimen ledger. Existing before previews remain historical. The 1971 sun stays separate.

Run `node scripts/build-decal-review.mjs` to refresh the comparisons. Verify with `npm test -- --maxWorkers=2` and `BASE_PATH=/plateforge/ npm run build`. Source selection and hash are recorded in provenance.json.
