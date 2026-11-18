import 'server-only';

import {
  type TPlatformTenant,
  toPlatformTenant,
} from '@platform/utils/platform-tenant/platform-tenant';
import { queries } from '@shinefold/db';
import type { TAdmin } from '@shinefold/db/schema/admins';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { type TPlatformViewer, toPlatformViewer } from './platform-viewer';
import { requireAdmin } from './require-admin';

export type TTenantByIdContext = {
  tenant: TPlatformTenant;
  admin: TAdmin;
  viewer: TPlatformViewer;
  canGrantEntitlements: boolean;
};

/** Gates `/tenants/{id}/*` for any admin, archived tenants included, so only an unknown id 404s. */
export const requireTenantById = cache(
  async (tenantId: string): Promise<TTenantByIdContext> => {
    // Settled, not `Promise.all`: the gate's redirect or 404 must beat a malformed id's read error.
    const [adminResult, tenantResult, grantsResult] = await Promise.allSettled([
      requireAdmin(),
      queries.tenants.getTenantById(tenantId, { includeArchived: true }),
      queries.tenantEntitlementGrants.listResolvableEntitlementGrants(tenantId),
    ]);

    if (adminResult.status === 'rejected') {
      throw adminResult.reason;
    }

    if (tenantResult.status === 'rejected') {
      throw tenantResult.reason;
    }

    const tenant = tenantResult.value;

    if (!tenant) {
      notFound();
    }

    if (grantsResult.status === 'rejected') {
      throw grantsResult.reason;
    }

    const admin = adminResult.value;
    const viewer = toPlatformViewer({ admin });

    return {
      tenant: toPlatformTenant(tenant, grantsResult.value),
      admin,
      viewer,
      canGrantEntitlements: viewer.isSuperAdmin,
    };
  },
);
