import 'server-only';

import { queries } from '@blog/db';
import { adminRoutes } from '@platform/utils/routes/routes';

import { getSession } from './auth';

/** Where a dead end links back to, without gating or redirecting the request itself. */
export const resolveHomeHref = async (): Promise<string> => {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return adminRoutes.signIn();
  }

  const admin = await queries.admins.getAdminByUserId(userId);

  return admin ? adminRoutes.tenants() : adminRoutes.dashboard();
};
