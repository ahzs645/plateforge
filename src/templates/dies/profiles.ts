/**
 * B.C. die profiles. Each profile's proportions and diagnostic digit shapes were
 * read from BCpl8s digit comparisons (0–9 photographed straight-on); letters use
 * the same construction and are therefore less certain than digits. These are
 * reconstructions for illustration, not recovered tooling.
 */
import type { DieProfile } from './engine';

const page = (period: string) => ({ title: `BCpl8s · Passenger ${period.replace('-', '–')}`, url: `https://www.bcpl8s.ca/Passenger-${period}.html` });
const lettersNote = 'Letters follow the same construction and were checked against plate photos only.';

export const DIE_PROFILES: readonly DieProfile[] = [
  // ── Legends (province names, slogans, years) ──────────────────────────
  {
    id: 'bc-legend-condensed', label: 'Legend · condensed sans',
    params: { width: 50, stroke: 14, curve: 'stadium', tracking: 9, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.5, wide: 1.2 },
    evidence: { status: 'legend-approximation', specimens: [page('1964-1969'), page('1979-1985')], notes: 'Small legends (BRITISH COLUMBIA, BEAUTIFUL, years) matched by eye to plate photos: condensed, heavy, unserifed.' },
  },
  {
    id: 'bc-legend-light', label: 'Legend · light sans',
    params: { width: 54, stroke: 10, curve: 'stadium', tracking: 10, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.48, wide: 1.2 },
    evidence: { status: 'legend-approximation', specimens: [page('1985-2001')], notes: 'Lighter screened legends on flat and flag-era plates.' },
  },
  {
    id: 'bc-legend-1940', label: 'Legend · 1940–54 bold', params: { width: 58, stroke: 16, curve: 'stadium', tracking: 9, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.5, wide: 1.2 },
    evidence: { status: 'legend-approximation', specimens: [page('1940-1948'), page('1952-1954')], notes: 'Bold condensed caps, W/H about 0.55–0.6 (1940 99-830, 1948 76-487, 1952 42-289).' },
  },
  {
    id: 'bc-strip-1951', label: 'Legend · 1951 renewal strip', params: { width: 66, stroke: 18, curve: 'stadium', tracking: 12, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.46, wide: 1.2, dot: 'round' },
    evidence: { status: 'legend-approximation', specimens: [page('1949-1951')], notes: 'BRITISH·51·COLUMBIA on the blue-on-white strip: heavy, wide rounded caps (W/H about 0.65–0.7, stroke about 0.18) filling roughly 60% of the strip height, with round raised dots at mid-height. Matched by eye to strip photos.' },
  },
  {
    id: 'bc-legend-1955', label: 'Legend · 1955–63 long die', params: { width: 55, stroke: 15, curve: 'stadium', tracking: 9, one: 'plain', three: 'round', four: 'open', seven: 'straight', narrow: 0.5, wide: 1.2 },
    evidence: { status: 'legend-approximation', specimens: [page('1955-1963')], notes: 'Long legend die: bold, fairly condensed caps (W/H about 0.55), spread across most of the width.' },
  },
  {
    id: 'bc-legend-1964', label: 'Legend · 1964–72 short die', params: { width: 66, stroke: 12, curve: 'oval', tracking: 9, one: 'plain', three: 'round', four: 'open', seven: 'straight', narrow: 0.46, wide: 1.18 },
    evidence: { status: 'legend-approximation', specimens: [page('1964-1969'), page('1970-1972')], notes: 'Medium-weight, near-geometric caps (round O and C), W/H about 0.65–0.7.' },
  },
  {
    id: 'bc-legend-1973', label: 'Legend · 1973–77 geometric', params: { width: 84, stroke: 15, curve: 'oval', tracking: 8, one: 'plain', three: 'round', four: 'open', seven: 'straight', narrow: 0.4, wide: 1.12 },
    evidence: { status: 'legend-approximation', specimens: [page('1973-1978')], notes: 'Wide, bold geometric caps with circular C, O and U (W/H about 0.8–0.9).' },
  },
  {
    id: 'bc-legend-acme', label: 'Legend · ACME', params: { width: 54, stroke: 10, curve: 'stadium', tracking: 16, one: 'flag', three: 'flat-top', four: 'closed', seven: 'straight', narrow: 0.5, wide: 1.2 },
    evidence: { status: 'legend-approximation', specimens: [page('1973-1978'), page('1979-1985')], notes: 'Lighter, slightly condensed caps with wide letter spacing (1978 NNN-057, 1979 bases).' },
  },
  {
    id: 'bc-legend-hisigns', label: 'Legend · Hi-Signs', params: { width: 58, stroke: 12, curve: 'stadium', tracking: 10, one: 'flag', three: 'round', four: 'closed', seven: 'curved', narrow: 0.5, wide: 1.2 },
    evidence: { status: 'legend-approximation', specimens: [page('1979-1985')], notes: 'Medium-weight, moderately condensed caps (1983 BWW-209, 1985 AWR-707).' },
  },
  // ── Early and Oakalla serial dies (gallery photos only; no per-digit crops exist) ──
  {
    id: 'bc-porcelain-1913', label: '1913 porcelain numerals',
    params: { width: 38, stroke: 11, curve: 'stadium', tracking: 7, one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.62, wide: 1.2 },
    evidence: { status: 'legend-approximation', specimens: [page('1913-1914')], notes: 'Tall, very condensed white numerals on the 1913 porcelain (6543).' },
  },
  {
    id: 'bc-porcelain-1914', label: '1914 porcelain numerals',
    params: { width: 44, stroke: 14, curve: 'stadium', tracking: 8, one: 'flag-base', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.62, wide: 1.2 },
    evidence: { status: 'legend-approximation', specimens: [page('1913-1914')], notes: 'Heavier condensed numerals with a flat-topped 5 (1914 5318).' },
  },
  {
    id: 'bc-tin-1915', label: '1915–17 tin numerals',
    params: { width: 46, stroke: 13, curve: 'box', boxRadius: 9, tracking: 9, one: 'flag-base', two: 'curved', three: 'round', four: 'closed', six: 'straight', seven: 'straight', nine: 'straight', narrow: 0.6, wide: 1.2 },
    evidence: { status: 'legend-approximation', specimens: [page('1915-1917')], notes: 'Very tall squarish numerals on lithographed tin (1915 5244, 1916 7462, 1917 12963).' },
  },
  {
    id: 'bc-block-1918', label: '1918–23 block dies',
    params: { width: 48, stroke: 13, curve: 'stadium', tracking: 9, one: 'flag-base', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.62, wide: 1.2 },
    evidence: { status: 'legend-approximation', specimens: [page('1918-1923')], notes: 'Embossed block numerals from Washington-derived dies with a based 1 (1918 12741, 1920 25085).' },
  },
  {
    id: 'bc-tacey-1924', label: '1924–27, 1931 slanted dies', maker: 'J.R. Tacey & Son',
    params: { width: 46, stroke: 14, curve: 'stadium', tracking: 9, one: 'flag-base', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.62, wide: 1.2, dash: { width: 14 } },
    slant: 5,
    evidence: { status: 'legend-approximation', specimens: [page('1924-1929'), page('1931-1935')], notes: 'Slanted rounded numerals used 1924–27 and again in 1931 (1924 25-610).' },
  },
  {
    id: 'bc-straight-1928', label: '1928–30, 1933–35 straight dies',
    params: { width: 46, stroke: 14, curve: 'stadium', tracking: 9, one: 'flag-base', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.62, wide: 1.2, dash: { width: 14 } },
    evidence: { status: 'legend-approximation', specimens: [page('1924-1929'), page('1931-1935')], notes: 'Straighter upright numerals introduced in 1928 (1929 41-311).' },
  },
  {
    id: 'bc-tacey-1936', label: '1936–39 slanted dies',
    params: { width: 50, stroke: 13, curve: 'oval', tracking: 9, one: 'flag-base', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.62, wide: 1.2, dash: { width: 14 } },
    slant: 4,
    evidence: { status: 'legend-approximation', specimens: [page('1936-1939')], notes: 'Slanted Tacey-style dies with an oval 0; the 1938 dies were made to match 1937 (1937 -2-200).' },
  },
  {
    id: 'bc-legend-1924', label: 'Legend · 1924–39', params: { width: 66, stroke: 14, curve: 'stadium', tracking: 9, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.5, wide: 1.2 },
    evidence: { status: 'legend-approximation', specimens: [page('1924-1929'), page('1936-1939')], notes: 'Bold condensed BRITISH COLUMBIA legend spanning the lower edge.' },
  },
  {
    id: 'bc-early-1940', label: 'Early rounded dies (1940–54)',
    params: { width: 50, stroke: 16, curve: 'stadium', tracking: 9, one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'curved', nine: 'curved', narrow: 0.6, wide: 1.2, dash: { width: 16 } },
    evidence: { status: 'legend-approximation', specimens: [page('1940-1948'), page('1949-1951'), page('1952-1954')], notes: 'Bold, fairly wide rounded numerals (W/H about 0.5, stroke 0.15–0.18) with a curved 7 and closed 4, read from gallery photos (1948 76-487, 1951 217-639); BCpl8s has no digit comparison for these years.' },
  },
  {
    id: 'bc-oakalla-1955', label: 'Oakalla block dies (1955–69)', maker: 'Oakalla Prison Plate Shop',
    params: { width: 43, stroke: 16, curve: 'box', boxRadius: 11, tracking: 8, one: 'flag', two: 'curved', three: 'round', four: 'open', six: 'straight', seven: 'straight', nine: 'straight', narrow: 0.6, wide: 1.2, dash: { width: 2 } },
    evidence: { status: 'legend-approximation', specimens: [page('1955-1963'), page('1964-1969')], notes: 'Heavy rounded-rectangle numerals (W/H about 0.43, stroke about 0.16), open-top 4 and a square dot separator, read from gallery photos (1955 222-222, 1962 494-558, 1964 485-584).' },
  },
  {
    id: 'bc-oakalla-1970', label: 'Oakalla dies (1970–72)', maker: 'Oakalla Prison Plate Shop',
    params: { width: 47, stroke: 16, curve: 'box', boxRadius: 12, tracking: 8, one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'straight', seven: 'straight', nine: 'straight', narrow: 0.6, wide: 1.2, dash: { width: 2 } },
    evidence: { status: 'legend-approximation', specimens: [page('1970-1972')], notes: 'Heavy rounded-rectangle characters (W/H 0.45–0.5, stroke 0.15–0.17) with a square dot separator (1970 BDE-981, 1972 KPT-830).' },
  },
  {
    id: 'bc-oakalla-1973', label: 'Oakalla dies (1973–77)', maker: 'Oakalla Prison Plate Shop',
    params: { width: 47, stroke: 16, curve: 'box', boxRadius: 12, tracking: 8, one: 'flag', two: 'curved', three: 'round', four: 'open', six: 'straight', seven: 'straight', nine: 'straight', narrow: 0.6, wide: 1.2, dash: { width: 2 } },
    evidence: { status: 'legend-approximation', specimens: [page('1973-1978')], notes: 'As 1970–72 but with the open-top 4 seen on LAA-444 and LMM-435.' },
  },
  // ── 1970s–80s manufacturers ───────────────────────────────────────────
  {
    id: 'bc-acme-1978', label: 'ACME (1978, Quebec-style)', maker: 'ACME Signalisation',
    params: { width: 41, stroke: 12, curve: 'oval', tracking: 8, one: 'flag', two: 'curved', three: 'flat-top', four: 'closed', fourFoot: true, six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.62, wide: 1.2 },
    evidence: { status: 'specimen-matched', specimens: [page('1973-1978')], notes: `Very condensed oval digits with a flat-topped 3, flagged 1 without a base, closed 4. ${lettersNote}` },
  },
  {
    id: 'bc-acme-1979', label: 'ACME (1979 base)', maker: 'ACME Signalisation',
    params: { width: 41, stroke: 12, curve: 'oval', tracking: 8, one: 'flag', two: 'curved', three: 'flat-top', four: 'closed', fourFoot: true, six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.62, wide: 1.2 },
    evidence: { status: 'specimen-matched', specimens: [page('1979-1985')], notes: `Narrowest of the blue-base dies; heavy strokes, flat-topped 3. ${lettersNote}` },
  },
  {
    id: 'bc-hisigns-1982', label: 'Hi-Signs (“Nova Scotia” dies)', maker: 'Hi-Signs',
    params: { width: 49, stroke: 11, curve: 'stadium', tracking: 9, one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'curved', nine: 'curved', narrow: 0.55, wide: 1.18 },
    evidence: { status: 'specimen-matched', specimens: [page('1979-1985')], notes: `Wider and lighter than ACME; round-topped 3 and slightly curved 7. ${lettersNote}` },
  },
  // ── Flag era ──────────────────────────────────────────────────────────
  {
    id: 'bc-astro-1', label: 'Astrographic · male/female dies', maker: 'Astrographic',
    params: { width: 51, stroke: 12, curve: 'stadium', tracking: 8, one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'curved', nine: 'curved', narrow: 0.6, wide: 1.2 },
    evidence: { status: 'specimen-matched', specimens: [page('1985-2001')], notes: `Earliest flag-base dies (e.g. LAA-044): condensed stadium-shaped digits. ${lettersNote}` },
  },
  {
    id: 'bc-astro-2', label: 'Astrographic · neoprene-top dies', maker: 'Astrographic',
    params: { width: 53, stroke: 13.5, curve: 'stadium', tracking: 8, one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'curved', nine: 'curved', narrow: 0.6, wide: 1.2 },
    evidence: { status: 'specimen-matched', specimens: [page('1985-2001')], notes: `Same shapes as male/female but softer and heavier in paint (e.g. PCG-969). ${lettersNote}` },
  },
  {
    id: 'bc-astro-3', label: 'Astrographic · non-passenger dies', maker: 'Astrographic',
    params: { width: 46, stroke: 14, curve: 'box', boxRadius: 18, tracking: 8, one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'straight', seven: 'straight', nine: 'straight', narrow: 0.62, wide: 1.2 },
    evidence: { status: 'specimen-matched', specimens: [page('1985-2001')], notes: `Non-passenger dies, also seen on a small N/P passenger block (e.g. NJB-300): squarer bowls and heavy strokes. ${lettersNote}` },
  },
  {
    id: 'bc-astro-4', label: 'Astrographic · Classic dies', maker: 'Astrographic',
    params: { width: 52, stroke: 11.5, curve: 'stadium', tracking: 8, one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'curved', nine: 'curved', narrow: 0.58, wide: 1.2 },
    evidence: { status: 'specimen-matched', specimens: [page('1985-2001')], notes: `Classic dies used for the rest of the contract (e.g. NPN-030): narrow and light. ${lettersNote}` },
  },
  {
    id: 'bc-waldale', label: 'Waldale', maker: 'Waldale',
    params: { width: 53, stroke: 11, curve: 'oval', glyphCurve: { '0': 'stadium', P: 'box' }, boxRadius: 16, tracking: 8, one: 'short-flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'bent', nine: 'curved', a: 'flat', j: 'spur', narrow: 0.58, wide: 1.2 },
    evidence: { status: 'specimen-matched', specimens: [page('2001-2014'), page('2014-2025')],
      notes: `Thinner, crisper strokes than Astrographic; narrow oval bowls with a straight-sided 0, a bent 7 and a short-flagged 1. Letters checked on 098 SJF, 976 SKP and JA7 91L: rounded-rectangle P bowl, spurred J, flat-topped A. The 7's bend and the letter details are set by eye, not fitted. ${lettersNote}` },
  },
];

const byId = new Map(DIE_PROFILES.map((p) => [p.id, p]));
/** Lets family modules add their own profiles (e.g. small-format motorcycle dies) without editing this list. */
export function registerDieProfile(...profiles: DieProfile[]): void {
  for (const p of profiles) {
    if (byId.has(p.id) && byId.get(p.id) !== p) throw new Error(`Duplicate die profile id ${p.id}`);
    byId.set(p.id, p);
  }
}
export const allDieProfiles = (): DieProfile[] => [...byId.values()];
export function dieProfile(id: string): DieProfile {
  const profile = byId.get(id);
  if (!profile) throw new RangeError(`Unknown die profile: ${id}`);
  return profile;
}
export const hasDieProfile = (id: string): boolean => byId.has(id);
