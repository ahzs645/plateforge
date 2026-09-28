import { withLettering } from '../core/lettering';
import { registerRegion } from '../core/registry';
import { costaRica } from './americas/costa-rica';
import { china } from './asia/china';
import { iran } from './asia/iran';
import { iraq } from './asia/iraq';
import { japan } from './asia/japan';
import { korea } from './asia/korea';
import { vietnam } from './asia/vietnam';
import { britishColumbia } from './canada';
import { europeRegions } from './europe';
import { usRegions } from './us';

export const BUILT_IN_REGIONS = [...usRegions.map((region) => ({ ...region, formats: region.formats.map(withLettering) })), ...europeRegions, china, japan, britishColumbia, iraq, iran, korea, vietnam, costaRica];

registerRegion(...BUILT_IN_REGIONS);
