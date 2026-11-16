import { FIELD_APPEARANCE } from '@platform/constants/field-appearance';
import type { TValueOf } from '@shinefold/config/utils';

export const SELECT_APPEARANCE = {
  ...FIELD_APPEARANCE,
  COMPACT: 'COMPACT',
} as const;

export type TSelectAppearance = TValueOf<typeof SELECT_APPEARANCE>;
