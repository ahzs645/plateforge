# Northwest Territories polar bear plate reconstruction

The NWT plate outline is rebuilt as editable cubic Bézier geometry using the two
supplied references. The scenic specimen is the primary shape reference. The
older blue-on-white plate provides a second visual check and a slotted mounting
hole configuration.

This is a reference-based reconstruction. The normalized 600 × 300 artwork
canvas is not a verified manufacturing drawing or a claim about exact die
dimensions. Small differences between the supplied specimens remain, especially
at the muzzle, belly opening and front toe.

## Assets

| File | Use |
| --- | --- |
| [Silhouette](../public/shapes/nwt-polar-bear/nwt-polar-bear.svg) | One closed filled cut path for clipping, scaling or recolouring. |
| [Editable outline and trim](../public/shapes/nwt-polar-bear/nwt-polar-bear-outline.svg) | Named groups for the cut edge, inset border and circular mounting holes. |
| [Silhouette with holes](../public/shapes/nwt-polar-bear/nwt-polar-bear-with-holes.svg) | An even-odd compound path with four genuine transparent circular holes. |
| [Normalized geometry](../public/shapes/nwt-polar-bear/nwt-polar-bear-geometry.json) | Section names, explicit control coordinates, reference metadata, round holes and slots. |

All three SVGs are self-contained path geometry. They contain no embedded image,
external font dependency or raster filter. Their width/height attributes specify
a 1200 × 600 pixel display size and their viewBox specifies a 600 × 300 canvas;
they can be scaled freely. The hole-free silhouette is the appropriate clipping
master; the printed inset border is a distinct path.

## Construction

The outer contour has **50 cubic Bézier segments and 7 straight segments**, plus
one move and one closure. Its controls are organized into eight named sections:

1. Back and shoulder
2. Ear and forehead
3. Snout and mouth
4. Throat and front leg
5. Wide belly opening
6. Middle foot opening
7. Rear foot opening
8. Rump and rear leg

This preserves the four flat-soled feet and three unequal open gaps, the shallow
back saddle, the small ear, the hooked mouth and the long sweeping front leg.
The forehead handles are aligned for a smooth transition. The inset trim is
drawn independently, with 41 cubic segments and 8 straight segments, so it follows
the tight mouth and foot openings without simply shrinking the silhouette.

The source controls are authored directly in
[`scripts/nwt-polar-bear/geometry.mjs`](../scripts/nwt-polar-bear/geometry.mjs).
The asset generator has no raster input: it only transforms those explicit
coordinates and writes the SVGs, JSON and TypeScript constants. No contour
extraction, automatic tracing, image-to-path fitting or existing SVG was used to
create the control geometry.

## Reference record

| Reference | Dimensions | Role |
| --- | --- | --- |
| `page-47-selection-1.png` | 1306 × 656 px | Primary scenic specimen; outline, inset trim and four round holes. |
| `image(3).png` | 627 × 318 px | Secondary older plate; visual comparison and four horizontal slots. |

The scenic specimen is also published in the
[Northwest Territories Gazette, 31 May 2013, Schedule D, printed page 173 / PDF page 47](https://www.justice.gov.nt.ca/fr/fichiers/gazette-des-tno/2013/05_2.pdf#page=47).
The attachment itself is the visual reconstruction reference; the Gazette is
recorded as corroborating provenance.

The approximate visible primary bounds `(10, 6, 1280, 634)` map to the 600 × 300
canvas. The secondary bounds `(4, 5, 621, 308)` are used only for its slot positions
and comparison alignment. Independent axis normalization changes the approximate
primary aspect ratio by about 0.95%; it is a deliberate accommodation of the
application canvas. Source-space control points retain the observed proportions
if a future profile needs them. A physical specimen or official die drawing
would be needed to certify dimensions, tolerances, hole spacing or historical
die variants.

## Plateforge integration

`CaDesign.bearProfile: 'nwt-reference'` selects the new geometry for the two NWT
formats. It drives the body clip, full-content mask and separate inset frame.
The mask punches mounting holes through every layer, including scenery and
lettering, so the SVG and PNG exports preserve transparent holes and foot gaps.

| NWT format | Shared silhouette | Mounts | Border width |
| --- | --- | --- | --- |
| Spectacular | Scenic-reference reconstruction | Four circular holes | 2.4 canvas units |
| Explore Canada's Arctic | Same family reconstruction; earlier die unverified | Four horizontal slots from older reference | 3 canvas units |

The NWT header, serial and slogan positions are adjusted to fit the reconstructed
body. The scenic foreground spans the full canvas before clipping, avoiding
vertical seams at the expanded feet. The shared legacy bear remains available
for the existing Nunavut plate and decorative emblem; those uses have not been
validated against these NWT references.

## Editing and regeneration

For direct design work, open the desired SVG in a vector editor and edit its path
nodes or named groups. To change the application master, edit the authored
sections in `scripts/nwt-polar-bear/geometry.mjs`, then run:

```sh
node scripts/build-nwt-polar-bear.mjs
npm test -- src/regions/canada/provinces.test.ts src/ui/exporting.test.ts
npm run build
```

The generator updates:

- `src/templates/shapes/nwt-polar-bear.ts`
- `public/shapes/nwt-polar-bear/nwt-polar-bear.svg`
- `public/shapes/nwt-polar-bear/nwt-polar-bear-outline.svg`
- `public/shapes/nwt-polar-bear/nwt-polar-bear-with-holes.svg`
- `public/shapes/nwt-polar-bear/nwt-polar-bear-geometry.json`

Direct edits to generated files will be replaced on the next regeneration.

## Validation scope

The reconstruction was overlaid on both supplied images. The primary overlay
checks the outer edge independently from the inset trim; the secondary overlay
shows remaining differences rather than averaging the two specimens.

Vector sampling checks cover a closed contour, no self-intersections, in-canvas
bounds, containment of the border and mounts, and four separate feet. Focused
application tests cover NWT selection, the distinct border, circular/slotted
mounts, optional omitted mounts, and retention of the existing Nunavut silhouette.
Browser export checks inspect transparent pixels at all four mounting holes,
each of the three foot gaps and outside the plate, plus an opaque body sample.

These checks establish geometry and rendering behavior. They do not certify
pixel-perfect reproduction, historical die identity or manufacturing precision.
