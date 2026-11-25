import type { TValueOf } from '@shinefold/config/utils';

export const COLOR_MODE = {
  READER: 'READER',
  LIGHT: 'LIGHT',
  DARK: 'DARK',
} as const;

export type TColorMode = TValueOf<typeof COLOR_MODE>;
