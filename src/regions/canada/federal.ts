import type {PlateFormat, Region} from '../../core/types';
import {britishColumbia} from './index';

/** National issues already reconstructed from the Canadian Forces source study.
 * Keep the provincial source routes working without registering duplicate recipes.
 */
function federalFormat(sourceId: string, id: string, label: string, family: string): PlateFormat {
  const source = britishColumbia.formats.find(format => format.id === sourceId);
  if (!source) throw new Error(`Missing federal plate source: ${sourceId}`);
  return {...source, id, label, family, era: family,
    design: {...source.design, jurisdiction: 'CA'}};
}

export const canadaFederal: Region = {
  id: 'ca-federal', name: 'Federal plates', code: 'CA', country: 'Canada',
  group: 'North America', flag: '🇨🇦', template: britishColumbia.template,
  design: {...britishColumbia.design, jurisdiction: 'CA'},
  formats: [
    federalFormat('official-defence-canada', 'standard', 'Federal CANADA · 1970 onward', 'federal'),
    federalFormat('events-apec-1997-military', 'apec-1997', 'APEC 1997 · Canadian Forces', 'events'),
  ],
  families: [
    {id: 'federal', label: 'Federal CANADA', summary: 'National vehicle plates used across Canada.'},
    {id: 'events', label: 'Special events', summary: 'Federal vehicle plates used for specific events.'},
  ],
  eras: [
    {id: 'federal', family: 'federal', label: 'National CANADA plates', period: [1970, 2026]},
    {id: 'events', family: 'events', label: 'APEC 1997', period: [1997, 1997]},
  ],
  notes: 'The two federal vehicle designs currently reconstructed in PlateForge. Earlier provincial National Defence N plates remain with their province. Lettering, dimensions and artwork are approximate source reconstructions; this is not a complete inventory of federal registrations.',
};
