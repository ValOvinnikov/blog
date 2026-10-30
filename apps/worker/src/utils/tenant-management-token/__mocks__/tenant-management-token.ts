import { MOCK_TENANT_MANAGEMENT_TOKEN } from '@worker/testing/tenant/fixtures';

export const requireTenantManagementToken = vi.fn(
  async (): Promise<string> => MOCK_TENANT_MANAGEMENT_TOKEN,
);

export const ensureTenantManagementToken = vi.fn(
  async (): Promise<string> => MOCK_TENANT_MANAGEMENT_TOKEN,
);
