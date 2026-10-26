import 'server-only';

import { queries } from '@blog/db';
import { adminRoutes } from '@platform/utils/routes/routes';

import { getSession } from './auth';

export const resolveUserHomeHref = async (userId: string): Promise<string> => {
  const [admin, memberships] = await Promise.all([
    queries.admins.getAdminByUserId(userId),
    queries.memberships.listMembershipsWithTenantsForUser(userId),
  ]);

  if (admin) return adminRoutes.tenants();

  return memberships.length > 0
    ? adminRoutes.dashboard()
    : adminRoutes.onboarding();
};

/** Where a dead end links back to, without gating or redirecting the request itself. */
export const resolveHomeHref = async (): Promise<string> => {
  const session = await getSession();
  const userId = session?.user?.id;

  return userId ? resolveUserHomeHref(userId) : adminRoutes.signIn();
};
