# Individual passenger decal review — 2026-10-06

All 55 imported B.C. passenger renewal specimens were reopened and visually compared, including the newly added 2001 specimen. The catalogue covers 1970–2023, with 1973 and 1979 absent and three additional same-year variants. It is not a complete catalogue of municipal, commercial, motorcycle, carrier or day-sticker systems.

`review.json` records each original URL, fresh SHA-256 hash, image dimensions, crop coordinates, readable month/control transcription, individual finding and comparison layout. The 1983 control is unreadable and is explicitly illustrated, rather than asserted to match the original. Small controls and worn paint remain uncertain. Decal dates describe renewals, not manufacture or die dates.

## Changes

The previous four generic layouts now have 21 named photographic layout groups. Annual designs have separate text, class labels and control panels; the 1980s have distinct split panels, vertical strips, province-bottom and supplied Expo-logo arrangements. The 1999 white and 2000–03 decals have double outlines. 2004 and 2005–08 use different arrangements and proportions. 2008's control is light ink, and the 1998 type-II control uses a separate lighter printing candidate.

2009–13 have two-digit years with barcode/control footers. 2014–23 have four-digit years, vertical serif province words and separate barcode/control footers. Later examples have smaller date printing and rounder corners. A decal now fits uniformly within both dimensions of its plate well.

The gallery shows every original beside the current rendering using photographed text. Ordinary Apply preserves the current plate settings. **Use photographed text on plate** also adopts the specimen month and readable control; the plate's serial, die and finish survive. An optional control field allows other eight-digit modern controls. Invalid or unfinished input is validated but cannot crash the preview.

## Printing evidence and limits

Printed lettering is separate from stamped plate dies. The outlined printing candidates use the user's Helvetica Compressed archive and open URW Nimbus Sans/Narrow/Roman curves. Nine printing profiles separate month/year proportions, province and control weights. `printing-provenance.json` records input hashes and explicit horizontal construction factors. Some profiles deliberately condense supplied curves; they are reconstruction candidates, not untouched-font matches or recovered printing masters. No individual source sample receives per-glyph stretching, and no font binary is bundled. Open URW source fonts are distributed under AGPL with the font exception; their identifying names and hashes are retained. Historical production font attribution remains unconfirmed.

Source barcode scanning independently decoded Code 128 controls on four originals: 2014 `99103688`, 2018 `50278580`, 2021 `36946964`, 2022 `72919128`. The renderer generates Code 128 C with the printed control and checksum. Other barcode-year originals did not decode at their available resolution; their encoding uses this related reconstructed system. The generated barcode is not evidence of exact original bar widths on those undecoded scans.

Scan colours, early emblems, security scoring, substrate texture and some font contours remain approximate. The comparison retains these visible differences. Cropped source thumbnails are credited to BCpl8s and remain the property of their creators.

## Reproduction and checking

- `python scripts/build-decal-printing.py <supplied-Helvetica-archive>` rebuilds outlined candidates.
- `node scripts/build-decal-review.mjs` verifies original hashes and rebuilds all 55 photograph/previous/current comparisons at `public/bc-decal-review/`.
- `renderer-before.ts` preserves the old generic renderer. For newly added 2001, “previous” illustrates that renderer using the new specimen; there was no 2001 catalogue entry before this change.
- `npm test -- --maxWorkers=1` and `BASE_PATH=/plateforge/ npm run build` validate the app.
- `python scripts/verify-decal-gallery.py` checks application, state preservation, mobile and export behavior.
- `python scripts/verify-decal-review.py` checks all comparisons and modern control/barcode exports. `DECAL_SITE` can target a published deployment.

Future reviews should inspect full original photos as well as crops, separate layout identity from exact font attribution, preserve same-year print variants, and verify that a full-year date and barcode footer survive actual plate exports. Never substitute a stamped legend alphabet simply because the decal text is uppercase.
