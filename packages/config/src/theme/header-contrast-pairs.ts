import { CONTRAST_ROLE } from '@blog/config/constants';

import type { TContrastPair, TThemeToken } from './contrast-pairs';

const TEXT = '--text' satisfies TThemeToken;
const BRAND_PRIMARY = '--brand-primary' satisfies TThemeToken;
const HEADER_CONTROL_FILL = '--header-control-fill' satisfies TThemeToken;
const BRAND_PRIMARY_HOVER = '--brand-primary-hover' satisfies TThemeToken;
const NAV_LINK_FILL = '--nav-link-fill' satisfies TThemeToken;

export const HEADER_CONTRAST_PAIRS = {
  HEADER_CONTROL_TEXT: {
    foreground: TEXT,
    surfaces: [HEADER_CONTROL_FILL],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  HEADER_CONTROL_BRAND: {
    foreground: BRAND_PRIMARY,
    surfaces: [HEADER_CONTROL_FILL],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  NAV_LINK_TEXT: {
    foreground: TEXT,
    surfaces: [NAV_LINK_FILL],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  NAV_LINK_CURRENT: {
    foreground: BRAND_PRIMARY,
    surfaces: [NAV_LINK_FILL],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  NAV_LINK_CURRENT_HOVER: {
    foreground: BRAND_PRIMARY_HOVER,
    surfaces: [NAV_LINK_FILL],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  NAV_LINK_OUTLINE: {
    foreground: '--nav-link-outline',
    surfaces: ['--primary'],
    role: CONTRAST_ROLE.UI_BOUNDARY,
    followsAccentHue: true,
  },
} as const satisfies Record<string, TContrastPair>;
