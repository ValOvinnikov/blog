import 'server-only';

import { queries } from '@blog/db';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { auth } from './auth';
import { buildVirtualAdminMembership } from './build-virtual-admin-membership';
import { isSuperAdmin } from './is-super-admin';

export type TSessionTenants = {
  userId: string;
  memberships: TMembership[];
  tenants: TTenant[];
};

/**
 * `/dashboard`'s shared first step: who's signed in, and every tenant their
 * `memberships` rows grant access to. Redirects to sign-in with no session;
 * zero memberships redirects to `/workspace-pending` rather than 404ing,
 * since under auto-provisioning that workspace is either still being
 * created or failed to provision, not genuinely missing. A platform
 * SUPERADMIN instead resolves against every tenant in the system (virtual
 * OWNER-level memberships). `cache()`-wrapped so `dashboard/layout.tsx`,
 * `resolveDashboardTenant`, and `/dashboard/select-tenant` share one fetch
 * per request instead of each resolving it separately.
 */
export const listSessionTenants = cache(async (): Promise<TSessionTenants> => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(adminRoutes.signIn());
  }

  if (await isSuperAdmin(userId)) {
    const tenants = await queries.tenants.listTenants({
      includeArchived: true,
    });

    return {
      userId,
      memberships: tenants.map((tenant) =>
        buildVirtualAdminMembership(userId, tenant.id),
      ),
      tenants,
    };
  }

  const memberships = await queries.memberships.listMembershipsForUser(userId);

  if (memberships.length === 0) {
    redirect(adminRoutes.workspacePending());
  }

  const tenants = await queries.tenants.listTenantsByIds(
    memberships.map((membership) => membership.tenantId),
  );

  return { userId, memberships, tenants };
});
