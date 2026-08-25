import 'server-only';

import { adminRoutes } from '@admin/utils/routes/routes';
import { ADMIN_ROLE } from '@blog/db';
import type { TAdmin } from '@blog/db/schema/admins';
import { redirect } from 'next/navigation';

import { requireAdmin } from './require-admin';

/**
 * The gate for destructive platform actions: same session/`admins` checks as
 * `requireAdmin`, plus a role check — anything short of SUPERADMIN redirects
 * to `/unauthorized`, since `ADMIN`/`MODERATOR` are lesser platform roles,
 * not synonyms for it.
 */
export const requireSuperAdmin = async (): Promise<TAdmin> => {
  const admin = await requireAdmin();

  if (admin.role !== ADMIN_ROLE.SUPERADMIN) {
    redirect(adminRoutes.unauthorized());
  }

  return admin;
};
