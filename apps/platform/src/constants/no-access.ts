import type { TValueOf } from '@shinefold/config/utils';

export const NO_ACCESS_REASON = {
  SITE: 'SITE',
  SITE_INVITE: 'SITE_INVITE',
  ADMIN_INVITE: 'ADMIN_INVITE',
} as const;

export type TNoAccessReason = TValueOf<typeof NO_ACCESS_REASON>;

export const NO_ACCESS_REASONS = Object.values(NO_ACCESS_REASON);

export const NO_ACCESS_SEARCH_PARAM = {
  REASON: 'reason',
} as const;
