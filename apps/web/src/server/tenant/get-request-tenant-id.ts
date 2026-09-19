import { headers } from 'next/headers';
import { cache } from 'react';

import { TENANT_ID_HEADER } from './tenant-id-header';
import { UNRESOLVED_TENANT_PLACEHOLDER } from './unresolved-tenant-placeholder';

/**
 * Resolves the request's tenant id, preferring an explicitly supplied
 * `tenant` (the `[tenant]` route param) over reading the request header,
 * since the header read is what makes a route dynamic.
 * `undefined` means neither is available, which is also what
 * `UNRESOLVED_TENANT_PLACEHOLDER` resolves to; a caller needing the full
 * tenant row goes through `resolveRequestTenant` instead.
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
