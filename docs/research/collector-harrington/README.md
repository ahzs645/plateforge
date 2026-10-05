# Collector Harrington lettering and shared serial alphabets

The supplied HARNGTON.TTF (Harrington Regular, Font Bureau version 1.10) provides
the fixed Collector, British and Columbia outline glyphs. The alternate Plain
upload was compared; Regular's lighter stroke is closer to the supplied B00~000
photograph. All glyphs preserve native advances, side bearings and proportions,
with one H-cap scale per line. The letters are flat screened artwork, outside
the serial's optional embossed relief. The small MULTI-VEHICLE subtitle uses a
separate plain sans substitute. Historical production version is unconfirmed.

Regenerate the fixed-word paths with:

```sh
python scripts/build-collector-harrington.py /path/to/HARNGTON.TTF
```

Collector serials share the corresponding passenger alphabet: Astrographic
Classic through the earlier batches, and Waldale from the source-documented
mid-B54 transition. The source identifies B00~000 as an Astrographic sample;
the two-well passenger and multi-vehicle recipes default to Waldale. Existing die choices for single-well,
multi-vehicle and motorcycle plates remain available. Canonical source bindings
keep the named family's units only. Shared serials freeze that alphabet before
measuring/splitting the run, so a different digit group cannot switch to another
family's outlines. Unobserved characters retain the profile's constructed
fallback; this does not certify every physical die or character contour.

The full-size separator is a filled wave with sheared ends, guided by B00~000.
Motorcycle variants retain the straight dash seen on their photographs.
Full-photo comparisons for all five presets are published at
`public/bc-font-comparisons/collector/index.html`; source photographs retain
their paint, wear and perspective. Whole-photo framing is approximate.

`font-provenance.json` identifies the two supplied files. Regression checks
compare serial glyphs against the common passenger masters and preserve the
Harrington glyphs with research lettering enabled. Browser verification checks
all five variants, both research settings, SVG/PNG exports and mobile overflow.
