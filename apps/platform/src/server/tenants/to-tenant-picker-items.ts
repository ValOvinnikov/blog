import 'server-only';

import { isVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TTenantSwitcherItem } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';
import type { TTenantPlan } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import type { TMembershipRole } from '@shinefold/db/constants';
import type { TMembership } from '@shinefold/db/schema/memberships';

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
