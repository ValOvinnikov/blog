import 'server-only';

import type { TMaybeUndefined } from '@blog/config/types';
import { queries } from '@blog/db';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { buildVirtualAdminMembership } from './build-virtual-admin-membership';
import { isSuperAdmin } from './is-super-admin';
import { requireSessionUserId } from './require-session-user-id';

export type TSessionTenants = {
  userId: string;
  admin: TMaybeUndefined<TAdmin>;
  memberships: TMembership[];
  tenants: TTenant[];
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
      tenants,
    };
  }

  if (membershipsWithTenants.length === 0) {
    redirect(adminRoutes.onboarding());
  }

  return {
    userId,
    admin,
    memberships: membershipsWithTenants.map(({ membership }) => membership),
    tenants: membershipsWithTenants.map(({ tenant }) => tenant),
  };
});
