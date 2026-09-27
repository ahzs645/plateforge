import { britishColumbia as earlyBritishColumbia } from './bc';
import { bcLaterFormats } from './bc-later';

/** Preserve legacy recipe exports/tests while extending the registered region. */
export const britishColumbia = {
  ...earlyBritishColumbia,
  formats: [...earlyBritishColumbia.formats, ...bcLaterFormats],
  notes: 'Passenger base reconstructions, 1940–1985, with selected production and serial variants. Reference-library coverage is much broader than editable coverage. Exact dies, decals, colours and artwork are not certified.',
};
