import { withLettering } from '../core/lettering';
import { registerRegion } from '../core/registry';
import { china } from './asia/china';
import { iran } from './asia/iran';
import { iraq } from './asia/iraq';
import { japan } from './asia/japan';
import { britishColumbia } from './canada';
import { canadianProvinces } from './canada/provinces';
import { europeRegions } from './europe';
import { usRegions } from './us';

export const BUILT_IN_REGIONS = [...usRegions.map((region) => ({ ...region, formats: region.formats.map(withLettering) })), ...europeRegions, china, japan, britishColumbia, ...canadianProvinces, iraq, iran];

registerRegion(...BUILT_IN_REGIONS);
