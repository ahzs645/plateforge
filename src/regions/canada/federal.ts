import type {PlateFormat, Region} from '../../core/types';
import {britishColumbia} from './index';
import {federalGalleryFormats, federalGalleryEras} from './federal-plates';

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
    ...federalGalleryFormats,
  ],
  families: [
    {id: 'federal', label: 'Federal CANADA', summary: 'National vehicle plates used across Canada.'},
    {id: 'fisheries', label: 'Fisheries', summary: 'Canada-Fisheries and bilingual Fisheries / Pêches bases.'},
    {id: 'domestic', label: 'Military in Canada', summary: 'DND, RCAF bases and national military references; uncertain examples are labelled.'},
    {id: 'overseas', label: 'Canadian Forces overseas', summary: 'France and Germany, including overlapping alphabets, trailers and motorcycle layouts.'},
    {id: 'attachments', label: 'Attachments and boosters', summary: 'Station attachments, uncertain internal-use references and souvenirs.'},
    {id: 'events', label: 'Special events', summary: 'Federal vehicle plates used for specific events.'},
  ],
  eras: [
    {id: 'federal', family: 'federal', label: 'National CANADA plates', period: [1970, 2026]},
    {id: 'events', family: 'events', label: 'APEC 1997', period: [1997, 1997]},
    ...federalGalleryEras,
  ],
  notes: '35 federal-gallery designs, including the two earlier national/event reconstructions, with a 41-specimen source ledger. Dated entries retain source-caption spans; undated designs have no invented period. Provincial National Defence N plates stay with their province. Overseas, Fisheries, attachment and souvenir uses are distinguished. Geometry and lettering are illustrative photographic candidates, not authenticated tooling or a complete registration history.',
};
