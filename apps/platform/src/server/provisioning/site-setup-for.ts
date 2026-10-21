import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { isVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import { isTenantOwner } from '@platform/server/auth/is-tenant-owner';
import { toClientTenant } from '@platform/server/tenants/to-client-tenant';

type TSiteSetup = {
  tenant: ReturnType<typeof toClientTenant>;
  canRetry: boolean;
};

/** The overview's setup progress, for the viewers `getTenantProvisioningStatusAction` admits, until provisioning is READY. */
export const siteSetupFor = (
  tenant: TTenant,
  membership: TMembership,
  admin: TMaybeUndefined<TAdmin>,
): TMaybeUndefined<TSiteSetup> => {
  const { provisioningStatus } = tenant;

  if (
    !provisioningStatus ||
    provisioningStatus === TENANT_PROVISIONING_STATUS.READY ||
    !isTenantOwner(membership)
  ) {
    return undefined;
  }

  return {
    tenant: toClientTenant(tenant),
    canRetry: isSuperAdmin(admin) || !isVirtualAdminMembership(membership),
  };
};
