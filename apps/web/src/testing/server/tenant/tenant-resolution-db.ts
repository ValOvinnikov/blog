export * from '@shinefold/db/constants';

export const queries = {
  tenantDomains: { getTenantByDomain: vi.fn() },
  tenants: {
    getTenantById: vi.fn(),
    listTenants: vi.fn(),
    toTenantSanityCredentials: vi.fn(),
    toTenantSanityWriteCredentials: vi.fn(),
  },
};
