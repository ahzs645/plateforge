# B.C. plate lettering eras

This is a survey of every [BCpl8s](https://www.bcpl8s.ca/) page (146 pages, September 2026) for what it says about who made the plates and
which dies or lettering they used. The lettering changes when the **maker** or the **die set** changes, and that
does not always line up with a new plate design. Two changes happened partway through a year: the 1916 over-run,
and the ACME→Hi-Signs switch within a 1982 serial block.

"In PlateForge" gives the die profile that draws each era (see [bc-dies.md](bc-dies.md)). The die-type charts,
averaged glyphs, photo overlays and the BCpl8s excerpts this survey is based on are in
[research/bc-lettering](research/bc-lettering/README.md).

## Passenger plates

| Years | Maker | Lettering (per BCpl8s) | In PlateForge |
|---|---|---|---|
| 1904–12 | Owners | Home-made; house-number figures on leather. No standard. | Leather typeface proxies |
| 1913–14 | McClary Manufacturing | Porcelain enamel numerals. | `bc-porcelain-1913`, `bc-porcelain-1914` |
| 1915–16 (to No. 9,000) | MacDonald Manufacturing, Toronto | Lithographed tin, very condensed numerals. | `bc-tin-macdonald` (traced) |
| late 1916 (9,001–9,342), 1917 | J.R. Tacey & Sons, Vancouver | "The change in font and quality of the coat-of-arms is clearly visible"; over-run plates slightly longer. 1917 has three or four arms qualities and early wire rims. | `bc-tin-tacey` (traced); 1916 over-run and 1917 Type 1/2/3 formats |
| 1918–23 | Tacey | First embossed plates, made on equipment bought from Washington State; the dies closely match Washington's 1918–20 dies. Same dies in 1918, 1920 and 1923. | `bc-block-1918` |
| 1924–27 | Tacey | New **slanted "oval or scroll" dies**, said to be inspired by Massachusetts; used through 1927. The 1926 "-26" resembles 1924's date. | `bc-tacey-1924` (traced) |
| 1928–29 | Tacey | "New straighter dies". | `bc-straight-1928` (traced) |
| 1930 | Thompson Heating & Ventilating | **One-and-done dies**, never used again (possibly sub-contracted); a small raised dot separates the groups. | `bc-thompson-1930`, `bc-legend-1930` (traced from seven plates; no 8 is photographed, so it is built from the traced 3) |
| 1931–32 | Oakalla Prison (with Tacey's machinery) | Tacey's slanted dies reappear. | `bc-tacey-1924` (**1932 corrected** from the straight dies after checking photos) |
| 1933–35 | Oakalla | Tacey's straight dies again; four-figure numbers carry a long leading bar. | `bc-straight-1928` (traced) |
| 1936–39 | Oakalla | Slanted dies on the "slimline" plates, with the date stacked. 1937's date stamp was redesigned. New dies for 1938 copied the 1937 design so closely that they look identical. | `bc-tacey-1936` (traced); raised dot between groups |
| 1940–54 | Oakalla (still Tacey-era machinery) | Rounded dies. A raised round dot separates the groups until 1951 and a short thick dash from 1952; the 1951 strip and the 1953/54 tabs have their own dies. Photo averages show no numeral change within 1940–54. | `bc-early-1940` family (traced) |
| 1955–63 | Oakalla, new machinery (Screw Machine Products, Portland) | "Dies for the new plates [had] already been cast." Long BRITISH COLUMBIA legend die (possibly from 1952, certainly 1955–63). Late-1961 plates show the 1962 date "6". | `bc-oakalla-1955`, `bc-legend-1955` |
| 1964–69 | Oakalla | A **smaller** BRITISH COLUMBIA legend die, with the old long die reappearing at random through 1964, even on the same number. The 1967 over-run was made on the 1968 base with a "19" date. | `bc-oakalla-1955`, `bc-legend-1964` |
| 1970–72 | Oakalla | Mid-1950s machinery, which allows ten dies per column. | `bc-oakalla-1970` |
| 1973–77 | Oakalla | "Oakalla dies". | `bc-oakalla-1973` |
| 1978 | ACME Signalisation, Montreal | Narrower **"Quebec dies"**, identical to the 1977 Quebec dies. | `bc-acme-1978` |
| 1979–82 | ACME | Same dies on the 1979 base. The first block is crisp; the second is "sloppy", except about EAX–FKS (maybe to GDN), which is crisp again; about 50,000 sets of the third block. | `bc-acme-1979` |
| 1982–85 | Hi-Signs, Edmonton | **"Nova Scotia dies"**: the same dies Hi-Signs used on Nova Scotia plates from 1980. | `bc-hisigns-1982` |
| 1985–2001 | Astrographic Industries, Surrey | Four die types: male/female (early LAA), neoprene-top, narrow **non-passenger** dies (N/P block and the 1984 reveal plates), and **Classic** for the rest. A short **Waldale** run (KRL–ARC) appeared in 1998–99. | `bc-astro-1` to `bc-astro-4`, `bc-waldale` |
| 2002– | Waldale, Amherst NS | Waldale dies from 000-HGA (December 2002), with some overlap (HFE; JFG–JFK). | `bc-waldale` |

**Legends and layout, 1924–39.** Each die family has its own traced BRITISH COLUMBIA legend (`bc-legend-1924`,
`bc-legend-1928`, `bc-legend-1936`). Serial, legend and date positions are medians measured over the photographed
plates (`scripts/trace-bc-dies/layout.py`). 1936–39 plates separate the groups with a raised dot.

**Date stamps.** The small date on 1924–39 plates was struck with its own dies, which changed from year to
year: bold and rounded 1924–29, light and narrow in 1930, curly in 1933, and narrow and stacked in 1936–39. Each
year has its own traced date die (`bc-date-<year>`), not the serial die.

## Other plate types

- **Commercial truck 1973–75**: the passenger BRITISH COLUMBIA die appears at random late in the 1973 base. A
  1968–69 passenger "19" date die also turns up on some late plates.
- **Motorcycle**: the 1974 base is known for mismatched dies on one plate. Astrographic dies ran 1986–2003 and
  Waldale from 2003. The 2011 redesign made the font 3/8" larger.
- **Industrial vehicle, logging, ham radio, amateur**: the same maker eras apply. They show ACME "Quebec dies"
  1977–79 and Hi-Signs "Nova Scotia dies" around 1982–84.
- **Collector, farm, dealer, restricted, special agreement**: Astrographic dies persist on some bases years after
  2002, before Waldale dies take over.
- **Memorial Cross and some specialty bases**: Waldale's narrower **"Mississippi dies"** (`bc-mississippi`).
- **Motorcycle, trailer, Expo 86 souvenirs**: smaller dies than passenger plates.

## Still to model

- The minor die variants listed above: the random 1964 legend die, the 1961 date stamp, and ACME's crisp vs
  "sloppy" blocks, which differ in paint and stamping quality rather than letterforms.
