import 'server-only';

import type { TAdmin } from '@shinefold/db/schema/admins';
import { notFound } from 'next/navigation';

import { isSuperAdmin } from './is-super-admin';
import { requireAdmin } from './require-admin';

/** Gates actions only a SUPERADMIN may take, such as deprovisioning a tenant or granting it an entitlement; any lesser role 404s. */
export const requireSuperAdmin = async (): Promise<TAdmin> => {
  const admin = await requireAdmin();

  if (!isSuperAdmin(admin)) {
    notFound();
  }

  return admin;
};
