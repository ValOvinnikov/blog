import type { TValueOf } from '@blog/config/utils';

export const MEMBERSHIP_ROLE = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  READER: 'READER',
} as const;

export type TMembershipRole = TValueOf<typeof MEMBERSHIP_ROLE>;

export const MEMBERSHIP_INVITE_OUTCOME = {
  CREATED: 'CREATED',
  ALREADY_PENDING: 'ALREADY_PENDING',
  ALREADY_CONSUMED: 'ALREADY_CONSUMED',
  SEAT_LIMIT: 'SEAT_LIMIT',
} as const;
