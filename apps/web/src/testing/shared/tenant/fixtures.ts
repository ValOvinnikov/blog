import type { TTenantSanityContext } from '@blog/service';

export const DEFAULT_TENANT_ID = 'tenant-1';

export const DEFAULT_TENANT_BASE_URL = 'https://example.com';

export const DEFAULT_TENANT_SANITY_CONTEXT: TTenantSanityContext = {
  projectId: 'default-tenant-project',
  dataset: 'default-tenant-dataset',
  token: 'default-tenant-token',
};
