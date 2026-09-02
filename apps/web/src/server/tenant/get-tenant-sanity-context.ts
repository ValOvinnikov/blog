import { queries } from '@blog/db';
import type { TTenantSanityContext } from '@blog/service';
import { cache } from 'react';

import { getRequestTenantId } from './get-request-tenant-id';

/**
 * Resolves the current request's tenant Sanity credentials, if any. Callers
 * pass the result straight into a `service.*.v1.*` call's optional `tenant`
 * argument — `undefined` (no resolved tenant, or a tenant with no token set
 * yet) means "use the legacy single-tenant client."
 *
 * Wrapped in React's `cache()`, not `unstable_cache` — this reads a
 * decrypted Sanity token, which must stay request-scoped, and the `cache()`
 * also dedupes the credentials query across every page/module in one render
 * pass rather than one query per caller.
 */
export const getTenantSanityContext = cache(
  async (): Promise<TTenantSanityContext | undefined> => {
    const tenantId = await getRequestTenantId();
    if (!tenantId) return undefined;

    return queries.tenants.getTenantSanityCredentials(tenantId);
  },
);
