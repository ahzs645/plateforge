import { registerRegion } from '../core/registry';
import { china } from './asia/china';
import { japan } from './asia/japan';
import { britishColumbia } from './canada/bc';
import { europeRegions } from './europe';
import { usRegions } from './us';

export const BUILT_IN_REGIONS = [...usRegions, ...europeRegions, china, japan, britishColumbia];

registerRegion(...BUILT_IN_REGIONS);
