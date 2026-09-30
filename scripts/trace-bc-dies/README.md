# Tracing the 1940–54 B.C. dies from photographs

No existing font reproduces British Columbia's 1940–54 plate dies. Every published plate font found
(Leeward's survey: Driver Gothic, License Plate, Penitentiary Gothic, Motorway, SAA Series A and others)
copies 1970s-or-later U.S. or Ontario lettering. So these glyphs are built from the plates themselves.

## Method

1. `fetch.sh` downloads the 1940–54 passenger photos from [BCpl8s](https://www.bcpl8s.ca) into `.cache/`.
   BCpl8s names each photo after its plate (`1940-99830.jpg` is 99·830), so every character is labelled.
   The cache is git-ignored; the photographs are references only and are never committed or bundled.
2. `extract.py` trims the photo background, splits each plate into its two colours to find the ink, and
   cuts out the serial characters, the `BRITISH COLUMBIA` legend letters, the stacked year (1940–51) and
   the 52 (1952 base). A photo counts only when the number of shapes found equals the text it must show.
   Each sample is scaled to a common cap height and summed per character.
3. `merge.py` combines the 1940–48 and 1949–51 digit averages; `strip.py` and `tabs.py` do the same for
   the 1951 strip and the 1953/54 tabs from a handful of high-resolution photos.
4. `vectorize.py` smooths each average, removes averaging flares and pinholes, and traces it with
   [potracer](https://pypi.org/project/potracer/) into filled outlines (cap height 100, baseline 100).
5. `emit.py` writes `src/templates/dies/traced-1940.ts`, which the die profiles use as glyph overrides.

Run everything with `./run.sh` (Python 3 with `numpy pillow scipy potracer`). The output is
deterministic: rerunning on the same photos reproduces the committed file.

## Sample counts (September 2026)

| Set | Samples per character |
|---|---|
| Serial digits, 1940–51 | 32–64 |
| Serial letters A, B, F | 7–15 (other letters stay constructed) |
| Legend `BRITISH COLUMBIA` | 76–227 |
| Stacked year | 4 (99), 0 (19), 8 (21), others 4–14 |
| 52 on the 1952 base | 34 |
| 1951 strip | 2 (6 for I); smoothed more heavily |
| 1953/54 tab year | 3–7 |

Characters with few samples are the least reliable. More photos, especially high-resolution
ones, can be dropped into `.cache/` (named `YYYY-SERIAL.jpg`) to strengthen the averages.

## Other sources looked at

- Wikimedia Commons, *Security license plate font British Columbia deco 1924-1954* (CC BY-SA 4.0): a
  552 × 315 px chart of the earlier slanted dies. It was rate-limited from the build environment and was
  not used; any glyphs traced from it would carry its CC BY-SA terms.
- Leeward Productions, *License Plate Fonts of the United States, Canada, and Mexico*: a survey of replica
  fonts, all for later plates. Its note that North American dies are near-monospaced does not hold for
  B.C. 1940–54, where 1 and I are clearly narrower.
