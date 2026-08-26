import 'server-only';

import { adminRoutes } from '@admin/utils/routes/routes';
import { queries } from '@blog/db';
import type { TAdmin } from '@blog/db/schema/admins';
import { redirect } from 'next/navigation';

import { auth } from './auth';

/**
 * The Platform-section gate: no session redirects to sign-in, a session with
 * no `admins` row redirects to `/unauthorized`. Called from a layout (not a
 * page) so every route nested under a gated segment is protected by existing
 * there, never by a per-page check someone could forget to add.
 *
 * Also the floor for tenant actions that only edit in-app state (creating or
 * updating a tenant's details) — any admin role can reverse those. Actions
 * that are irreversible or reach outside this app require `requireSuperAdmin`.
 */
export const requireAdmin = async (): Promise<TAdmin> => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(adminRoutes.signIn());
  }

  const admin = await queries.admins.getAdminByUserId(userId);

  if (!admin) {
    redirect(adminRoutes.unauthorized());
  }

  return admin;
};
