import type { TValueOf } from '@shinefold/config/utils';

export const ACCORDION_VARIANT = {
  LIST: 'LIST',
  ROW: 'ROW',
} as const;

export type TAccordionVariant = TValueOf<typeof ACCORDION_VARIANT>;
