import records from '../../regions/canada/bc-decal-typography.json';

export interface TypographyRun {
  /** Position/cap/width as fractions of the decal; local rotated runs use height for width. */
  x: number;
  baseline: number;
  cap: number;
  width: number;
  profile: string;
  tracking: number;
  /** Source-supported pair spacing; native glyph outlines stay unchanged. */
  kerning?: Record<string, number>;
  anchor?: 'start' | 'middle' | 'end';
  local?: boolean;
}
export interface TypographyLayout {
  cornerRadius?: number;
  provinceCentre?: number;
  provinceColumns?: readonly number[];
  barcode?: { x: number; y: number; width: number; height: number };
}
export interface DecalTypographyReview {
  lineBreaks: string;
  finding: string;
  fontEvidence: string;
  source: string;
  sourceSha256: string;
  sourcePixels: number[];
  reviewedOn: string;
  runs: Record<string, TypographyRun[]>;
  layout?: TypographyLayout;
  monthVariants?: { fromMonth: number; evidence: string; runs: Record<string, TypographyRun[]>; layout?: TypographyLayout }[];
}
export const DECAL_TYPOGRAPHY = records as Record<string, DecalTypographyReview>;
export function decalTypography(id?: string, month?: string): DecalTypographyReview | undefined {
  const record = id ? DECAL_TYPOGRAPHY[id] : undefined;
  if (!record) return undefined;
  const monthNumber = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].indexOf(month ?? 'JAN') + 1;
  const variant = record.monthVariants?.filter(v => monthNumber >= v.fromMonth).at(-1);
  return variant ? { ...record, runs: { ...record.runs, ...variant.runs }, layout: { ...record.layout, ...variant.layout } } : record;
}
