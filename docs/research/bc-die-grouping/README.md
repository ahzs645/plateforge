# B.C. cross-class die and production catalogue

The public review is [`public/bc-font-comparisons/die-grouping/index.html`](../../../public/bc-font-comparisons/die-grouping/index.html), served at `/plateforge/bc-font-comparisons/die-grouping/`. It inventories all current B.C. presets and offers type/family filters, related preset links, and a two-preset comparison view.

This groups **serial-family comparisons and physical tooling variants**, not calendar years. Each preset retains its design/use period; none receives an inferred manufacture date or certification of identical physical tools. Separate inscription components are shown where the recipe provides them. Fixed logo plates, private owner-made plates, federal CANADA plates, local municipal issues and bicycle plates cannot inherit a provincial manufacturer from a dummy/default recipe profile.

## Evidence and practical limits

- `source-inventory.json`: current definitions, serial profile options, recipe sizes/caps and component profiles.
- `catalogue.json`: per-preset tooling bucket, source confidence, production exceptions, related comparisons and browser-selection coverage.
- `historical-evidence.json`: 66 retrieved historical source pages, 222 non-passenger assignments and eight representative photographic examples. Source pages for movie props and reproductions were unavailable in that source fetch.
- `modern-evidence.json`: sourced overlapping manufacturer/run rules and eight photographed specimens compared across passenger, dealer, commercial and collector classes.
- `special-evidence.json`: sixteen articles, eighty special/small-format presets and ten representative photographic inspections.
- `implementation-consistency.json`: exact merged research-path/advance comparisons against passenger contexts. This checks implementation consistency, not historical accuracy. Whole-run selection can add differences.

The photograph sets contain **25 unique original images** because the Collector B00-000 sample was inspected in two sub-reviews. They are full photographs, without perspective correction or exact contour overlays. Current reproduction previews are captured independently; they do not constitute a photograph review. The source articles and original high-resolution photographs remain linked.

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

Use a stable production preview for browser capture; live development hot reload can interrupt selection. The builder uses the committed evidence snapshots when the corresponding `/tmp` review inputs are absent. The public thumbnail cache survives rebuilding without the original temporary downloads.
