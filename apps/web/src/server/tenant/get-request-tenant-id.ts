import { headers } from 'next/headers';
import { cache } from 'react';

import { TENANT_ID_HEADER } from './tenant-id-header';
import { UNRESOLVED_TENANT_PLACEHOLDER } from './unresolved-tenant-placeholder';

/**
 * getRequestTenantId — resolves the request's tenant id, preferring an
 * explicitly supplied `tenant` (the `[tenant]` route param) over reading
 * `TENANT_ID_HEADER`, the id `proxy.ts` resolved onto the request. Reading
 * the header is what makes a route dynamic, so pass the param whenever a
 * route has one — the fallback exists for callers that don't: Server
 * Actions, and a couple of `force-dynamic` pages that leave `tenant`
 * unthreaded on purpose.
 * `undefined` means neither is available (only possible outside
 * production — an unmatched host in production never reaches here,
 * proxy.ts 404s first), which is also what a `tenant`/header value equal to
 * `UNRESOLVED_TENANT_PLACEHOLDER` resolves to. This is the chokepoint for
 * id-only callers; a caller needing the full tenant row goes through
 * `resolveRequestTenant` instead, which refuses the same placeholder on its
 * own path. Wrapped in React's `cache()` so every Server Component/module
 * in the same render pass sharing the same argument shares one result
 * instead of re-reading headers per call.
 */
export const getRequestTenantId = cache(
  async (tenant?: string): Promise<string | undefined> => {
    if (tenant === UNRESOLVED_TENANT_PLACEHOLDER) return undefined;
    if (tenant) return tenant;

    const headersList = await headers();
    const headerTenantId = headersList.get(TENANT_ID_HEADER);
    if (!headerTenantId || headerTenantId === UNRESOLVED_TENANT_PLACEHOLDER) {
      return undefined;
    }
    return headerTenantId;
  },
);
