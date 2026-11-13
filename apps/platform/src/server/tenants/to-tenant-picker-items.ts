import 'server-only';

import type { TTenantPlan } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import type { TMembershipRole } from '@blog/db/constants';
import type { TMembership } from '@blog/db/schema/memberships';
import { isVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TTenantSwitcherItem } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';

export type TTenantPickerItem = TTenantSwitcherItem & {
  role: TMaybeUndefined<TMembershipRole>;
  plan: TTenantPlan;
};

export const toTenantPickerItems = (
  tenants: TPlatformTenant[],
  memberships: TMembership[],
): TTenantPickerItem[] => {
  const roleByTenantId = new Map(
    memberships
      .filter((membership) => !isVirtualAdminMembership(membership))
      .map(({ tenantId, role }) => [tenantId, role]),
  );

  return tenants
    .map(({ id, name, primaryDomain, isArchived, plan }) => ({
      id,
      name,
      primaryDomain,
      isArchived,
      role: roleByTenantId.get(id),
      plan,
    }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
};
