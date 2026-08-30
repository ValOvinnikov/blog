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
 * The slug-free dashboard's shared first step: who's signed in, and every
 * tenant their `memberships` rows grant access to. Redirects to sign-in with
 * no session; zero memberships redirects to `/workspace-pending` rather than
 * 404ing, since a signed-in user with no membership and no `admins` row
 * isn't being denied access to something that exists — under
 * auto-provisioning, their workspace is either still being created or its
 * provisioning failed. A platform SUPERADMIN instead resolves against every
 * tenant in the system (virtual OWNER-level memberships), regardless of
 * their own real `memberships` row count. `resolveDashboardTenant` narrows
 * this further to exactly one tenant; the `/dashboard/select-tenant` picker
 * page calls this directly since it needs to render on the membership count
 * itself, before any tenant is chosen — `cache()`-wrapped so
 * `dashboard/layout.tsx`'s own direct call and `resolveDashboardTenant`'s
 * internal one share a single fetch per request.
 */
export const listSessionTenants = cache(async (): Promise<TSessionTenants> => {
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
