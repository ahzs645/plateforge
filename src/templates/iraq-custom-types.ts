export type IraqCustomKind = 'modern' | 'bilingual' | 'divided' | 'side' | 'police' | 'legacy-temporary' | 'modern-temporary' | 'short-bilingual' | 'inspection-temporary' | 'icts' | 'international';
export interface IraqCustomState {
  presetId: string; serial: string; province: string; letter: string; governorate: string; year: string;
  layout: 'long' | 'compact'; vehicleClass: string; fontProfile: string; missingPolicy: 'strict' | 'fallback';
  bg: string; ink: string; strip: string; tracking: number; mainScale: number; border: boolean;
}
export interface IraqCustomPreset {
  id: string; label: string; family: string; kind: IraqCustomKind; kr: boolean; evidence: string;
  defaults: IraqCustomState; fields: (keyof IraqCustomState)[]; sourceArtworks: string[]; notes: string[];
}
export interface IraqCustomSourceCoverage { id: string; label: string; presetId: string | null; status: string; note: string; sourceUrl: string }
export interface IraqCustomResult { svg: string; width: number; height: number; warnings: string[]; errors: string[] }
