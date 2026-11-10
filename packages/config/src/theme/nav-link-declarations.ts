import { NAV_LINK_STYLE, type TNavLinkStyle } from '@blog/config/constants';

import { RADIUS_MD, RADIUS_PILL } from './radius-tokens';
import type { TThemeDeclarations } from './theme-declarations';

const NO_DECORATION = 'none';

const UNFILLED = {
  '--nav-link-fill': 'transparent',
  '--nav-link-radius': 'var(--radius-sm)',
  '--nav-link-padding-x': '0px',
  '--nav-link-padding-y': '0px',
} as const satisfies TThemeDeclarations;

const FILLED = {
  '--nav-link-fill': 'var(--brand-primary-muted)',
  '--nav-link-decoration': NO_DECORATION,
  '--nav-link-padding-x': '0.625rem',
  '--nav-link-padding-y': '0.25rem',
} as const satisfies TThemeDeclarations;

export const NAV_LINK_STYLE_DECLARATIONS: Record<
  TNavLinkStyle,
  TThemeDeclarations
> = {
  [NAV_LINK_STYLE.PLAIN]: {
    ...UNFILLED,
    '--nav-link-decoration': NO_DECORATION,
  },
  [NAV_LINK_STYLE.UNDERLINE]: {
    ...UNFILLED,
    '--nav-link-decoration': 'underline',
  },
  [NAV_LINK_STYLE.SOFT]: { ...FILLED, '--nav-link-radius': RADIUS_MD },
  [NAV_LINK_STYLE.PILL]: { ...FILLED, '--nav-link-radius': RADIUS_PILL },
};
