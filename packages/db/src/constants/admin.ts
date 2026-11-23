import type { TValueOf } from '@shinefold/config/utils';

export const ADMIN_ROLE = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const;

export type TAdminRole = TValueOf<typeof ADMIN_ROLE>;

export const GRANTED_VIA = {
  BREAK_GLASS: 'BREAK_GLASS',
  PROMOTION: 'PROMOTION',
  INVITE: 'INVITE',
} as const;

export type TGrantedVia = TValueOf<typeof GRANTED_VIA>;

export const ADMIN_INVITE_LIFETIME_DAYS = 7;

export const ADMIN_INVITE_OUTCOME = {
  INVITED: 'INVITED',
  ALREADY_ADMIN: 'ALREADY_ADMIN',
} as const;

export const ADMIN_REMOVAL_OUTCOME = {
  REMOVED: 'REMOVED',
  NOT_FOUND: 'NOT_FOUND',
  LAST_SUPERADMIN: 'LAST_SUPERADMIN',
} as const;

export type TAdminRemovalOutcome = TValueOf<typeof ADMIN_REMOVAL_OUTCOME>;
