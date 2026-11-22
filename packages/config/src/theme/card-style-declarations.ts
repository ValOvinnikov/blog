import { CARD_STYLE, type TCardStyle } from '@shinefold/config/constants';

import { RADIUS_MD } from './radius-tokens';
import type { TThemeDeclarations } from './theme-declarations';

const NO_WIDTH = '0px';
const HAIRLINE = '1px';
const NONE = 'none';
const NONE_OF = '0%';
export const ALL_OF = '100%';
const STACK_GAP = '0.75rem';

const FRAMED_BASE = {
  '--item-radius': RADIUS_MD,
  '--item-shadow': NONE,
  '--item-fill-mix': NONE_OF,
  '--item-clear-mix': NONE_OF,
  '--item-card-hover-mix': NONE_OF,
  '--item-card-hover-edge': 'transparent',
  '--item-divider-width': NO_WIDTH,
  '--item-accent-brand-share': NONE_OF,
  '--item-stack-gap': STACK_GAP,
  '--item-stack-radius': RADIUS_MD,
} as const satisfies TThemeDeclarations;

const OUTLINE = {
  '--item-border-width': HAIRLINE,
  '--item-accent-width': HAIRLINE,
} as const satisfies TThemeDeclarations;

const NO_OUTLINE = {
  '--item-border-width': NO_WIDTH,
  '--item-accent-width': NO_WIDTH,
} as const satisfies TThemeDeclarations;

export const CARD_STYLE_DECLARATIONS: Record<TCardStyle, TThemeDeclarations> = {
  [CARD_STYLE.ACCENT_BAR]: {
    ...FRAMED_BASE,
    '--item-border-width': NO_WIDTH,
    '--item-accent-width': '2px',
    '--item-accent-brand-share': ALL_OF,
  },
  [CARD_STYLE.OUTLINED]: { ...FRAMED_BASE, ...OUTLINE },
  [CARD_STYLE.FILLED]: {
    ...FRAMED_BASE,
    ...NO_OUTLINE,
    '--item-fill-mix': ALL_OF,
    '--item-card-hover-mix': ALL_OF,
    '--item-card-hover-edge': 'var(--border-strong)',
  },
  [CARD_STYLE.RAISED]: {
    ...FRAMED_BASE,
    ...OUTLINE,
    '--item-shadow': 'var(--shadow-card)',
  },
  [CARD_STYLE.PLAIN]: {
    ...FRAMED_BASE,
    ...NO_OUTLINE,
    '--item-clear-mix': ALL_OF,
    '--item-divider-width': HAIRLINE,
    '--item-stack-gap': NO_WIDTH,
    '--item-stack-radius': NO_WIDTH,
  },
};
