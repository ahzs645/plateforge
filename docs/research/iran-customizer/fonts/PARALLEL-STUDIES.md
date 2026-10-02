# Source-guided parallel-series lettering

These seven original manual outline studies use only the frozen WorldLicensePlates specimens already supplied for the Iran customizer. They are **observed subsets, not complete historical fonts**. Their distinct proportions, serif/sans construction, numeral forms, stroke weights and script are preserved independently. No FE-style or generic Naskh face supplies the observed outlines.

## Profile / preset mapping

| Inventory / preset | Source profile | Main observed coverage | Additional source roles |
|---|---|---|---|
| `ir-wlp-teh-black` | `wlp-teh-black-study` | `TEH-470` | None |
| `ir-wlp-teh-green` | `wlp-teh-green-study` | `TEH-321` | None |
| `ir-wlp-thr-travel` | `wlp-thr-travel-study` | `THR-706` | None |
| `ir-wlp-travel-circa2010` | `wlp-touring-2010-study` | `347` | `letter`: E; `code`: 10; `country`: IRAN |
| `ir-wlp-uniimog` | `wlp-uniimog-study` | `5` | Atomic `uniimog` wordmark |
| `ir-wlp-us-military` | `wlp-us-military-study` | `۸۰۶` | None |
| `ir-wlp-us-topographical` | `wlp-us-topographical-study` | `۳۰۷۸۴` | Atomic `us-topographical` wordmark |

The Touring Club profile also provides the atomic Latin `iran-latin` wordmark. It must not replace the global Persian `iran` wordmark. Its label is `Iran · Latin source legend`.

The 2010 right-box code has a separate source cap-height (27 pixels), from the observed white `10`; the main black numerals and white-on-red `E` have a 25-pixel nominal cap-height. The tiny IRAN role retains its own six-pixel metric. No extrapolated number or letter alphabet is claimed for any role. The Touring Club footer is readable as a phrase but too small for reliable individual contour extraction; render it using an explicitly disclosed licensed sans candidate. The medallion remains omitted because the supplied photograph does not resolve its internal content.

The `uniimog` wordmark is the complete observed **serif** mission legend. The `55` is a separate heavy sans numeral construction. Use the atomic wordmark for the unchanged mission text. Editing to any unseen mission text must use strict unsupported reporting or an explicitly selected fallback; the source does not support an arbitrary serif mission alphabet.

The `us-topographical` wordmark follows the complete joined photograph silhouette, including its calligraphic joins and dots, rather than passing individual letters through a candidate font. The current transcription is جغرافیایی; the frozen inventory also records the historical orthographic reading جغرافیائی. The smallest features are manually regularized because of the source resolution.

## Reproducibility

- `parallel-studies.json`: source-plane profile/role/wordmark contract
- `parallel-build-studies.py`: handwritten contour definitions and source-overlay board builder
- `parallel-reference/`: original private reference crops, copied unchanged from the frozen evidence
- `wlp-*-study-comparison.svg` and `.png`: original photograph, clean vector masters at their original source positions, and semitransparent magenta overlay, all at one uniform 4× display scale
- `parallel-validation.json`: source SHA-256, exact dimensions, parsed contour bounds, source-box containment, role coverage and path-command counts

The comparison boards show one representative master per character, so repeated serial characters intentionally remain unfilled in the clean/overlay panels. These are neither missing runtime glyphs nor invented alternate dies. The generator normalizes every profile or role with one common cap-height and baseline. Wordmarks are normalized as complete atomic ink boxes.

Run `python docs/research/iran-customizer/fonts/parallel-build-studies.py` from the repository checkout to regenerate the JSON and SVG boards. Render board PNGs with Inkscape. Every handwritten contour was parsed with fontTools and checked against its source box; all seven rendered overlay boards were visually inspected. Numeric similarity scores would be misleading for these low-resolution, worn or blurred photographs and are intentionally absent.

## Source and rights limits

References are WLP sheets `AS_IRAN_OT1.jpg`, `AS_IRAN_OT2.jpg`, `AS_IRAN_UN.jpg` and `FO_IRAN_USAX.jpg`, linked in each profile. Their source crops are unchanged; all runtime letter artwork consists of new sparse, smooth path studies. Photograph reuse permissions are not established. Keep the photographs and photo-bearing overlay boards private, and never embed them as runtime plate textures or freely licensed public assets. Manual reconstruction does not establish an authenticated manufacturer, production die, complete character set or historical introduction date.
