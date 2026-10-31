import type { TValueOf } from '@blog/config/utils';

export const BUTTON_VARIANT = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  GHOST: 'ghost',
  DANGER: 'danger',
  UNSTYLED: 'unstyled',
} as const;

export type TButtonVariant = TValueOf<typeof BUTTON_VARIANT>;
