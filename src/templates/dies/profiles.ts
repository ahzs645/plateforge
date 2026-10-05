/**
 * B.C. die profiles. Each profile's proportions and diagnostic digit shapes were
 * read from BCpl8s digit comparisons (0–9 photographed straight-on); letters use
 * the same construction and are therefore less certain than digits. These are
 * reconstructions for illustration, not recovered tooling.
 */
import type { DieProfile } from './engine';
import { FRANKFURTER_EXPO_PROFILE } from './frankfurter-expo';
import { FRANKFURTER_CENTENNIAL_YEARS_PROFILE } from './frankfurter-centennial-years';
import { ROYAL_1987_PROFILE } from './royal-1987';
import { ROYAL_1951_PROFILE } from './royal-1951';
import { APEC_SCREENED_LEGENDS_PROFILE } from './apec-screened-legends';
import { ROYAL_SCREENED_SLOGAN_PROFILE } from './royal-screened-slogan';
import { COMMERCIAL_1952_LEGEND, COMMERCIAL_1952_SERIAL, COMMERCIAL_1952_YEAR } from './commercial-1952';
import { PCMR_PROFILE, PCMR_COMPANY_PROFILE } from './pcmr';
import { researchVariant } from './research-dies';
import { BC_DATES, BC_LEGEND_SLANT, BC_LEGEND_SLIM, BC_LEGEND_STRAIGHT, BC_SLANT_1924, BC_SLIM_1936, BC_STRAIGHT_1928, BC_LEGEND_1940, BC_SERIAL_1940, BC_STRIP_1951, BC_TAB_1953, BC_LEGEND_1930, BC_THOMPSON_1930, BC_TIN_MACDONALD, BC_TIN_TACEY, BC_YEAR_1940, BC_YEAR_1952 } from './traced-1940';

const page = (period: string) => ({ title: `BCpl8s · Passenger ${period.replace('-', '–')}`, url: `https://www.bcpl8s.ca/Passenger-${period}.html` });
const lettersNote = 'Letters follow the same construction and were checked against plate photos only.';

export const DIE_PROFILES: readonly DieProfile[] = [
  FRANKFURTER_EXPO_PROFILE,
  FRANKFURTER_CENTENNIAL_YEARS_PROFILE,
  ROYAL_1987_PROFILE,
  ROYAL_1951_PROFILE,
  APEC_SCREENED_LEGENDS_PROFILE,
  ROYAL_SCREENED_SLOGAN_PROFILE,
  COMMERCIAL_1952_LEGEND,
  COMMERCIAL_1952_SERIAL,
  COMMERCIAL_1952_YEAR,
  PCMR_PROFILE,
  PCMR_COMPANY_PROFILE,
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
    id: 'bc-legend-1940', label: 'Legend · 1940–54 bold', params: { width: 64, stroke: 20, curve: 'stadium', tracking: 16, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.36, wide: 1.2 },
    // B R I T S H C O L U M A are traced from averaged photo samples; other letters and digits are constructed.
    overrides: BC_LEGEND_1940,
    evidence: { status: 'photo-averaged', specimens: [page('1940-1948'), page('1949-1951'), page('1952-1954')], notes: 'The BRITISH COLUMBIA letters are traced from the average of 76–227 samples each from 1940–54 plate photos. Bold caps with ordinary spacing, measured from photos: cap 20–21 mm, W/H about 0.65, stroke about 0.2, gaps 3–6 mm (1940 99·830, 1949 71·064, 1950 230·229, 1952 42-289). On long bases the gaps open up to fill the plate.' },
  },
  {
    id: 'bc-year-1940', label: 'Stacked year · 1940–51', params: { width: 42, stroke: 12, curve: 'stadium', tracking: 8, one: 'plain', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.6, wide: 1.2 },
    overrides: BC_YEAR_1940,
    evidence: { status: 'photo-averaged', specimens: [page('1940-1948'), page('1949-1951')], notes: 'Digits traced from averaged photo samples (4: 99, 0: 19, others 4–21). Stacked two-digit year at the right of 1940–51 bases: 32 mm digits, W/H about 0.4–0.5 (1940 99·830, 1950 230·229, 1951 217·639).' },
  },
  {
    id: 'bc-strip-1951', label: 'Legend · 1951 renewal strip', params: { width: 65, stroke: 17, curve: 'stadium', tracking: 21, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.32, wide: 1.25, dot: 'round' },
    overrides: BC_STRIP_1951,
    evidence: { status: 'photo-averaged', specimens: [page('1949-1951')], notes: 'Letters and 51 traced from two high-resolution strip photos (smoothed); dots constructed. BRITISH·51·COLUMBIA on the blue-on-white strip, measured from 1951 217·639 and loose long/short strips: 21 mm caps (about 58% of the 36 mm strip), W/H about 0.65, stroke about 0.17, 4.5 mm letter gaps, round raised dots; the 51 is a slightly smaller die set about 4 mm higher.' },
  },
  {
    id: 'bc-year-1952', label: '1952 base year', params: { width: 63, stroke: 18, curve: 'stadium', tracking: 12, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.5, wide: 1.2 },
    overrides: BC_YEAR_1952,
    evidence: { status: 'photo-averaged', specimens: [page('1952-1954')], notes: 'The 52 at the top right of the 1952 base, traced from 34 averaged samples per digit (W/H about 0.63).' },
  },
  {
    id: 'bc-tab-1953', label: '1953/54 tab year', params: { width: 61, stroke: 13, curve: 'stadium', tracking: 10, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.5, wide: 1.2 },
    overrides: BC_TAB_1953,
    evidence: { status: 'photo-averaged', specimens: [page('1952-1954')], notes: '5, 3 and 4 traced from averaged tab photos (3–7 samples). Year pair on the 1953/54 renewal tabs: 32.5 mm digits, W/H about 0.6, light stroke about 0.13 (1953 148879 and loose tab, 1954 306142 and loose tab).' },
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
    id: 'bc-tin-macdonald', label: '1915–16 tin numerals (MacDonald)', maker: 'MacDonald Manufacturing',
    params: { width: 34, stroke: 12, curve: 'box', boxRadius: 7, tracking: 8, one: 'plain', two: 'curved', three: 'round', four: 'closed', six: 'straight', seven: 'straight', nine: 'straight', narrow: 0.4, wide: 1.2 },
    overrides: BC_TIN_MACDONALD,
    evidence: { status: 'photo-averaged', specimens: [page('1915-1917')], notes: 'Very condensed lithographed numerals (W/H about 0.33), traced from averaged photos of 1915 and 1916 plates up to No. 9,000.' },
  },
  {
    id: 'bc-tin-tacey', label: '1916 over-run and 1917 tin numerals (Tacey)', maker: 'J.R. Tacey & Sons',
    params: { width: 48, stroke: 17, curve: 'box', boxRadius: 7, tracking: 8, one: 'flag-base', two: 'curved', three: 'round', four: 'closed', six: 'straight', seven: 'straight', nine: 'straight', narrow: 0.4, wide: 1.2 },
    overrides: BC_TIN_TACEY,
    evidence: { status: 'photo-averaged', specimens: [page('1915-1917')], notes: 'Wider, heavier numerals (W/H about 0.48) from the late-1916 over-run and 1917 plates, traced from averaged photos.' },
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
    overrides: BC_SLANT_1924,
    evidence: { status: 'photo-averaged', specimens: [page('1924-1929'), page('1931-1935')], notes: 'Traced from averaged photos of 1924–27 and 1931–32 plates (4–15 samples per digit). Slanted rounded numerals used 1924–27 and again in 1931 (1924 25-610).' },
  },
  {
    id: 'bc-straight-1928', label: '1928–30, 1933–35 straight dies',
    params: { width: 46, stroke: 14, curve: 'stadium', tracking: 9, one: 'flag-base', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.62, wide: 1.2, dash: { width: 14 } },
    overrides: BC_STRAIGHT_1928,
    evidence: { status: 'photo-averaged', specimens: [page('1924-1929'), page('1931-1935')], notes: 'Traced from averaged photos of 1928–29 and 1933–35 plates (6–15 samples per digit). Straighter upright numerals introduced in 1928 (1929 41-311).' },
  },
  {
    id: 'bc-thompson-1930', label: '1930 one-year dies (Thompson)', maker: 'Thompson Heating & Ventilating',
    params: { width: 49, stroke: 16, curve: 'stadium', tracking: 6, one: 'plain', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.4, wide: 1.2 },
    overrides: BC_THOMPSON_1930,
    evidence: { status: 'photo-averaged', specimens: [page('1930')], notes: 'Dies used only in 1930 (BCpl8s: "one-and-done"), traced from averaged 1930 passenger and doctor plates (1–6 samples per digit). The committed 8 is synthesized from the traced 3 and its mirror image. A newly located photograph of 1930 48·244 supports a separate source-led research candidate; production geometry is unchanged.' },
  },
  {
    id: 'bc-legend-1930', label: 'Legend · 1930 (Thompson)', maker: 'Thompson Heating & Ventilating',
    params: { width: 77, stroke: 17, curve: 'stadium', tracking: 12, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.22, wide: 1.3 },
    overrides: BC_LEGEND_1930,
    evidence: { status: 'photo-averaged', specimens: [page('1930')], notes: 'Wide BRITISH COLUMBIA letters (W/H about 0.77), traced from six 1930 plates.' },
  },
  {
    id: 'bc-tacey-1936', label: '1936–39 slanted dies',
    params: { width: 50, stroke: 13, curve: 'oval', tracking: 9, one: 'flag-base', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.62, wide: 1.2, dash: { width: 14 } },
    slant: 4,
    overrides: BC_SLIM_1936,
    evidence: { status: 'photo-averaged', specimens: [page('1936-1939')], notes: 'Traced from averaged photos of 1936–39 plates (3–19 samples per digit). Slanted Tacey-style dies with an oval 0; the 1938 dies were made to match 1937 (1937 -2-200).' },
  },
  {
    id: 'bc-legend-1924', label: 'Legend · 1924–39', params: { width: 66, stroke: 14, curve: 'stadium', tracking: 9, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.5, wide: 1.2 },
    overrides: BC_LEGEND_SLANT,
    evidence: { status: 'photo-averaged', specimens: [page('1924-1929'), page('1936-1939')], notes: 'Letters traced from 1924–27 and 1931–32 plates (19 samples each). Bold condensed BRITISH COLUMBIA legend spanning the lower edge.' },
  },
  {
    id: 'bc-legend-1928', label: 'Legend · 1928–29, 1933–35', params: { width: 70, stroke: 17, curve: 'stadium', tracking: 9, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.3, wide: 1.25 },
    overrides: BC_LEGEND_STRAIGHT,
    evidence: { status: 'photo-averaged', specimens: [page('1924-1929'), page('1931-1935')], notes: 'BRITISH COLUMBIA on the straight-die years, traced from averaged photos (16 samples per letter).' },
  },
  {
    id: 'bc-legend-1936', label: 'Legend · 1936–39 slimline', params: { width: 66, stroke: 17, curve: 'stadium', tracking: 9, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.3, wide: 1.2 },
    overrides: BC_LEGEND_SLIM,
    evidence: { status: 'photo-averaged', specimens: [page('1936-1939')], notes: 'BRITISH COLUMBIA on the 1936–39 slimline plates, traced from averaged photos (12 samples per letter).' },
  },
  {
    id: 'bc-early-1940', label: 'Early rounded dies (1940–54)',
    params: { width: 55, stroke: 14.5, curve: 'stadium', tracking: 11, one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'curved', nine: 'curved', narrow: 0.6, wide: 1.2, dash: { width: 4, weight: 17, y: 51 }, dot: 'round' },
    // Digits and A, B, F are traced from averaged photo samples; other letters fall back to the construction above.
    overrides: BC_SERIAL_1940,
    evidence: { status: 'photo-averaged', specimens: [page('1940-1948'), page('1949-1951'), page('1952-1954')], notes: 'Digits traced from the average of 32–64 labelled samples each from 1940–51 plate photos (A, B, F from 7–15 samples; other letters constructed). Bold, fairly wide rounded numerals measured from gallery photos: cap about 71 mm, W/H about 0.55, stroke about 0.145, gaps about 7.5 mm (1940 99·830, 1950 230·229, 1951 217·639, 1952 42-289). 1940–51 bases use an 11 mm raised round dot between the groups; the 1952 base a short, thick 14 × 12 mm dash. BCpl8s has no digit comparison for these years.' },
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
  // 1924–39 date stamps: each year's two date digits were separate small dies, traced per year from photos.
  ...Object.entries(BC_DATES).map(([year, glyphs]): DieProfile => ({
    id: `bc-date-${year}`, label: `${year} date stamp`,
    params: { width: 55, stroke: 15, curve: 'stadium', tracking: 8, one: 'plain', three: 'round', four: 'closed', seven: 'straight', narrow: 0.45, wide: 1.2, dash: { width: 22 } },
    overrides: glyphs,
    evidence: { status: 'photo-averaged', specimens: [page(Number(year) <= 1929 ? '1924-1929' : Number(year) === 1930 ? '1930' : Number(year) <= 1935 ? '1931-1935' : '1936-1939')],
      notes: `The ${year} date digits, traced from averaged photos of that year's plates; they differ from the serial dies.` },
  })),
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
/** The die for `id`; inside a plate render with research dies on, its research variant for that format. */
export function dieProfile(id: string): DieProfile {
  const profile = byId.get(id);
  if (!profile) throw new RangeError(`Unknown die profile: ${id}`);
  return researchVariant(profile);
}
export const hasDieProfile = (id: string): boolean => byId.has(id);
