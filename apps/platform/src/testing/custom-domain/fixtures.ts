import type { TCustomDomainClaim } from '@blog/db/schema/custom-domain-claims';
import type { TTenant } from '@blog/db/schema/tenants';
import { faker } from '@faker-js/faker';
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
    customDomainClaims: {
      createCustomDomainClaim: vi.fn(),
      getCustomDomainClaim: vi.fn(),
      deleteCustomDomainClaim: vi.fn(),
      promoteCustomDomainClaim: vi.fn(),
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

export const MOCK_CLAIM_ID = faker.string.uuid();

export const MOCK_CLAIM_TOKEN = 'blog-verify-4f9c2a7e';

export const mockCustomDomainClaim = (
  overrides: Partial<TCustomDomainClaim> = {},
): TCustomDomainClaim => ({
  id: MOCK_CLAIM_ID,
  tenantId: MOCK_TENANT_ID,
  domain: MOCK_CUSTOM_DOMAIN,
  token: MOCK_CLAIM_TOKEN,
  createdAt: new Date(),
  ...overrides,
});
