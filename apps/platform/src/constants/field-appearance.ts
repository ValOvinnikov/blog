import type { TValueOf } from '@shinefold/config/utils';

export const FIELD_APPEARANCE = {
  DEFAULT: 'DEFAULT',
  WIZARD: 'WIZARD',
} as const;

export type TFieldAppearance = TValueOf<typeof FIELD_APPEARANCE>;
