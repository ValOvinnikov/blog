import { queries } from '@blog/db';
import type { TTenantSanityContext } from '@blog/service';

import { getRequestTenantId } from './get-request-tenant-id';

/**
 * Resolves the current request's tenant Sanity credentials, if any. Callers
 * pass the result straight into a `service.*.v1.*` call's optional `tenant`
 * argument — `undefined` (no resolved tenant, or a tenant with no token set
 * yet) means "use the legacy single-tenant client," matching today's
 * behavior for the one seeded tenant.
 */
export async function getTenantSanityContext(): Promise<
  TTenantSanityContext | undefined
> {
  const tenantId = await getRequestTenantId();
  if (!tenantId) return undefined;

  return queries.tenants.getTenantSanityCredentials(tenantId);
}
