import type { TValueOf } from '@blog/config/utils';

export const CARD_STYLE = {
  ACCENT_BAR: 'ACCENT_BAR',
  OUTLINED: 'OUTLINED',
  FILLED: 'FILLED',
  RAISED: 'RAISED',
  PLAIN: 'PLAIN',
} as const;

export type TCardStyle = TValueOf<typeof CARD_STYLE>;

export const CARD_STYLE_LABEL: Record<TCardStyle, string> = {
  [CARD_STYLE.ACCENT_BAR]: 'Accent bar',
  [CARD_STYLE.OUTLINED]: 'Outlined',
  [CARD_STYLE.FILLED]: 'Filled',
  [CARD_STYLE.RAISED]: 'Raised',
  [CARD_STYLE.PLAIN]: 'Plain',
};
