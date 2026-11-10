import { CARD_STYLE, type TCardStyle } from '@blog/config/constants';

import { RADIUS_MD } from './radius-tokens';
import type { TThemeDeclarations } from './theme-declarations';

const NO_WIDTH = '0px';
const HAIRLINE = '1px';
const NONE = 'none';
const SURFACE_ONLY = '0%';

export const CARD_STYLE_DECLARATIONS: Record<TCardStyle, TThemeDeclarations> = {
  [CARD_STYLE.ACCENT_BAR]: {
    '--item-radius': RADIUS_MD,
    '--item-border-width': NO_WIDTH,
    '--item-accent-width': '2px',
    '--item-accent-color': 'var(--brand-primary)',
    '--item-shadow': NONE,
    '--item-fill-mix': SURFACE_ONLY,
    '--item-divider-width': NO_WIDTH,
  },
  [CARD_STYLE.OUTLINED]: {
    '--item-radius': RADIUS_MD,
    '--item-border-width': HAIRLINE,
    '--item-accent-width': HAIRLINE,
    '--item-accent-color': 'var(--border)',
    '--item-shadow': NONE,
    '--item-fill-mix': SURFACE_ONLY,
    '--item-divider-width': NO_WIDTH,
  },
};
