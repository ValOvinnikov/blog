import 'server-only';

import type { TMembership } from '@blog/db/schema/memberships';
import { ACTIVE_TENANT_COOKIE } from '@platform/utils/active-tenant-cookie/active-tenant-cookie';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';

import { listSessionTenants } from './list-session-tenants';
import { type TPlatformViewer, toPlatformViewer } from './platform-viewer';

export type TDashboardTenantContext = {
  tenant: TPlatformTenant;
  membership: TMembership;
  viewer: TPlatformViewer;
  tenants: TPlatformTenant[];
};

// `cache()`-wrapped because a layout cannot pass its tenant to its page.
export const resolveDashboardTenant = cache(
  async (): Promise<TDashboardTenantContext> => {
    const { admin, memberships, tenants } = await listSessionTenants();
    const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));

    if (memberships.length === 1) {
      const membership = memberships[0]!;
      const tenant = tenantById.get(membership.tenantId);

      if (!tenant) {
        notFound();
      }

      return {
        tenant,
        membership,
        viewer: toPlatformViewer({ membership, admin }),
        tenants,
      };
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

    return {
      tenant: activeTenant,
      membership: activeMembership,
      viewer: toPlatformViewer({ membership: activeMembership, admin }),
      tenants,
    };
  },
);
