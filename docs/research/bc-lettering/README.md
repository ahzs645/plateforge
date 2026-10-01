# B.C. lettering research (September 2026)

The working evidence behind the B.C. die reconstruction is collected here: the die-type charts, the averaged glyphs
that were traced, overlays of PlateForge on photographs, the sample data, and the BCpl8s text the era survey was
built from. The findings are written up in [B.C. lettering eras](../../bc-font-eras.md) and the
[B.C. die library](../../bc-dies.md). [scripts/trace-bc-dies](../../../scripts/trace-bc-dies/README.md) explains the method.

## Rights and credits

The charts, average sheets and comparisons are derived from photographs published on
[BCpl8s](https://www.bcpl8s.ca/) by Christopher Garrish and its contributors (photo credits are on each BCpl8s page).
They are included only as research references for this reconstruction. They remain the property of their rights
holders, are not part of the app build, and should not be reused as artwork. The full photographs are not committed;
`scripts/trace-bc-dies/fetch.sh` downloads them into a git-ignored cache.

## Die-type charts (`charts/`)

Each chart shows the sharpest real crop of every digit 0–9 in one die family, laid out like the BCpl8s
"Die Types (0-9)" charts and captioned with the plate it came from.

| Chart | Dies | In PlateForge |
|---|---|---|
| [tin-macdonald](charts/tin-macdonald.jpg) | 1915–16 (to No. 9,000), MacDonald Manufacturing | `bc-tin-macdonald` |
| [tin-tacey](charts/tin-tacey.jpg) | 1916 over-run and 1917, J.R. Tacey & Sons | `bc-tin-tacey` |
| [slant-1924](charts/slant-1924.jpg) | 1924–27 and 1931–32, Tacey slanted | `bc-tacey-1924` |
| [straight-1928](charts/straight-1928.jpg) | 1928–29 and 1933–35, Tacey straight | `bc-straight-1928` |
| [thompson-1930](charts/thompson-1930.jpg) | 1930, Thompson Heating & Ventilating (no 8 photographed) | `bc-thompson-1930` |
| [slim-1936](charts/slim-1936.jpg) | 1936–39 slimline | `bc-tacey-1936` |
| [early-1940](charts/early-1940.jpg) | 1940–54 rounded | `bc-early-1940` |
| [dates](charts/dates.jpg) | 1924–39 date stamps, one pair per year | `bc-date-1924` … `bc-date-1939` |

## Averaged glyphs (`averages/`)

One sheet per die. Each character is the average of every labelled sample found, before smoothing and tracing,
captioned with its sample count. Each sheet is what `vectorize.py` traced. Sets with few samples are less reliable.
The 1940–54 serial letters other than A, B and F have one to seven samples, and some are contaminated by other
characters (P shows a 9), so PlateForge keeps those letters constructed.

## Overlay comparisons (`comparisons/`)

Each row shows the photograph, PlateForge's rendering, and PlateForge at 50% over the photograph. Use them to judge
position, size and letterform. They were rendered from the current code with `scripts/trace-bc-dies/compare.cjs`
(cases in `comparisons.json`):

- [1915-17-tin](comparisons/1915-17-tin.jpg): MacDonald 1915 and 1916, the Tacey over-run and 1917.
- [1924-39-annual](comparisons/1924-39-annual.jpg): one plate from each 1924–39 die family, including 1937's -2·200.
- [1930-thompson](comparisons/1930-thompson.jpg): short and long 1930 plates.
- [1940-52-bases](comparisons/1940-52-bases.jpg): 1940, 1949, 1951 with its strip, and 1952.
- [1951-strip](comparisons/1951-strip.jpg): the loose long strip.
- [1953-54-tabs](comparisons/1953-54-tabs.jpg): the loose 1953 and 1954 tabs.

## Data (`data/`)

- `*-counts.json`: samples per character for each set (`1940-54-counts.json` also gives the median width/height
  per era).
- `series-photos.json`: the BCpl8s photo file names behind each chart and series, with the text read from each.

## BCpl8s survey (`notes/`)

[bcpl8s-excerpts.md](notes/bcpl8s-excerpts.md) quotes every sentence on 146 BCpl8s pages that mentions dies, fonts,
numerals, lettering or re-stamping. Passenger chapters come first, in date order. The quotations remain BCpl8s's
text; the headings link to the pages.

## Rebuilding

From `scripts/trace-bc-dies`: run `./run.sh` (averages and traced glyphs), then `python3 gen_charts.py` and
`python3 series.py series/<name>.json` for `tin-macdonald`, `tin-tacey` and `early-1940` (charts only), then
`python3 publish.py`. For the overlays, start `npm run dev` and run `node compare.cjs`. Run `python3 survey.py`
for the excerpts.
