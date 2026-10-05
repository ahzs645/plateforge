# Province decal gallery

The B.C. editor and plate gallery now offer a **Decals** mode, at `#/decals/ca-bc/<current-format>`. It preserves the current plate's serial and settings while browsing the existing imported passenger renewal catalogue. Returning to Single or using **Back to current plate** preserves that state. A fresh direct link regenerates the serial, as other editor links already do; it restores the province and base, not unsaved settings.

`src/library/province-decals.ts` declares catalogue availability independently of plate formats. Only B.C. currently has an imported catalogue. Other provinces do not acquire invented decal choices or a misleading empty tab. The gallery displays the records already in `bc-decals.ts`, sorted by year with same-year variants adjacent. The 1973 and 1979 gaps remain absent, and the 1996 pink, 1998 type-II and 1999 white variants retain their individual IDs.

Cards use `decalArt` and `buildDecal`, the same approximate artwork used on the editable plates. They are labelled reconstructions with illustrative control numbers, not source photographs or exact lettering traces. Each card links separately to its original BCpl8s photograph. No additional photographs are downloaded or embedded by the gallery.

The **Choices for this plate** filter and **Apply to current plate** action use the format's existing `decal` options. Applying a choice changes only `parts.decal`; the month, serial, dies, lettering and finish survive. Clearing restores the empty well. The current plate remains visible beside the gallery on desktop and above it on phones. Passenger Carrier renewal stickers are a separate system and are not substituted with ICBC passenger decals; their gallery cards remain reference-only.

This is a gallery of the imported passenger renewal records, not an inventory of all historical provincial, commercial, municipal or carrier decal systems. Existing approximate renderer/font limitations remain visible. A renewal label is not a manufacture date or proof that a physical plate carried that decal.

Verify: `npm test -- src/ui/DecalGallery.test.tsx`; production build with `BASE_PATH=/plateforge/ npm run build`; then `python scripts/verify-decal-gallery.py`. The browser check covers navigation/return, same-year variant application, serial/month/style preservation, unsupported Carrier/province behavior, mobile layout and SVG/PNG output. `DECAL_SITE` and `DECAL_REPORT` can target the published site and a separate report path.
