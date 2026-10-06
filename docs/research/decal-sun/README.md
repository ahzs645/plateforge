# 1971 renewal decal emblem

The user supplied svgviewer-output.svg.zip and Golden_Emblem_Vector_Rebuild_UPDATED.zip on 2026-10-06 to replace the simplified 1971 sun. The standalone SVG path matches the updated package’s emblem-flower-silhouette-cutout.svg path exactly. The standalone source is retained here and embedded in src/templates/bc/decal-sun.ts for portable exports.

The supplied outer contour and negative flower cutout retain the evenodd fill rule. The original 1360 × 1157 canvas scales uniformly to 40% of decal height, centered at the former sun location. Fill uses the decal’s existing gold ink. This is a supplied reconstruction, not a recovered historical printing master. Dimensions, lettering and color remain approximate.

The credited original is https://www.bcpl8s.ca/images/Decals/Passenger/1971.jpg; its crop remains in public/data/decal-review/sources/1971.webp. Run `node scripts/build-decal-review.mjs` to refresh comparisons, `npm test -- --maxWorkers=2` and `BASE_PATH=/plateforge/ npm run build` to verify. Source hashes and selection are in provenance.json.
