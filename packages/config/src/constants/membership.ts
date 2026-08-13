import type { TValueOf } from '@blog/config/utils';

export const MEMBERSHIP_ROLE = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  READER: 'READER',
} as const;

export type TMembershipRole = TValueOf<typeof MEMBERSHIP_ROLE>;
