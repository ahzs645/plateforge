/** Six fixed souvenir glyphs from the user-supplied Frankfurter Std Regular.
 * Font advances, curves and overshoots are preserved at cap height 100.
 * The source font file is not bundled; this profile has no invented fallback. */
import type {DieProfile} from './engine';
import glyphs from './frankfurter-expo.json';
export const FRANKFURTER_EXPO_PROFILE: DieProfile = {
  id: 'bc-frankfurter-expo', label: 'Frankfurter Std Regular · EXPO 86 souvenir',
  maker: 'International Typeface Corporation',
  params: {width: 85, stroke: 0, curve: 'oval', tracking: 0},
  overrides: glyphs, allowConstructedFallback: false,
  evidence: {status: 'category', specimens: [{title: 'BCpl8s · EXPO 86 retail souvenir',
    url: 'https://www.bcpl8s.ca/images/Expo-86/Expo86-Souvenir(mid).jpg'}],
    notes: 'Uses the supplied Frankfurter Std Regular outlines for the fixed EXPO 86 wordmark. Visual match; original plate typography is not independently documented. Copyright 1997 International Typeface Corporation. All rights reserved. No source font software is distributed.'},
};
