import records from '../../regions/canada/bc-decal-typography.json';

export interface TypographyRun {
  /** Position/cap/width as fractions of the decal; local rotated runs use height for width. */
  x: number;
  baseline: number;
  cap: number;
  width: number;
  profile: string;
  tracking: number;
  anchor?: 'start' | 'middle' | 'end';
  local?: boolean;
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
}
export const DECAL_TYPOGRAPHY = records as Record<string, DecalTypographyReview>;
export const decalTypography = (id?: string): DecalTypographyReview | undefined => id ? DECAL_TYPOGRAPHY[id] : undefined;
