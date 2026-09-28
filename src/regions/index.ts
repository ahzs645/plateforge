import { withLettering } from '../core/lettering';
import { registerRegion } from '../core/registry';
import { costaRica } from './americas/costa-rica';
import { mercosurRegions } from './americas/mercosur';
import { china } from './asia/china';
import { iran } from './asia/iran';
import { iraq } from './asia/iraq';
import { japan } from './asia/japan';
import { korea } from './asia/korea';
import { vietnam } from './asia/vietnam';
import { britishColumbia } from './canada';
import { canadianProvinces } from './canada/provinces';
import { europeRegions } from './europe';
import { usRegions } from './us';

export const BUILT_IN_REGIONS = [...usRegions.map((region) => ({ ...region, formats: region.formats.map(withLettering) })), ...europeRegions, china, japan, britishColumbia, ...canadianProvinces, iraq, iran, korea, vietnam, costaRica, ...mercosurRegions];

registerRegion(...BUILT_IN_REGIONS);
