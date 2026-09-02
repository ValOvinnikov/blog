import { headers } from 'next/headers';
import { cache } from 'react';

import { TENANT_ID_HEADER } from './tenant-id-header';

/**
 * getRequestTenantId — reads the tenant id `proxy.ts` resolved for this
 * request off `TENANT_ID_HEADER`. `undefined` means proxy.ts ran but
 * couldn't resolve a tenant (only possible outside production — an
 * unmatched host in production never reaches here, proxy.ts 404s first).
 *
 * Wrapped in React's `cache()` so every Server Component/module in the same
 * render pass shares one result instead of re-reading headers per call.
 */
export const getRequestTenantId = cache(
  async (): Promise<string | undefined> => {
    const headersList = await headers();
    return headersList.get(TENANT_ID_HEADER) ?? undefined;
  },
);
