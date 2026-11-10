import { NAV_LINK_STYLE, type TNavLinkStyle } from '@blog/config/constants';

import { RADIUS_MD, RADIUS_PILL } from './radius-tokens';
import type { TThemeDeclarations } from './theme-declarations';

const NONE = 'none';
const TRANSPARENT = 'transparent';

const UNPADDED = {
  '--nav-link-fill': TRANSPARENT,
  '--nav-link-outline': TRANSPARENT,
  '--nav-link-radius': 'var(--radius-sm)',
  '--nav-link-padding-x': '0px',
  '--nav-link-padding-y': '0px',
} as const satisfies TThemeDeclarations;

const PADDED = {
  '--nav-link-decoration': NONE,
  '--nav-link-padding-x': '0.625rem',
  '--nav-link-padding-y': '0.25rem',
} as const satisfies TThemeDeclarations;

export const NAV_LINK_STYLE_DECLARATIONS: Record<
  TNavLinkStyle,
  TThemeDeclarations
> = {
  [NAV_LINK_STYLE.PLAIN]: { ...UNPADDED, '--nav-link-decoration': NONE },
  [NAV_LINK_STYLE.UNDERLINE]: {
    ...UNPADDED,
    '--nav-link-decoration': 'underline',
  },
  [NAV_LINK_STYLE.SOFT]: {
    ...PADDED,
    '--nav-link-fill': 'var(--brand-primary-muted)',
    '--nav-link-outline': TRANSPARENT,
    '--nav-link-radius': RADIUS_MD,
  },
  [NAV_LINK_STYLE.PILL]: {
    ...PADDED,
    '--nav-link-fill': TRANSPARENT,
    '--nav-link-outline': 'currentColor',
    '--nav-link-radius': RADIUS_PILL,
  },
};
