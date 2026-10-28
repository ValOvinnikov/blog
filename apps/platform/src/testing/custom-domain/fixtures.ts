import type { TTenant } from '@blog/db/schema/tenants';
import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';

export const mockCustomDomainDb = () => ({
  queries: {
    tenantDomains: {
      isDomainHeldByAnyTenant: vi.fn(),
      listTenantDomains: vi.fn(),
      addTenantDomain: vi.fn(),
      removeTenantDomain: vi.fn(),
    },
  },
});

export const mockOwnerContext = (
  overrides: Partial<TTenant> = {},
): TTenantMembershipContext => ({
  tenant: mockReadyTenant({
    id: MOCK_TENANT_ID,
    primaryDomain: MOCK_TENANT_DOMAIN,
    ...overrides,
  }),
  membership: mockMembership(),
});

export const mockTenantDomainRows = () =>
  [{ domain: MOCK_TENANT_DOMAIN }, { domain: MOCK_CUSTOM_DOMAIN }] as never;
