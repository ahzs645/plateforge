# Iraq and Iran: implementation and research notes

Research snapshot: **27 September 2026**. Implementation base: `e411fdccdd90d017a55688c735073b8509efa585`.

## What is implemented

Two registered country regions (`iraq`, `iran`), two SVG templates (`iq`, `ir`), shared script normalization, shared geometric glyph masters, seeded generation and per-format validation. The existing PlateForge region picker, format fields, gallery, timeline, batch generation and export pipeline discover these through the normal registries. No new application dependency or existing plate renderer is required.

| Region | Recipes | Coverage |
|---|---:|---|
| Iraq | 27 | Six modern federal class recipes; six modern KRG class recipes; seven 2008 bilingual classes; two earlier private layouts; six KRG legacy colour classes. Modern recipes each have long/compact layout controls. |
| Iran | 16 | Thirteen standard/class recipes; protocol; motorcycle; **one explicitly unfinished free-zone layout study**, with seven zone choices. |

These counts describe code recipes, not unique historical issues or a complete worldwide catalogue. In particular, seven zone choices are **not** seven completed emblem reconstructions.

## Architecture

`src/regions/asia/iraq-data.ts` and `iran-data.ts` hold source references, allocations, and class vocabularies. `plate-script.ts` converts Arabic/Persian digits without reversing their logical order or discarding zeros. `iraq.ts` and `iran.ts` define fields, validation, generation and period/family metadata.

`src/templates/westasia-glyphs.ts` contains original geometric studies for Latin letters, Arabic-Indic digits, Persian digits and the required isolated series letters. Iranian plates and the older Iraqi Arabic-digit plates draw those digits and letters from converted OFL outlines instead (`westasia-arabic.ts`, profile `naskh`; see [Iraq / Iran typography](iraq-iran-typography.md)); the geometric set is the fallback and the default profile. Arabic ٤/٥/٦ and Persian ۴/۵/۶ are distinct masters. The accessibility mark is geometry, not an emoji.

`westasia-scene.ts` places serial groups explicitly and returns an escaped SVG scene. It is independent of React and shared by the two thin React template adapters and the standalone preview. Unknown characters produce a visible missing-glyph cell rather than silently disappearing. Short Iraqi serials retain reasonable character proportions instead of stretching one digit over an entire number panel.

No font binaries (only outlines converted from OFL fonts, with their licence in `src/assets/fonts/Parastoo-Sahel-OFL.txt`), scraped photographs, external image references or security features are bundled. **Joined province/country words, the government word الف, and small legends are SVG text using system fonts.** They remain editable and joined, but are not font-independent outlined wordmarks. Browser and export font substitution can therefore affect them.

## Evidence ledger

- [Iraq overview and tables](https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Iraq), consulted as a **secondary** source. Revision observed: `1338002866` (12 February 2026).
- [Rudaw, original interview with Erbil traffic spokesperson, 25 April 2022](https://www.rudawarabia.net/arabic/kurdistan/250420224). Supports the KRG introduction and quotes the conversion instructions; see conflict below.
- [Alsumaria, 2 June 2024](https://www.alsumaria.tv/news/localnews/490157/رموز-بدل-أسماء-المحافظات-اللوحات-المرورية-الجديدة-تهوي-بـالمميز). Original reporting from the Interior Ministry announcement supports the federal rollout. It does not independently establish every colour or die measurement.
- [Iran overview and detailed allocation tables](https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Iran), **secondary**. Revision observed: `1353798607` (12 May 2026).
- [Original plate-class figure by Tourani et al.](https://www.researchgate.net/figure/Different-types-of-Iranian-vehicle-license-plates-with-their-corresponding-labels_fig1_346851347), from *A Robust Deep Learning Approach for Automatic Iranian Vehicle License Plate Detection and Recognition for Surveillance Systems*. Used as a visual cross-check, not a source of downloadable glyphs or official specifications.
- Modern Iraqi plate photographs checked via [Nabaa](https://nbanews.net/arabic/hMy4HZ4i) and the [Al-Zawraa plate photograph](https://alzawraapaper.com/vrsfls/cntnt/pctr/119139.jpg). These support the white face with a coloured side strip and examples of shorter federal numbers. Photograph dates are not treated as introduction dates. Images are not redistributed.

Requested atlas references: [WorldLicensePlates — Iraq](http://www.worldlicenseplates.com/world/AS_IRAQ.html) and [WorldLicensePlates — Iran](http://www.worldlicenseplates.com/world/AS_IRAN.html). Retrieval failed in this environment, including alternative HTTP/HTTPS attempts. They are **pending sources**, not evidence for completed coverage. No claim is made to have imported their collections.

## Important modelling decisions

### Iraq

The modern model separates federal introduction in 2024 from KRG introduction in 2022. Modern colour occupies the side strip; this is not implemented as a full-face recolour. The KRG variant also has the smaller KR mark. The standard and compact view boxes use 520×110 and 335×155 respectively.

The overview's literal `GG X ####` conflicts with its own five-digit transition discussion and plate examples. Modern generators produce five digits. Federal validation also permits shorter carried-over serials; KRG validation requires five positions. This is a documented interpretation, not an official exhaustive grammar.

**No old-to-new KRG converter is implemented.** Wikipedia refers to the first digit for generic six-digit transitions; Rudaw's quoted instructions refer to the second digit from the left and include an additional repeated-number exception involving the third digit. A converter should be based on the authoritative written instruction plus fixtures, not a plausible guess from one paragraph.

The bilingual model keeps Arabic and Latin serials synchronized from the same fields and omits the province for government/customs classes. Legacy Halabja is not invented. For older issues, historical size variation and class-specific typography remain unmeasured. The 1988 and 2001 canvases are representative layout choices, explicitly identified in the editor.

### Iran

The standard model has separate two-digit, series-mark, three-digit, and right-hand-code positions. It accepts Latin, Arabic-Indic or Persian digit input and renders Persian digits. Standard main serials exclude zero; allocated right-hand codes can include zero. Motorcycle allocations skip all numbers containing zero, including the 499→511 boundary.

Private series use the thirteen letters in the detailed allocation table. The overview's additional ژ entry conflicts with that list; ژ is not silently added as an ordinary private series. Accessible plates display a drawn wheelchair mark instead of the database placeholder ژ. Government uses the complete word الف; taxis add TAXI. D/S remain Latin class letters, and their three-digit block is a mission identifier, not a randomly invented mission allocation.

Military/police/diplomatic recipes cover the documented **starting national code 11**. They do not claim that no later national code can exist. Mission generation uses the cited example 214, with free digit editing explicitly not validating the corresponding mission identity.

There are 86 distinct right-hand codes in the encoded table and 183 motorcycle codes after removing zero-containing numbers. These are snapshot counts, not live availability. Code 32 has multiple provincial associations; 42 has historical exceptions; 64 includes the Tabas exception. Country-level code options do **not** constitute a complete county/letter/prefix/date resolver. A generated combination passing structural checks is not asserted to have been issued.

2003 (system introduction in one source section) and 2005 (European dimensions) are kept distinct. The initial long-format civilian recipes use a 2005 coverage bound, not a claim that all classes were launched in the same year. Protocol, motorcycle and free-zone recipes do not fabricate a precise introduction date. Four-digit protocol/free-zone nonzero generators are conservative sample choices rather than proven exhaustive issuance ranges.

## Fidelity and remaining work

Serial glyphs are **approximations, not measured dies**: original geometric drawings, or (Arabic-script digits and letters, modern Iraqi Latin) converted font outlines. Colours are screen approximations, not official paint specifications. Flag micro-calligraphy, security marks, reflective surfaces, fastening details, exact small-lettering masters and manufacturing tolerances are not reconstructed.

Next evidence passes should prioritize actual die masters or well-scaled front-on specimens; full WorldLicensePlates access; pre-1988 Iraq and pre-national Iran; Iraqi motorcycles/ICTS; Iranian temporary expiry layouts; museum plates with Bagh-e Melli artwork; all seven free-zone emblems; earlier political/service plates; and date-dependent county/letter allocation validation.

The timeline's 2026 endpoints mean “researched through 2026,” not withdrawal. Broad gap intervals are research windows; their lower bounds are not asserted introduction years. Labels and notes make those limitations explicit.

## Verification and review

Repository checks:

```sh
npm ci
npm run typecheck
npm test
npm run build
node scripts/build-iraq-iran-preview.mjs
```

Open `preview/iraq-iran.html` for a self-contained offline editor. It uses the same source modules and scene builders; it is not a separate hand-drawn mockup. It supports country/format selection, editable fields, seeded regeneration, validation feedback, source links, a recipe gallery, gap notes, and SVG/PNG downloads.

The new tests check 500 seeded examples per recipe (21,500 examples), editable-field completeness, allocation membership, digit normalization, zero rules, distinct glyph sets, compact sizing, class-specific fields, SVG escaping and actual React server rendering. The PR workflow runs the complete repository tests and build, not only the new test files.

Local verification used TypeScript 5.8.3 with the fetched core contracts and a minimal React declaration fixture because this environment could not install the repository's dependencies. Pure generation/validation/rendering assertions were executed; the standalone editor was exercised in Chromium. These checks are **not a substitute for a successful full repository CI run**. Consult the pull request's actual checks rather than assuming they passed.
