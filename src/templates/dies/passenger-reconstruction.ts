/**
 * Five source-informed passenger masters, kept outside the generated registry.
 *
 * U/Y/Z paths were recovered exactly from vector comparison figures embedded
 * in the November 7 report. The source modules/commit were not recovered.
 * The two N paths are new November 8 recreations from the original photographs;
 * the archived N figure is raster-only and cannot establish its former path.
 * See docs/research/bc-font-reconstruction-2026-11-08/README.md.
 */
import type { DieProfile, ReconstructedGlyphEvidence } from './engine';
import { skeletonGlyph, type SkeletonGlyph } from './skeleton';

export interface PassengerMaster extends ReconstructedGlyphEvidence {
  character: string;
  paths: readonly string[];
}

const passenger = 'https://www.bcpl8s.ca/images/Passenger/';
export const BC_PASSENGER_MASTERS: Readonly<Record<string, PassengerMaster>> = {
  U: {
    character: 'U', id: 'bc-waldale-2025-U-v1', status: 'source-informed', recovery: 'report-vector',
    source: `${passenger}2025/2025-A907GU.jpg`,
    paths: ['M0 0 H9 V73 C9 84 16 91 26.5 91 C37 91 44 84 44 73 V0 H53 V73 C53 89 42 100 26.5 100 C10.5 100 0 89 0 73 Z'],
  },
  Y: {
    character: 'Y', id: 'bc-waldale-2025-Y-v1', status: 'source-informed', recovery: 'report-vector',
    source: `${passenger}2025/2025-A820EY.jpg`,
    paths: ['M0 0 H10 L22.5 28 C24 31.5 25 33 26.5 33 C28 33 29 31.5 30.5 28 L43 0 H53 L31 53 V100 H22 V53 Z'],
  },
  Z: {
    character: 'Z', id: 'bc-waldale-2025-Z-v1', status: 'source-informed', recovery: 'report-vector',
    source: `${passenger}2025/2025-A250EZ.jpg`,
    paths: ['M0 0 H53 V9 L11 91 H53 V100 H0 V91 L42 9 H0 Z'],
  },
  astro3N: {
    character: 'N', id: 'bc-astro-3-passenger-N-20261108-v1', status: 'source-informed', recovery: 'new-2026-11-08',
    source: `${passenger}1985-2001/1988-NJB300(XL).jpg`,
    // The broad concave joins are authored cubic transitions, not sampled paint
    // boundaries. Preserve the preceding research master's 45.938-unit width.
    paths: ['M1.5 100 Q0 100 0 98.5 V1.5 Q0 0 1.5 0 H10.3 Q12.5 0 13.3 2.6 L29.6 49.6 C31 53.7 32.4 56 33.9 56 C35.5 56 35.938 52.8 35.938 48.5 V1.5 Q35.938 0 37.438 0 H44.438 Q45.938 0 45.938 1.5 V98.5 Q45.938 100 44.438 100 H34.9 Q33.2 100 32.5 97.7 L17.1 50 C15.8 46 14.5 44.8 13 44.8 C10.8 44.8 10 48.8 10 54 V98.5 Q10 100 8.5 100 Z'],
  },
  classic4N: {
    character: 'N', id: 'bc-astro-4-passenger-N-20261108-v1', status: 'source-informed', recovery: 'new-2026-11-08',
    source: `${passenger}1985-2001/1989-NPN030(XL).jpg`,
    // Separately constructed Classic form, with lighter stems, a wider diagonal
    // and broader inner joins than type 3. Both photographed Ns are compared.
    paths: ['M1.8 100 Q0 100 0 98.2 V2 Q0 0 2 0 H7.5 Q10 0 11 2.8 L30.5 50.8 C32.2 55 34 57 36.3 57 C39.6 57 41.062 54.5 41.062 50 V1.8 Q41.062 0 42.862 0 H47.262 Q49.062 0 49.062 1.8 V98.2 Q49.062 100 47.262 100 H43 Q40.2 100 39 96.8 L18.7 49.3 C17 45.2 15.4 43.8 12.9 43.8 C9.4 43.8 8 46.7 8 51.4 V98.2 Q8 100 6.2 100 Z'],
  },
};

/** The outer plate format is essential: a collector can borrow the passenger
 * research pool without acquiring this narrowly evidenced reconstruction. */
export function passengerMasters(format: string | null, profile: string): readonly PassengerMaster[] {
  if (format === '2025-flag' && profile === 'bc-waldale') return [BC_PASSENGER_MASTERS.U, BC_PASSENGER_MASTERS.Y, BC_PASSENGER_MASTERS.Z];
  if (format === '1985-flag' && profile === 'bc-astro-3') return [BC_PASSENGER_MASTERS.astro3N];
  if ((format === '1985-flag' || format === '2001-flag') && profile === 'bc-astro-4') return [BC_PASSENGER_MASTERS.classic4N];
  return [];
}

const cache = new WeakMap<DieProfile, Map<string, DieProfile>>();
export function reconstructedPassengerVariant(profile: DieProfile, format: string | null, role?: string): DieProfile {
  // An unspecified role is used for measuring the shared serial alphabet;
  // 'x' is the actual renderer's preflight serial-width measurement.
  if (role !== undefined && role !== 'x' && role !== 'serial' && !role.startsWith('serial-')) return profile;
  const masters = passengerMasters(format, profile.id);
  if (!masters.length) return profile;
  const key = masters.map(m => m.id).join('|');
  let variants = cache.get(profile);
  if (!variants) { variants = new Map(); cache.set(profile, variants); }
  const previous = variants.get(key);
  if (previous) return previous;
  const overrides: Record<string, SkeletonGlyph> = { ...profile.overrides };
  const reconstructedGlyphs: Record<string, ReconstructedGlyphEvidence> = { ...profile.reconstructedGlyphs };
  const researchChars = new Set(profile.researchChars);
  const researchSourceUnits = { ...profile.researchSourceUnits };
  for (const master of masters) {
    const preceding = profile.overrides?.[master.character] ?? skeletonGlyph(master.character, profile.params);
    if (!preceding) continue;
    // Preserve the advance from the active mode. N's research and production
    // advances differ; adopting a better contour must not reflow its neighbours.
    overrides[master.character] = { advance: preceding.advance, paths: [...master.paths], fill: true };
    const { character, paths: _paths, ...evidence } = master;
    reconstructedGlyphs[character] = evidence;
    researchChars.delete(character);
    delete researchSourceUnits[character];
  }
  const result: DieProfile = { ...profile, overrides, reconstructedGlyphs,
    ...(profile.researchChars ? { researchChars, researchSourceUnits } : {}),
    evidence: { ...profile.evidence, notes: `${masters.map(m => m.character).join('/')} uses a source-informed passenger reconstruction; photographed examples are construction inputs, not independent holdouts. ${profile.evidence.notes}` },
  };
  variants.set(key, result);
  return result;
}
