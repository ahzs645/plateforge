import { registerRegion } from '../core/registry';
import { china } from './asia/china';
import { japan } from './asia/japan';
import { europeRegions } from './europe';
import { usRegions } from './us';

export const BUILT_IN_REGIONS = [...usRegions, ...europeRegions, china, japan];

registerRegion(...BUILT_IN_REGIONS);
