import type {DieProfile} from './engine';
import glyphs from './collector-harrington.json';

/** Fixed screened words, kept independent of the embossed serial alphabet. */
export const COLLECTOR_HARRINGTON_PROFILE: DieProfile = {
  id: 'bc-harrington-collector', label: 'Harrington Regular · collector inscriptions',
  maker: 'The Font Bureau, Inc.',
  params: {width: 70, stroke: 0, curve: 'oval', tracking: 0},
  overrides: glyphs, allowConstructedFallback: false, allowResearchReplacement: false,
  evidence: {status: 'legend-approximation', specimens: [
    {title: 'BCpl8s · original Astrographic collector sample', url: 'https://www.bcpl8s.ca/images/Collector/1990-B00000.jpg'},
    {title: 'BCpl8s · dual-well collector B31~865', url: 'https://www.bcpl8s.ca/images/Collector/2015-B31865.jpg'},
  ], notes: 'Collector, British and Columbia use the supplied Harrington Regular version 1.10 outlines with native advances and proportions. Plain and Regular uploads were compared; Regular has the closer light stroke. This identifies the font used in this reproduction, not recovered plate-printing masters. Copyright 1992 The Font Bureau, Inc.; portions copyright 1992 Microsoft Corp. No source font software is bundled.'},
};
