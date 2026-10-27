import type * as TModule from '@web/server/tenant/request-tenant/request-tenant';
import {
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';

export const resolveRequestTenant = vi.fn<typeof TModule.resolveRequestTenant>(
  async () => mockTenant(),
);

export const getRequestTenantId = vi.fn<typeof TModule.getRequestTenantId>(
  async () => MOCK_TENANT_ID,
);
