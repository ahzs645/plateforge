# Embedding PlateForge plates

`src/embed/` exposes PlateForge's renderer and gallery data to other sites, without the PlateForge
app around them. [PofBC](https://github.com/ahzs645/PofBC) uses it for its **Plates** view, with
this repository as a git submodule at `vendor/plateforge`.

## Entry points

| Import | File | What it does |
|---|---|---|
| `plateforge/bc` | `src/embed/bc.ts` | Registers the B.C. template and region only, and exports `BRITISH_COLUMBIA`. |
| `plateforge` | `src/embed/index.ts` | The component and data API (below). It registers nothing itself. |

There is no package build. A host aliases those two specifiers to the source files, as PofBC's
`vite.config.js` does, and Vite compiles the TypeScript. A region entry has to be imported before
any plate renders, so the host bundles only the templates, region data and fonts it draws. Another
region would get its own entry (`src/embed/<region>.ts`) that registers its template and region.

```js
import { BRITISH_COLUMBIA } from 'plateforge/bc'
import { PlateView, regionFamilies, regionSections, samplePlate, setupPlates } from 'plateforge'

setupPlates()  // once per page: @font-face rules, and the B.C. research lettering starts loading
const [family] = regionFamilies(BRITISH_COLUMBIA)
for (const section of regionSections(BRITISH_COLUMBIA, { family: family.id })) {
  // section.heading, section.period, section.summary, section.gap, section.cards[i].format
}
<PlateView plate={samplePlate(BRITISH_COLUMBIA, family.formats[0])} className="thumb" />
```

| Export | Use |
|---|---|
| `setupPlates(doc?)` | Declares the bundled faces (a browser fetches a face only when a plate uses it) and starts loading the research lettering. Idempotent. |
| `PlateView` | Renders any `Plate` through its template as `<div><svg/></div>`. Redraws when fonts or research glyphs arrive. Bring your own CSS; the SVG scales to its container. |
| `samplePlate(region, format)` | A stable, seeded example (the same format always shows the same serial), for thumbnails. |
| `makePlate`, `generatePlate`, `createRng` | Build a plate from edited parts, or a random one. `format.fields` describes the editable parts; `format.validate(parts)` returns an error message or `null`. |
| `regionFamilies`, `regionSections`, `gallerySectionsFor`, `buildTimeline`, `stepTimeline`, `formatPeriod`, `statusBadge` | The same family → era → design grouping PlateForge's gallery uses (`src/core/gallery.ts`), with documented gaps kept in place. |
| `exportPlate(svg, plate, 'svg' \| 'png')`, `exportName`, `download` | A portable file with its fonts embedded and checked against their recorded SHA-256. Rejects an invalid serial. |
| `plateforgeLink(region, format?)` | The design in the full editor (`#/ca-bc/1953`), or the region's gallery. |
| `researchDiesEnabled`, `setResearchDiesEnabled`, `useResearchDiesVersion` | The research-lettering switch PlateForge's inspector shows. |

## React and fonts

The embed uses no React 19 API, so React 18 hosts work. The host's React must be the only copy
(Vite's `resolve.dedupe: ['react', 'react-dom']`).

Fonts are imported with `?url` from the `@fontsource` packages, so the host must install the same
pinned versions PlateForge lists in `package.json`: `barlow-condensed`, `noto-sans`, `noto-serif`,
`pinyon-script` and `noto-sans-canadian-aboriginal` (all 5.3.0). The export checks each face's bytes
against `src/templates/font-manifest.json`, so a different version fails the export rather than
embedding an unrecorded face.

`scripts/typography-build-manifest.py` writes the face list in two parts: `font-assets-core.ts`
(everything but the Chinese, Japanese and Korean subsets) and `font-assets-cjk.ts`, recombined by
`font-assets.ts`. `templates/fonts.ts` imports only the core list. A `?url` import is emitted into a
build as soon as its module is in the graph, so a B.C.-only host ships about 2 MB of fonts instead
of about 94 MB. PlateForge's own app passes the whole list (`FONT_ASSETS`) to `installPlateFonts`
and to the exporter.

## Limits

The embed shows what PlateForge draws, with the same reconstruction status, period and source
links. It does not add evidence. `src/embed/embed.test.ts` checks that the B.C. entry registers B.C.
alone, that every B.C. design appears exactly once across its families, that each design's sample
is valid, and that the shared font module never imports the CJK subsets.
