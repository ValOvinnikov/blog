import 'server-only';

import type { TAdmin } from '@shinefold/db/schema/admins';
import { notFound } from 'next/navigation';

import { isSuperAdmin } from './is-super-admin';
import { requireAdmin } from './require-admin';

/** Admits only a SUPERADMIN; any other role 404s. */
export const requireSuperAdmin = async (): Promise<TAdmin> => {
  const admin = await requireAdmin();

  if (!isSuperAdmin(admin)) {
    notFound();
  }

  return admin;
};
