import type { TValueOf } from '@blog/config/utils';

export const LEAD_REFUSAL = {
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type TLeadRefusal = TValueOf<typeof LEAD_REFUSAL>;
