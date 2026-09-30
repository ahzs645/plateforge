# Tracing B.C. dies from photographs (1915–17, 1940–54)

No existing font reproduces British Columbia's 1940–54 plate dies. Every published plate font found
(Leeward's survey: Driver Gothic, License Plate, Penitentiary Gothic, Motorway, SAA Series A and others)
copies 1970s-or-later U.S. or Ontario lettering. So these glyphs are built from the plates themselves.

## Method

1. `fetch.sh` downloads the 1915–17 and 1940–54 passenger photos, preferring the full-size "(XL)" copies
   the galleries link to, from [BCpl8s](https://www.bcpl8s.ca) into `.cache/`.
   BCpl8s names each photo after its plate (`1940-99830.jpg` is 99·830), so every character is labelled.
   The cache is git-ignored; the photographs are references only and are never committed or bundled.
2. `extract.py` trims the photo background, splits each plate into its two colours to find the ink, and
   cuts out the serial characters, the `BRITISH COLUMBIA` legend letters, the stacked year (1940–51) and
   the 52 (1952 base). A photo counts only when the number of shapes found equals the text it must show.
   Each sample is scaled to a common cap height and summed per character.
3. `tin.py` does the same for 1915–17 tin plates, grouped by maker (MacDonald: 1915 and 1916 to No. 9,000;
   Tacey: the 1916 over-run and 1917).
4. `merge.py` combines the 1940–48 and 1949–51 digit averages; `strip.py` and `tabs.py` do the same for
   the 1951 strip and the 1953/54 tabs from a handful of high-resolution photos.
5. `vectorize.py` smooths each average, removes averaging flares and pinholes, and traces it with
   [potracer](https://pypi.org/project/potracer/) into filled outlines (cap height 100, baseline 100).
6. `emit.py` writes `src/templates/dies/traced-1940.ts`, which the die profiles use as glyph overrides.

Run everything with `./run.sh` (Python 3 with `numpy pillow scipy potracer`). The output is
deterministic: rerunning on the same photos reproduces the committed file.

## Die-type charts and small series

`series.py series/<name>.json` handles a series with only a few photos, such as 1930's one-year Thompson dies.
The config lists each photo, the text it shows and where it can be downloaded. It writes:

- `out/<name>-chart.png`: the sharpest real crop of each digit 0–9, laid out like the BCpl8s "Die Types (0-9)"
  charts, captioned with the plate it came from. A grey tile marks a digit no photo shows.
- the per-character averages for `vectorize.py`.

The charts are built from BCpl8s photographs, so they stay in the git-ignored `out/` folder and are not committed.
1930 has no photographed 8; `emit.py` builds one from the traced 3 and its mirror image and marks it as synthesised.

## Sample counts (September 2026, full-size photos where available)

| Set | Samples per character |
|---|---|
| Serial digits, 1940–51 | 33–65 |
| Serial letters A, B, F | 8–14 (other letters stay constructed) |
| Legend `BRITISH COLUMBIA` | 79–236 |
| Stacked year | 4 (95), 8 (21), 0 (17), others 4–14 |
| 52 on the 1952 base | 39 |
| 1951 strip | 2 (6 for I); smoothed more heavily |
| 1953/54 tab year | 3–7 |
| 1915–16 numerals, MacDonald | 6–14 (the 4 is loosely aligned and the least reliable) |
| 1916 over-run and 1917 numerals, Tacey | 2–17 |
| 1930 numerals, Thompson | 1–6 (no 8; synthesised from the 3) |
| 1930 legend, Thompson | 6 (I: 18, B: 12) |

Characters with few samples are the least reliable. More photos, especially high-resolution
ones, can be dropped into `.cache/` (named `YYYY-SERIAL.jpg`) to strengthen the averages.

## Are 1940–54 one die or several?

`eras.py` measures every digit sample by year and asks which era's average each one matches best. Across 521
samples, width (about 0.55 of cap height) and stroke fill (about 0.50) are flat from 1940 to 1954. A 1940–48
digit is as likely to match the 1949–51 average as its own (182 vs 148 of 344), and 1952–54 digits match the
earlier averages better than their own. At this photo resolution the numerals are one die family. What does
change is the separator (a round dot to 1951, a short thick dash from 1952), the layout, and the renewal
pieces, which have their own dies (strip lettering, tab year).

## Other sources looked at

- Wikimedia Commons, *Security license plate font British Columbia deco 1924-1954* (CC BY-SA 4.0): a
  552 × 315 px chart of the earlier slanted dies. It was rate-limited from the build environment and was
  not used; any glyphs traced from it would carry its CC BY-SA terms.
- Leeward Productions, *License Plate Fonts of the United States, Canada, and Mexico*: a survey of replica
  fonts, all for later plates. Its note that North American dies are near-monospaced does not hold for
  B.C. 1940–54, where 1 and I are clearly narrower.
