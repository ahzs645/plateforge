/** Fixed 1886 / 1986 columns from the supplied Frankfurter Std Regular. */
import type {DieProfile} from './engine';
import glyphs from './frankfurter-centennial-years.json';
export const FRANKFURTER_CENTENNIAL_YEARS_PROFILE: DieProfile = {
  id: 'bc-frankfurter-centennial-years', label: 'Frankfurter Std Regular · Centennial years',
  maker: 'International Typeface Corporation',
  params: {width: 85, stroke: 0, curve: 'oval', tracking: 0},
  overrides: glyphs, allowConstructedFallback: false,
  evidence: {status: 'category', specimens: [{title: 'BCpl8s · Vancouver Centennial souvenir',
    url: 'https://www.bcpl8s.ca/images/Expo-86/City-Souvenir.jpg'}],
    notes: 'The fixed year columns use the supplied Regular outlines, retaining rounded terminals and native proportions. Visual match; historical font identity is unconfirmed. Copyright 1997 International Typeface Corporation. All rights reserved. No source font software is bundled.'},
};
