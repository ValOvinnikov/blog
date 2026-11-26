import type { TTenantsPageRow } from '@shinefold/db/queries/tenants/tenants-page-row';

import { mockReadyTenant } from './mock-tenant';
import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
} from './tenant-identity';

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

export const mockOtherTenantsPageRow = (
  overrides: Partial<TTenantsPageRow> = {},
): TTenantsPageRow =>
  mockTenantsPageRow({
    id: MOCK_OTHER_TENANT_ID,
    name: MOCK_OTHER_TENANT_NAME,
    primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
    ...overrides,
  });
