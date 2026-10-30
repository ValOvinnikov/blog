import 'server-only';

import type { TMaybeUndefined } from '@blog/config/types';
import type { TMembershipRole, TTenantPlan } from '@blog/db/constants';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { isVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import type { TTenantSwitcherItem } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';

export type TTenantPickerItem = TTenantSwitcherItem & {
  role: TMaybeUndefined<TMembershipRole>;
  plan: TTenantPlan;
};

export const toTenantPickerItems = (
  tenants: TTenant[],
  memberships: TMembership[],
): TTenantPickerItem[] => {
  const roleByTenantId = new Map(
    memberships
      .filter((membership) => !isVirtualAdminMembership(membership))
      .map(({ tenantId, role }) => [tenantId, role]),
  );

  return tenants
    .map(({ id, name, primaryDomain, deprovisionedAt, plan }) => ({
      id,
      name,
      primaryDomain,
      isArchived: Boolean(deprovisionedAt),
      role: roleByTenantId.get(id),
      plan,
    }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
};
