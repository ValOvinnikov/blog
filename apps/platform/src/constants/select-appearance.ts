import type { TValueOf } from '@blog/config/utils';
import { FIELD_APPEARANCE } from '@platform/constants/field-appearance';

export const SELECT_APPEARANCE = {
  ...FIELD_APPEARANCE,
  COMPACT: 'COMPACT',
} as const;

export type TSelectAppearance = TValueOf<typeof SELECT_APPEARANCE>;
