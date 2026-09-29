import type * as TModule from '@web/server/tenant/get-tenant-base-url';
import { DEFAULT_TENANT_BASE_URL } from '@web/testing/shared/tenant/fixtures';

export const getTenantBaseUrl = vi.fn<typeof TModule.getTenantBaseUrl>(
  async () => DEFAULT_TENANT_BASE_URL,
);
