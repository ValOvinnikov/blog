import type { TValueOf } from '@blog/config/utils';

export const CARD_STYLE = {
  ACCENT_BAR: 'ACCENT_BAR',
  OUTLINED: 'OUTLINED',
  FILLED: 'FILLED',
  RAISED: 'RAISED',
  PLAIN: 'PLAIN',
} as const;

export type TCardStyle = TValueOf<typeof CARD_STYLE>;
