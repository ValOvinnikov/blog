import 'server-only';

import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { ACTIVE_TENANT_COOKIE } from '@platform/utils/active-tenant-cookie/active-tenant-cookie';
import { adminRoutes } from '@platform/utils/routes/routes';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';

import { listSessionTenants } from './list-session-tenants';

export type TDashboardTenantContext = {
  tenant: TTenant;
  membership: TMembership;
  /** Every tenant the signed-in user can switch into — feeds the sidebar's `TenantSwitcher` when there's more than one. */
  tenants: TTenant[];
};

/**
 * The slug-free `/dashboard` tree's tenant gate — resolves "which tenant"
 * from the session's own `memberships` instead of a URL param. Several
 * memberships require the "active tenant" cookie rather than guessing one.
 * `cache()`-wrapped: a layout can't pass this down to its page, so a
 * route's layout and page would otherwise each resolve it separately.
 */
export const resolveDashboardTenant = cache(
  async (): Promise<TDashboardTenantContext> => {
    const { memberships, tenants } = await listSessionTenants();
    const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));

    if (memberships.length === 1) {
      const membership = memberships[0]!;
      const tenant = tenantById.get(membership.tenantId);

      if (!tenant) {
        notFound();
      }

      return { tenant, membership, tenants };
    }

    const cookieStore = await cookies();
    const activeTenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;
    const activeMembership = memberships.find(
      (membership) => membership.tenantId === activeTenantId,
    );
    const activeTenant =
      activeMembership && tenantById.get(activeMembership.tenantId);

    if (!activeMembership || !activeTenant) {
      redirect(adminRoutes.dashboardSelectTenant());
    }

    return { tenant: activeTenant, membership: activeMembership, tenants };
  },
);
