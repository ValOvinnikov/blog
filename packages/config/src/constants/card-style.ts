import type { TValueOf } from '@blog/config/utils';

export const CARD_STYLE = {
  ACCENT_BAR: 'ACCENT_BAR',
  OUTLINED: 'OUTLINED',
} as const;

export type TCardStyle = TValueOf<typeof CARD_STYLE>;
