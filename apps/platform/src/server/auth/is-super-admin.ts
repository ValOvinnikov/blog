import type { TNullable } from '@shinefold/config/types';
import { ADMIN_ROLE } from '@shinefold/db/constants';
import type { TAdmin } from '@shinefold/db/schema/admins';

export const isSuperAdmin = (admin: TNullable<Pick<TAdmin, 'role'>>): boolean =>
  admin?.role === ADMIN_ROLE.SUPERADMIN;
