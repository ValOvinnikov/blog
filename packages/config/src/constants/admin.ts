import type { TValueOf } from '@blog/config/utils';

export const ADMIN_ROLE = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const;

export type TAdminRole = TValueOf<typeof ADMIN_ROLE>;
