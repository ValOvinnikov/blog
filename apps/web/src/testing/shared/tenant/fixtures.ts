import type { TTenantSanityContext } from '@blog/service';

/**
 * A resolved `TTenantSanityContext`, for tests that mock
 * `getTenantSanityContext`/`getHostTenantSanityContext` — the real resolvers
 * never resolve to `undefined`, so this is the reachable default value to
 * drive them with.
 */
export const DEFAULT_TENANT_SANITY_CONTEXT: TTenantSanityContext = {
  projectId: 'default-tenant-project',
  dataset: 'default-tenant-dataset',
  token: 'default-tenant-token',
};
