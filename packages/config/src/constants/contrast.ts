import type { TValueOf } from '@blog/config/utils';

export const COLOR_SCHEME = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
} as const;

export type TColorScheme = TValueOf<typeof COLOR_SCHEME>;

export const CONTRAST_ROLE = {
  TEXT: 'TEXT',
  LARGE_TEXT: 'LARGE_TEXT',
  UI_BOUNDARY: 'UI_BOUNDARY',
  FOCUS: 'FOCUS',
  DECORATIVE: 'DECORATIVE',
} as const;

export type TContrastRole = TValueOf<typeof CONTRAST_ROLE>;

export const CONTRAST_ROLE_MIN: Record<TContrastRole, number> = {
  [CONTRAST_ROLE.TEXT]: 4.5,
  [CONTRAST_ROLE.LARGE_TEXT]: 3,
  [CONTRAST_ROLE.UI_BOUNDARY]: 3,
  [CONTRAST_ROLE.FOCUS]: 3,
  [CONTRAST_ROLE.DECORATIVE]: 1,
};
