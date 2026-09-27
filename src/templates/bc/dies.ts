/**
 * Which die profiles a B.C. preset uses for its serial and its small legends,
 * and how its serial separator looks. Chosen from the period, base and maker
 * documented on BCpl8s; see src/templates/dies/profiles.ts for the evidence.
 */
import { buildDieText, dieRunWidth, dieSupports } from '../dies/engine';
import { dieProfile } from '../dies/profiles';
import type { SvgNode } from '../svg-scene';

export interface BcDieSet { serial: string; legend: string; separator: '·' | '-' }

export function bcDieSet(design: Record<string, unknown>): BcDieSet {
  const year = Number(design.year);
  const base = typeof design.baseId === 'string' ? design.baseId : '';
  if (base === '1978-acme') return { serial: 'bc-acme-1978', legend: 'bc-legend-acme', separator: '-' };
  if (base === '1979-first' || base === '1979-second') return { serial: 'bc-acme-1979', legend: 'bc-legend-acme', separator: '-' };
  if (base === '1982-third' || base === '1985-fourth') return { serial: 'bc-hisigns-1982', legend: 'bc-legend-hisigns', separator: '-' };
  if (year >= 1973) return { serial: 'bc-oakalla-1973', legend: 'bc-legend-1973', separator: '·' };
  if (year >= 1970) return { serial: 'bc-oakalla-1970', legend: 'bc-legend-1964', separator: '·' };
  if (year >= 1964) return { serial: 'bc-oakalla-1955', legend: 'bc-legend-1964', separator: '·' };
  if (year >= 1955) return { serial: 'bc-oakalla-1955', legend: 'bc-legend-1955', separator: '·' };
  return { serial: 'bc-early-1940', legend: 'bc-legend-1940', separator: '-' };
}

/**
 * Die replacement for the live-text labels. `size` is the proxy font size;
 * the die's cap height is 0.7 of it. Spread legends keep their glyphs and add
 * letter spacing to reach the slot width instead of stretching.
 */
export function dieLabel(profileId: string, value: string, x: number, baseline: number, size: number, maxWidth: number,
  ink: string, role: string, spread = false): SvgNode | null {
  const profile = dieProfile(profileId);
  if (!value || !dieSupports(profile, value)) return null;
  const cap = size * 0.7;
  const natural = (dieRunWidth(profile, value) * cap) / 100;
  const gaps = [...value].length - 1;
  const letterSpacing = spread && gaps > 0 && natural < maxWidth ? ((maxWidth - natural) / gaps) * (100 / cap) : 0;
  return buildDieText({ text: value, profile, x, baseline, capHeight: cap, maxWidth, anchor: 'middle', ink, role, letterSpacing }).node;
}
