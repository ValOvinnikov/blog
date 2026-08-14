import type { TValueOf } from '@blog/config/utils';

export const ADMIN_ROLE = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const;

export type TAdminRole = TValueOf<typeof ADMIN_ROLE>;

export const GRANTED_VIA = {
  BREAK_GLASS: 'BREAK_GLASS',
  PROMOTION: 'PROMOTION',
} as const;

export type TGrantedVia = TValueOf<typeof GRANTED_VIA>;
