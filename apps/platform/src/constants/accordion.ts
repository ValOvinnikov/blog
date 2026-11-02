import type { TValueOf } from '@blog/config/utils';

export const ACCORDION_VARIANT = {
  LIST: 'LIST',
  ROW: 'ROW',
} as const;

export type TAccordionVariant = TValueOf<typeof ACCORDION_VARIANT>;
