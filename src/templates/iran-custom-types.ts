export type IranCustomKind = 'national' | 'protocol' | 'motorcycle' | 'historical' | 'city-band' | 'international' | 'temporary' | 'temporary-old' | 'diplomatic-old' | 'historic-vehicle' | 'free-zone-old' | 'free-zone-2017' | 'bilingual-2002' | 'observer' | 'consular-old' | 'military-old';
export interface IranCustomState {
  presetId: string; serial: string; prefix: string; letter: string; code: string; city: string;
  year: string; expiry: string; zone: string; vehicleClass: string; fontProfile: string;
  missingPolicy: 'strict' | 'fallback'; aspectRatio?: number; nationalVariant?: 'diagram' | 'early-photo'; layout: 'source' | 'long' | 'compact';
  bg: string; ink: string; strip: string; tracking: number; mainScale: number; border: boolean;
}
export interface IranCustomPreset {
  id: string; label: string; family: string; kind: IranCustomKind;
  period: string; sortYear: number; dateNote: string; evidence: string;
  confidence: 'observed' | 'illustrated' | 'provisional' | 'disputed';
  defaults: IranCustomState; fields: (keyof IranCustomState)[];
  sourceArtworks: string[]; sources: {label: string; url: string}[]; notes: string[];
}
export interface IranSourceCoverage {
  id: string; label: string; presetId: string | null; status: string; note: string; sourceUrl: string;
}
export interface IranLetteringUsage { role:string; profileId:string; profileLabel:string; provenance:('observed'|'inferred'|'candidate'|'fallback'|'unsupported')[]; sourceIds:string[] }
export interface IranCustomResult { svg: string; width: number; height: number; warnings: string[]; errors: string[]; letteringUsage?:IranLetteringUsage[] }
