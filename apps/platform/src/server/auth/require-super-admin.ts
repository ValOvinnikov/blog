import 'server-only';

import type { TAdmin } from '@blog/db/schema/admins';
import { notFound } from 'next/navigation';

import { isSuperAdmin } from './is-super-admin';
import { requireAdmin } from './require-admin';

/**
 * The gate for destructive platform actions: same session/`admins` checks as
 * `requireAdmin`, plus a role check — anything short of SUPERADMIN 404s,
 * since `ADMIN`/`MODERATOR` are lesser platform roles, not synonyms for it.
 * Reserved for actions that are irreversible or trigger external side
 * effects — provisioning retries, deprovisioning, tenant deletion — where a
 * wrong call can't be undone with another edit.
 */
export const requireSuperAdmin = async (): Promise<TAdmin> => {
  const admin = await requireAdmin();

  if (!isSuperAdmin(admin)) {
    notFound();
  }

  return admin;
};
