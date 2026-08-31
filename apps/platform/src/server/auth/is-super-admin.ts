import 'server-only';

import { queries } from '@blog/db';
import { ADMIN_ROLE } from '@blog/db/constants';

/**
 * A platform SUPERADMIN bypasses every per-tenant `memberships` check in
 * this app — ADMIN/MODERATOR do not, so this is deliberately narrower than
 * `requireAdmin`'s "has an admins row at all" check.
 */
export const isSuperAdmin = async (userId: string): Promise<boolean> => {
  const admin = await queries.admins.getAdminByUserId(userId);

  return admin?.role === ADMIN_ROLE.SUPERADMIN;
};
