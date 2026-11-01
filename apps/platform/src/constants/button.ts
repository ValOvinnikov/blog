import type { TValueOf } from '@blog/config/utils';

export const BUTTON_VARIANT = {
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
  GHOST: 'GHOST',
  DANGER: 'DANGER',
  UNSTYLED: 'UNSTYLED',
  LINK: 'LINK',
} as const;

export type TButtonVariant = TValueOf<typeof BUTTON_VARIANT>;
