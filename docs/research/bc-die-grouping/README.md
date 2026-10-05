# B.C. cross-class die and production catalogue

The public review is [`public/bc-font-comparisons/die-grouping/index.html`](../../../public/bc-font-comparisons/die-grouping/index.html), served at `/plateforge/bc-font-comparisons/die-grouping/`. It inventories all current B.C. presets and offers type/family filters, related preset links, a two-preset comparison view, and an interactive [lettering timeline](../../../public/bc-font-comparisons/die-grouping/index.html?view=timeline). The public timeline deep link is `/plateforge/bc-font-comparisons/die-grouping/?view=timeline`.

This groups **serial-family comparisons and physical tooling variants**, not calendar years. Each preset retains its design/use period; none receives an inferred manufacture date or certification of identical physical tools. Separate inscription components are shown where the recipe provides them. Fixed logo plates, private owner-made plates, federal CANADA plates, local municipal issues and bicycle plates cannot inherit a provincial manufacturer from a dummy/default recipe profile.

## Evidence and practical limits

- `source-inventory.json`: current definitions, serial profile options, recipe sizes/caps and component profiles.
- `catalogue.json`: per-preset tooling bucket, source confidence, production exceptions, related comparisons and browser-selection coverage.
- `historical-evidence.json`: 66 retrieved historical source pages, 225 non-passenger assignments and eight historical representative photographic examples and ten newly reviewed municipal vehicle/bicycle specimens. Source pages for movie props and reproductions were unavailable in that source fetch.
- `modern-evidence.json`: sourced overlapping manufacturer/run rules and eight photographed specimens compared across passenger, dealer, commercial and collector classes.
- `special-evidence.json`: sixteen articles, eighty special/small-format presets and ten representative photographic inspections.
- `implementation-consistency.json`: exact merged research-path/advance comparisons against passenger contexts. This checks implementation consistency, not historical accuracy. Whole-run selection can add differences.

The photograph sets contain **35 unique original images**; the Collector B00-000 sample was inspected in two sub-reviews and counted once. Newly reviewed municipal sources include the blank Vancouver centennial base, independent screened/embossed components, and separate Prince George vehicle and bicycle cohorts. They are full photographs, without perspective correction or exact contour overlays. Current reproduction previews are captured independently; they do not constitute a photograph review. The source articles and original high-resolution photographs remain linked.

## Independent lettering timeline

The Gantt view covers all **446 presets, 1901–2026**, including earlier local bicycle issues, plates without a serial, and fixed artwork. Its declared default scenes expose 2,283 lettering/artwork components; another 119 entries represent selectable serial alternatives, for 2,402 entries before functional-lane expansion. The default scene is inspected before optional research-typeface replacements. Some fixed wording is embedded in artwork and remains identified as artwork rather than an independently measurable alphabet.

Main serials, reduced prefixes, province/place legends, slogans, dates, class descriptors, renewal strips/tabs and artwork have independent lanes. Physical tooling categories keep compact and motorcycle lettering separate from full-size comparisons. A combined printed text run can appear in multiple functional lanes; this does not establish multiple physical tools. Drawing cap sizes describe the model fit rather than measured die dimensions.

Outlined blue bands join adjacent or overlapping preset design/use periods for one component family and tooling category. Amber bands show separately attributed source contexts, dated photographs or approximate production intervals. Dashed purple bands show alternate serial choices available in the model, not photographed glyphs or historical tooling lifetimes. Alternate selection explicitly identifies that its thumbnail is the captured default; the user can choose the alternative in the main editor. Neither layer certifies exact introduction or withdrawal dates.

Its 37 source contexts include five dated municipal specimen comparisons with no inferred font introduction or lifetime. Vancouver centennial city plates and Prince George vehicle plates now have their own comparison cohorts; local bicycle tags remain separate.

The timeline has sixteen type filters, eight component filters, family/maker search, adjustable year range, four zoom levels and horizontal panning on mobile. Clicking a band opens source qualifications, its covered presets, editor navigation and a related comparison. Source windows retain unknown calendar dates for class-specific serial handovers. The Lieutenant Governor source documents the crest replacement in 2008 while still showing older arms in a 2016-labelled photograph; the timeline keeps that overlap instead of assigning a universal withdrawal date.

`timeline-evidence.json` preserves the source windows, dated/undated serial exceptions and qualification text. `python scripts/verify-bc-die-timeline.py` runs the meaningful browser checks against the public directory served at port 8787; set `DIE_TIMELINE_URL` for a production preview or deployed URL and `CHROMIUM_EXECUTABLE` when needed. `timeline-browser-verification.json` records meaningful filter, zoom, selection, alternate-choice, source-overlap and mobile checks.

## Production exceptions retained

The 1979 passenger base spans ACME and Hi-Signs, with an approximate ARX transition. Astrographic male/female, neoprene-top production and narrow non-passenger tooling require separate interpretation; source descriptions say neoprene production used the same male dies, so paint differences alone do not establish a new alphabet. Passenger Waldale transitions HFK/HGA with documented HFE and JFG–JFK exceptions. Commercial, collector, farm, utility trailer and restricted plates have their own handovers and older stock persists.

Early trailers are separated into the 1921–22 BC monogram and 1923–48 upright BC/small-prefix layouts. Their BC, date, reduced T/TR and larger serial are independent components. Source photographs support a trailer comparison cohort across passenger die-era changes; exact physical tool identity remains unconfirmed. Motorcycle 1974 explicitly mixes dies within a plate. Commercial 1973 occasionally reuses passenger province/date tools without making every component identical. Local municipal and bicycle plates need independent provenance; several bicycle sources name George Hewitt Co., with estimate caveats.

Four recipes with a sole declared Waldale option previously inherited an Astrographic renderer default. The registration fix makes rendering consistent with the declared option; it does **not** establish Waldale manufacture for every year in a multi-year base period. In particular, the utility-trailer base overlaps Astrographic 2000–04 and Waldale 2002–16, and its exact serial handover remains unresolved. Logging 1984 Hi-Signs attribution is a source estimate and is left labelled for review.

## Reproduce the catalogue

From the repository root:

```sh
node scripts/audit-bc-die-grouping.mjs /tmp/bc-grouping-inventory.json
python scripts/capture-bc-die-grouping.py --inventory /tmp/bc-grouping-inventory.json --base http://127.0.0.1:5176/plateforge/ --workers 4
python scripts/build-bc-die-grouping.py
```

Use a stable production preview for browser capture; live development hot reload can interrupt selection. The builder uses the committed evidence snapshots when the corresponding `/tmp` review inputs are absent. Run `python scripts/build-bc-die-grouping.py --committed-inputs` to force those snapshots and verify reproducibility. Source timeline evidence is always read from `docs/research/bc-die-grouping/timeline-evidence.json`. For a renderer change affecting only a few presets, use the capture script’s `--only id1,id2` option; include all changed IDs in the final refresh because the partial refresh report is replaced per invocation. The public thumbnail cache survives rebuilding without the original temporary downloads.
