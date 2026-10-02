import type * as TModule from '@web/server/tenant/request-tenant/request-tenant';
import { DEFAULT_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

export const getRequestTenantId = vi.fn<typeof TModule.getRequestTenantId>(
  async () => DEFAULT_TENANT_ID,
);
