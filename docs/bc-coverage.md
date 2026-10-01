# British Columbia: coverage and plate kit

PlateForge covers British Columbia with **441 editable designs in 16 families**, reconstructed from [BCpl8s](https://www.bcpl8s.ca/) research. Each family has its own timeline and gallery section. The in-app checklist at `#/library/coverage` maps all 67 BCpl8s topics to the formats that draw them. Its data file is `public/data/reference-library/bc-coverage.json`, and a test keeps it in step with the registry.

| Family | Designs | Scope |
|---|---|---|
| Passenger | 81 | 1904 owner-made leather; 1913–14 porcelain; 1915–17 tin; 1918–23 steel with 1919/21/22 tabs and the 1919 cardboard temporary; 1924–39 annuals; 1940–1985 original presets; 1985 flag base through the 2025 A99-9AA series |
| Commercial truck | 20 | 1924 T through the 2008 AA-9999 flag series |
| Farm | 15 | Tractor F and truck A/G, 1948–2025 |
| Trailers | 21 | Commercial, 5 × 8 in utility, floater |
| Motorcycle | 12 | 1949 to the 2011 BC Mark base; motorcycle dealer |
| Dealer & trade | 19 | Dealer (DEMONSTRATION), manufacturer, repairer, transporter |
| Industrial | 21 | X/XH industrial, logging, restricted, off-road, Special Agreement |
| Carrier | 29 | Motor and passenger carrier, motive fuel, prorate/APPORTIONED, reciprocity |
| Specialty | 32 | BC Parks, 2010 Olympics (six classes), Veteran, Memorial Cross, Collector, Antique, Personalized |
| Consular | 5 | CONSUL bases from 1967 and the 2007 red series |
| Amateur radio | 13 | Annual 1963–69, decal bases, flag base |
| Government & official | 27 | Public Works, doctors, government E, foreign touring, National Defence, National Parks, Lieutenant Governor, 1913 Victoria hired vehicles |
| Events & ceremonial | 16 | Royal tours, 1994 Commonwealth Games, APEC 1997, Expo 86 |
| Municipal | 64 | Province-issued MUNICIPAL/EXEMPT, city-issued plates for 26 municipalities, City of Vancouver categories |
| Bicycle | 40 | 16 municipalities, including die-cut shields, hexagons and ovals |
| Samples, prototypes & props | 18 | Official samples by era, souvenirs, paint tests, unissued designs, film props, a reproduction |

Anything that is not an issued road plate carries an explicit **status** (sample, prototype, proposal, souvenir, prop, reproduction, uncertain). The editor, timeline and gallery show it as a badge.

## Not rendered

These items stay in the checklist only, because they are not plates:

- chauffeur badges, keytags and radiator badges
- toppers and boosters with no serial
- driver's licences, paper permits and certificates
- stand-alone decals and stickers
- VIN-program boards
- fire-department boosters

Each family module lists smaller omitted variants in its format descriptions. Examples are designs known only from a mention, not a photo, and a few one-off errors.

## How it is built

- **Plate kit** (`src/templates/bc/kit.ts`): one data-driven scene builder. A recipe gives the shell, holes, rim, artwork, drawn shapes, riveted tab panels, die legends, typeface legends, the serial (die, separator or artwork separator, leading bar) and renewal wells. All units are millimetres.
- **Formats** (`src/regions/canada/bc-kit.ts`): `kitFormat` pairs a recipe with a serial grammar (pattern blocks, numeric ranges, or no number), die choices, annual palettes (colours plus `{yy}`, `{yyyy}`, `{y1}`, `{y2}` year tokens) and dated decals.
- **Dies** (`src/templates/dies/`): see [bc-dies.md](bc-dies.md).
- **Decals** (`src/regions/canada/bc-decals.ts`, `src/templates/bc/decal.ts`): renewal decals for 1970–2023 in four era layouts, with day stickers from 1993. There were no decals in 1973 or 1979, and the wells end after SF9-99X (2022).
- **Artwork** (`src/templates/bc/art*.ts`): simplified flat vectors registered by id. Examples are the flag, monogram, coat of arms, Parks scenes, the Olympic emblem, war memorial figures, crests and event logos.
- **Families** (`src/regions/canada/bc-*.ts`): one module per group. Each exports its families, eras and formats, and has a test that accepts the photographed serials and renders every palette and die option.

## Accuracy

These are research reconstructions:

- Colours are read from aged photographs.
- Sizes are documented where BCpl8s gives them. Otherwise they are estimated, and each description says so.
- Artwork is simplified.
- Dies are reconstructions, not recovered tooling.
- Serial validation checks documented formats and ranges, not real registrations.

Source photographs remain on BCpl8s and are not copied into this repository.
