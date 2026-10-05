# Passenger Carrier · supplied provincial flag

The user supplied `Flag_of_British_Columbia.svg` for `carrier-passenger-2005`. The [BCpl8s Passenger Carrier article](https://www.bcpl8s.ca/PassengerCarrier.html) identifies the provincial flag as this plate's background. The blank-well [810-301 photograph](https://www.bcpl8s.ca/images/MotorCarrier/2005-810301%28XL%29.jpg) and later [814-298 photograph](https://www.bcpl8s.ca/images/PassengerCarrier/2024-814298%28XL%29.jpg) show the crown behind the top legend, Union Jack behind the number, and waves/sun behind the bottom class words and renewal well.

The old approximate `bc-flag` construction in `trade-flag-wash` is replaced by all 15 native paths from the supplied SVG. Original colours, transforms, black details and the local clipping path are preserved. Clip IDs are prefixed to avoid conflicts with unrelated artwork. Static SVG geometry is read without running attached content; no external image or nested SVG is required in the exported plate.

The 5:3 flag is uniformly fitted inside a 195 × 119 mm box, starting at (4,4) in the existing estimated 203 × 127 mm plate plane. A separate 50% white overlay approximates the mean colour of the photograph's screened dots. It does not reproduce the microscopic halftone, reflective sheeting or worn paint. Plate dimensions/registration and print colour remain approximate; the supplied flag is not a recovered plate-printing master. Serial and legend fonts are independent of this artwork update.

The photograph leaves the renewal well unprinted. Its pale opaque fill covers the flag's sun disk there, rather than showing flag artwork through an empty box. The supplied crown and sun construction differ from the photographed print; those native shapes are preserved, not presented as a traced historical printing master.

Only `carrier-passenger-2005` uses this background master. The 2010 temporary yellow plate and other B.C. flag artwork keep their existing artwork. `provenance.json` records the upload hash, source viewport and photographic references.

Rebuild native geometry: `python scripts/import-passenger-carrier-flag.py /path/to/Flag_of_British_Columbia.svg`. Rebuild the credited source/current comparison: `node scripts/build-passenger-carrier-flag-review.mjs`. After a production build, `python scripts/verify-passenger-carrier-flag.py` checks the native clipping, background/lettering order, typed serials, standalone SVG/PNG exports and mobile display.
