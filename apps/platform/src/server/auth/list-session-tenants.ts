import 'server-only';

import {
  type TPlatformTenantSummary,
  toPlatformTenantSummary,
} from '@platform/utils/platform-tenant/platform-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { queries } from '@shinefold/db';
import type { TAdmin } from '@shinefold/db/schema/admins';
import type { TMembership } from '@shinefold/db/schema/memberships';
import { hasLength } from '@shinefold/utils/primitives';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { buildVirtualAdminMembership } from './build-virtual-admin-membership';
import { isSuperAdmin } from './is-super-admin';
import { requireSessionUserId } from './require-session-user-id';

export type TSessionTenants = {
  userId: string;
  admin: TMaybeUndefined<TAdmin>;
  memberships: TMembership[];
  tenants: TPlatformTenantSummary[];
};

/** Zero memberships sends the user to `/onboarding`; a SUPERADMIN resolves against every tenant through virtual memberships. */
export const listSessionTenants = cache(async (): Promise<TSessionTenants> => {
  const userId = await requireSessionUserId();
  const [admin, membershipsWithTenants] = await Promise.all([
    queries.admins.getAdminByUserId(userId),
    queries.memberships.listMembershipsWithTenantsForUser(userId),
  ]);

  if (isSuperAdmin(admin)) {
    const tenants = await queries.tenants.listTenants({
      includeArchived: true,
    });

    return {
      userId,
      admin,
      memberships: tenants.map((tenant) =>
        buildVirtualAdminMembership(userId, tenant.id),
      ),
      tenants: tenants.map((tenant) => toPlatformTenantSummary(tenant)),
    };
  }

  if (!hasLength(membershipsWithTenants)) {
    redirect(adminRoutes.onboarding());
  }

  return {
    userId,
    admin,
    memberships: membershipsWithTenants.map(({ membership }) => membership),
    tenants: membershipsWithTenants.map(({ tenant }) =>
      toPlatformTenantSummary(tenant),
    ),
  };
});
