import { isValidTenantId } from '@web/utils/is-tenant-shaped-path-segment';
import { headers } from 'next/headers';
import { cache } from 'react';

import { TENANT_ID_HEADER } from './tenant-id-header';
import { UNRESOLVED_TENANT_PLACEHOLDER } from './unresolved-tenant-placeholder';

/**
 * Resolves the request's tenant id, preferring an explicitly supplied
 * `tenant` (the `[tenant]` route param) over reading the request header,
 * since the header read is what makes a route dynamic. A `tenant` that isn't
 * a genuine tenant id — e.g. a value Next matched structurally from an
 * unrelated dotted path — resolves the same as an absent one, rather than
 * being forwarded to a caller that would use it as a database key.
 * `undefined` means none of the above is available, which is also what
 * `UNRESOLVED_TENANT_PLACEHOLDER` resolves to; a caller needing the full
 * tenant row goes through `resolveRequestTenant` instead.
 */
export const getRequestTenantId = cache(
  async (tenant?: string): Promise<string | undefined> => {
    if (tenant === UNRESOLVED_TENANT_PLACEHOLDER) return undefined;
    if (tenant) return isValidTenantId(tenant) ? tenant : undefined;

    const headersList = await headers();
    const headerTenantId = headersList.get(TENANT_ID_HEADER);
    if (!headerTenantId || headerTenantId === UNRESOLVED_TENANT_PLACEHOLDER) {
      return undefined;
    }
    return headerTenantId;
  },
);
