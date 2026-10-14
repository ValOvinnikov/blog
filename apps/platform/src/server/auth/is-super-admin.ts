import 'server-only';

import { queries } from '@blog/db';
import { ADMIN_ROLE } from '@blog/db/constants';

/** Narrower than `requireTenantMembership`, which admits any `admins` row: only a SUPERADMIN passes. */
export const isSuperAdmin = async (userId: string): Promise<boolean> => {
  const admin = await queries.admins.getAdminByUserId(userId);

  return admin?.role === ADMIN_ROLE.SUPERADMIN;
};
