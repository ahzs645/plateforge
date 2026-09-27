import type { LetteringType } from '../core/lettering';

/** A dated transcription of the article's classification, NOT 2026 issuance data.
 * Introduction explicitly says last updated February 2011. These records are
 * facts about the survey, not exact fonts, downloaded plates, or legal advice. */
export const LEEWARD_SOURCE = 'https://www.leewardpro.com/articles/licplatefonts/licplate-fonts-nam-class.html';
export const LEEWARD_DATE_SOURCE = 'https://www.leewardpro.com/articles/licplatefonts/licplate-fonts-intro.html';
export interface LetteringReference {
  id: string;
  name: string;
  group: string;
  category: LetteringType | 'serif';
  sourceDate: '2011-02';
  source: string;
  regionId?: string;
  note?: string;
}
function rows(group: string, prefix: string, category: LetteringReference['category'], entries: string): LetteringReference[] {
  return entries.split('|').map((entry) => {
    const [code, name] = entry.split(':');
    const id = `${prefix}-${code.toLowerCase()}`;
    return { id, name, group, category, sourceDate: '2011-02', source: LEEWARD_SOURCE,
      ...(prefix === 'us' || id === 'ca-bc' ? { regionId: id } : {}) };
  });
}
export const LEEWARD_JURISDICTIONS: readonly LetteringReference[] = ([
  ...rows('United States', 'us', 'semicircular', 'CA:California|LA:Louisiana|ME:Maine|MA:Massachusetts|MO:Missouri|NH:New Hampshire|ND:North Dakota|OH:Ohio|WA:Washington|WI:Wisconsin|DC:District of Columbia|ID:Idaho|IN:Indiana|IA:Iowa|MT:Montana|NE:Nebraska|NV:Nevada|TX:Texas|WY:Wyoming'),
  ...rows('United States', 'us', 'squarish', 'CO:Colorado|FL:Florida|MI:Michigan|NJ:New Jersey|NM:New Mexico|NC:North Carolina|VT:Vermont'),
  ...rows('United States', 'us', 'oval', 'AR:Arkansas|HI:Hawaii|KS:Kansas|NY:New York|OR:Oregon'),
  ...rows('United States', 'us', 'hybrid', 'AK:Alaska|CT:Connecticut|GA:Georgia|IL:Illinois|KY:Kentucky|MD:Maryland|MS:Mississippi|PA:Pennsylvania|RI:Rhode Island|UT:Utah|WV:West Virginia|AL:Alabama|AZ:Arizona|MN:Minnesota|OK:Oklahoma|SC:South Carolina|SD:South Dakota|TN:Tennessee|DE:Delaware'),
  ...rows('United States', 'us', 'serif', 'VA:Virginia').map((r) => ({ ...r, note: 'The source lists Virginia separately as serif. It is not assigned to one of the four procedural modes.' })),
  ...rows('Canada', 'ca', 'semicircular', 'BC:British Columbia|NT:Northwest Territories|NU:Nunavut|ON:Ontario'),
  ...rows('Canada', 'ca', 'squarish', 'QC:Quebec|SK:Saskatchewan'),
  ...rows('Canada', 'ca', 'oval', 'AB:Alberta|MB:Manitoba|NB:New Brunswick|NL:Newfoundland and Labrador|NS:Nova Scotia'),
  ...rows('Canada', 'ca', 'hybrid', 'PE:Prince Edward Island|YT:Yukon'),
  ...rows('Other jurisdictions in the survey', 'survey', 'semicircular', 'CZ:Canal Zone|PR:Puerto Rico|VI:Virgin Islands').map((r) => ({ ...r, note: r.id === 'survey-cz' ? 'Historical Canal Zone entry; not a current issuing jurisdiction.' : 'Jurisdiction label retained from the historical survey.' })),
  ...rows('Other jurisdictions in the survey', 'survey', 'oval', 'AS:American Samoa'),
  ...rows('Other jurisdictions in the survey', 'survey', 'hybrid', 'GU:Guam'),
  { id: 'mx-survey', name: 'Mexico (states grouped by the source)', group: 'Mexico', category: 'oval', sourceDate: '2011-02', source: LEEWARD_SOURCE,
    note: 'One aggregate survey entry, not individually researched state plate designs or current specifications.' },
] satisfies LetteringReference[]).sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
