import 'server-only';

import { adminRoutes } from '@admin/utils/routes/routes';
import { queries } from '@blog/db';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { redirect } from 'next/navigation';

import { auth } from './auth';
import { buildSuperAdminMembership } from './build-super-admin-membership';
import { isSuperAdmin } from './is-super-admin';

export type TSessionTenants = {
  userId: string;
  memberships: TMembership[];
  tenants: TTenant[];
};

/**
 * The slug-free dashboard's shared first step: who's signed in, and every
 * tenant their `memberships` rows grant access to. Redirects to sign-in with
 * no session, or `/unauthorized` with zero memberships — the same two
 * outcomes `requireTenantMembership` and `requireAdmin` short-circuit on. A
 * platform SUPERADMIN instead resolves against every tenant in the system
 * (virtual OWNER-level memberships), regardless of their own real
 * `memberships` row count. `resolveDashboardTenant` narrows this further to
 * exactly one tenant; the `/dashboard/select-tenant` picker page calls this
 * directly since it needs to render on the membership count itself, before
 * any tenant is chosen.
 */
export const listSessionTenants = async (): Promise<TSessionTenants> => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(adminRoutes.signIn());
  }

  if (await isSuperAdmin(userId)) {
    const tenants = await queries.tenants.listTenants();

    return {
      userId,
      memberships: tenants.map((tenant) =>
        buildSuperAdminMembership(userId, tenant.id),
      ),
      tenants,
    };
  }

  const memberships = await queries.memberships.listMembershipsForUser(userId);

  if (memberships.length === 0) {
    redirect(adminRoutes.unauthorized());
  }

  const tenants = await queries.tenants.listTenantsByIds(
    memberships.map((membership) => membership.tenantId),
  );

  return { userId, memberships, tenants };
};
