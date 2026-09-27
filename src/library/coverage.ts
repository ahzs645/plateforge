/** B.C. coverage audit: which BCpl8s plate families have editable renderers,
 * plus the proposed die-profile backlog. Research topics, NOT distinct designs. */
import { safeWebUrl } from './catalogue';

export type ImplementationStatus = 'implemented' | 'partial' | 'missing-renderer' | 'research-not-template' | 'not-a-plate';
export interface CoverageRecord {
  id: string; name: string; sourceUrl: string; group: string; issueScope: string;
  reviewDepth: string; implementationStatus: ImplementationStatus; parentId: string | null;
  distinctions: string[]; nextAction: string; caution: string | null; additionalSources: string[];
  /** Editable format ids in PlateForge for this topic (added when built). */
  formats?: string[];
}
export interface DieProfile { id: string; label: string; scope: string; sourceUrl: string; task: string; status: string; confidence: string }
export interface SerialConfiguration { family: string; pattern: string; example: string }
export interface CoverageEvidence { id: string; title: string; finding: string; resolved?: boolean }
export interface CoverageManifest {
  schemaVersion: 1; reviewDate: string; reviewedCommit: string; scope: string; limitations: string[];
  counts: { inventoryRecords: number; registeredPassengerPresets: number; registeredPresets?: number };
  registeredPresets: Record<string, string[]>;
  repositoryEvidence: CoverageEvidence[];
  repositoryUpdates?: { id: string; summary: string; resolves: string }[];
  proposedDieProfiles: DieProfile[];
  officialSerialConfigurationReference: { sourceUrl: string; publicationDate: string; notation: string; status: string; note: string; configurations: SerialConfiguration[] };
  records: CoverageRecord[];
}

export const STATUS_LABELS: Record<ImplementationStatus, string> = {
  implemented: 'Built',
  partial: 'Partly built',
  'not-a-plate': 'Catalogued · not a plate',
  'missing-renderer': 'No renderer yet',
  'research-not-template': 'Research material, not a plate template',
};

const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string';
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(str);
const has = (v: unknown, keys: string[]) => record(v) && keys.every((k) => str(v[k]));

export function parseCoverageManifest(value: unknown): CoverageManifest {
  const ok = record(value) && value.schemaVersion === 1 && str(value.reviewDate) && str(value.reviewedCommit) && strings(value.limitations)
    && record(value.registeredPresets) && Object.values(value.registeredPresets).every(strings)
    && Array.isArray(value.repositoryEvidence) && value.repositoryEvidence.every((e) => has(e, ['id', 'title', 'finding']))
    && Array.isArray(value.proposedDieProfiles) && value.proposedDieProfiles.every((p) => has(p, ['id', 'label', 'scope', 'task', 'status']) && safeWebUrl((p as DieProfile).sourceUrl))
    && record(value.officialSerialConfigurationReference) && safeWebUrl(value.officialSerialConfigurationReference.sourceUrl)
    && Array.isArray(value.officialSerialConfigurationReference.configurations)
    && value.officialSerialConfigurationReference.configurations.every((c) => has(c, ['family', 'pattern', 'example']))
    && Array.isArray(value.records) && value.records.every((r) => has(r, ['id', 'name', 'group', 'issueScope', 'reviewDepth', 'nextAction'])
      && ((r as CoverageRecord).caution === null || str((r as CoverageRecord).caution))
      && safeWebUrl((r as CoverageRecord).sourceUrl) && strings((r as CoverageRecord).distinctions)
      && strings((r as CoverageRecord).additionalSources) && (r as CoverageRecord).additionalSources.every(safeWebUrl)
      && Object.hasOwn(STATUS_LABELS, String((r as CoverageRecord).implementationStatus)));
  if (!ok) throw new Error('The B.C. coverage manifest has an unsupported or invalid schema.');
  const manifest = value as unknown as CoverageManifest;
  if (new Set(manifest.records.map((r) => r.id)).size !== manifest.records.length) throw new Error('B.C. coverage record ids are not unique.');
  return manifest;
}

export function coverageMatches(r: CoverageRecord, query: string, group = '', status = ''): boolean {
  if (group && r.group !== group || status && r.implementationStatus !== status) return false;
  const haystack = `${r.name} ${r.group} ${r.issueScope} ${r.distinctions.join(' ')} ${r.nextAction}`.toLowerCase();
  return query.toLowerCase().trim().split(/\s+/).every((word) => haystack.includes(word));
}
