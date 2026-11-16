import {
  HEADING_CASE,
  HEADING_WEIGHT,
  type THeadingCase,
  type THeadingWeight,
} from '@shinefold/config/constants';

import type { TThemeDeclarations } from './theme-declarations';

const UPPERCASE_TRACKING = '0.02em';

export const HEADING_WEIGHT_DECLARATIONS: Record<
  THeadingWeight,
  TThemeDeclarations
> = {
  [HEADING_WEIGHT.REGULAR]: { '--font-weight-heading': '400' },
  [HEADING_WEIGHT.MEDIUM]: { '--font-weight-heading': '500' },
  [HEADING_WEIGHT.SEMIBOLD]: { '--font-weight-heading': '600' },
  [HEADING_WEIGHT.BOLD]: { '--font-weight-heading': '700' },
};

export const HEADING_CASE_DECLARATIONS: Record<
  THeadingCase,
  TThemeDeclarations
> = {
  [HEADING_CASE.AS_WRITTEN]: {
    '--heading-case': 'none',
    '--text-hero--letter-spacing': '-0.025em',
    '--text-post-title--letter-spacing': '-0.02em',
    '--text-title-2xl--letter-spacing': '-0.02em',
    '--text-title-section--letter-spacing': '-0.02em',
  },
  [HEADING_CASE.UPPERCASE]: {
    '--heading-case': 'uppercase',
    '--text-hero--letter-spacing': UPPERCASE_TRACKING,
    '--text-post-title--letter-spacing': UPPERCASE_TRACKING,
    '--text-title-2xl--letter-spacing': UPPERCASE_TRACKING,
    '--text-title-section--letter-spacing': UPPERCASE_TRACKING,
  },
};
