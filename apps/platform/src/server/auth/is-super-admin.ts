import type { TNullable } from '@blog/config/types';
import { ADMIN_ROLE } from '@blog/db/constants';
import type { TAdmin } from '@blog/db/schema/admins';

export const isSuperAdmin = (admin: TNullable<Pick<TAdmin, 'role'>>): boolean =>
  admin?.role === ADMIN_ROLE.SUPERADMIN;
