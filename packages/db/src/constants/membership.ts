import type { TValueOf } from '@shinefold/config/utils';

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

export const MEMBERSHIP_REMOVAL_OUTCOME = {
  REMOVED: 'REMOVED',
  NOT_FOUND: 'NOT_FOUND',
  LAST_OWNER: 'LAST_OWNER',
  SELF: 'SELF',
} as const;

export type TMembershipRemovalOutcome = TValueOf<
  typeof MEMBERSHIP_REMOVAL_OUTCOME
>;
