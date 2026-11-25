import type { TTenantsPageRow } from '@shinefold/db/queries/tenants/list-tenants-page/list-tenants-page';

import { mockReadyTenant } from './mock-tenant';

export const mockTenantsPageRow = (
  overrides: Partial<TTenantsPageRow> = {},
): TTenantsPageRow => {
  const {
    id,
    name,
    primaryDomain,
    plan,
    status,
    provisioningStatus,
    createdAt,
  } = mockReadyTenant();

  return {
    id,
    name,
    primaryDomain,
    plan,
    status,
    provisioningStatus,
    deprovisionedAt: null,
    createdAt,
    ...overrides,
  };
};
