import 'server-only';

import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import {
  type TPlatformTenant,
  toPlatformTenant,
} from '@platform/utils/platform-tenant/platform-tenant';
import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';

import { auth } from './auth';

export type TStudioCaller = {
  tenant: TPlatformTenant;
  userId: string;
  email: string;
};

/** The access check of the routes a tenant's Studio calls; the project id only selects the tenant, and `undefined` is the route's `FORBIDDEN`. */
export const resolveStudioCaller = async (
  sanityProjectId: string,
): Promise<TMaybeUndefined<TStudioCaller>> => {
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email;
  if (!userId || !email) return undefined;

  const tenantId =
    await queries.tenants.getTenantIdBySanityProjectId(sanityProjectId);
  if (!tenantId) return undefined;

  const [tenant, grants, admin] = await Promise.all([
    queries.tenants.getTenantById(tenantId),
    queries.tenantEntitlementGrants.listResolvableEntitlementGrants(tenantId),
    queries.admins.getAdminByUserId(userId),
  ]);
  if (!tenant) return undefined;

  const membership = admin
    ? buildVirtualAdminMembership(userId, tenantId)
    : await queries.memberships.getMembership(userId, tenantId);
  if (!membership || membership.role === MEMBERSHIP_ROLE.READER) {
    return undefined;
  }

  return { tenant: toPlatformTenant(tenant, grants), userId, email };
};
