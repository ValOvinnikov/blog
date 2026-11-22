import 'server-only';

import { readRenamedCookie } from '@platform/server/renamed-cookie/read-renamed-cookie';
import { loadPlatformTenant } from '@platform/server/tenants/load-platform-tenant';
import {
  ACTIVE_TENANT_COOKIE,
  LEGACY_ACTIVE_TENANT_COOKIE,
} from '@platform/utils/active-tenant-cookie/active-tenant-cookie';
import type {
  TPlatformTenant,
  TPlatformTenantSummary,
} from '@platform/utils/platform-tenant/platform-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TMembership } from '@shinefold/db/schema/memberships';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';

import { listSessionTenants } from './list-session-tenants';
import { type TPlatformViewer, toPlatformViewer } from './platform-viewer';

export type TDashboardTenantContext = {
  tenant: TPlatformTenant;
  membership: TMembership;
  viewer: TPlatformViewer;
  tenants: TPlatformTenantSummary[];
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
        tenant: await loadPlatformTenant(tenant),
        membership,
        viewer: toPlatformViewer({ membership, admin }),
        tenants,
      };
    }

    const activeTenantId = await readRenamedCookie({
      name: ACTIVE_TENANT_COOKIE,
      legacyName: LEGACY_ACTIVE_TENANT_COOKIE,
    });
    const activeMembership = memberships.find(
      (membership) => membership.tenantId === activeTenantId,
    );
    const activeTenant =
      activeMembership && tenantById.get(activeMembership.tenantId);

    if (!activeMembership || !activeTenant) {
      redirect(adminRoutes.dashboardSelectTenant());
    }

    return {
      tenant: await loadPlatformTenant(activeTenant),
      membership: activeMembership,
      viewer: toPlatformViewer({ membership: activeMembership, admin }),
      tenants,
    };
  },
);
