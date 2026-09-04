import { headers } from 'next/headers';
import { cache } from 'react';

import { TENANT_ID_HEADER } from './tenant-id-header';

/**
 * getRequestTenantId — resolves the request's tenant id, preferring an
 * explicitly supplied `tenant` (the `[tenant]` route param, threaded down
 * from a page/layout/metadata builder that already has it) over reading
 * `TENANT_ID_HEADER`, the id `proxy.ts` resolved onto the request. Reading
 * the header is what makes a route dynamic, so a caller that can supply the
 * param must — falling through to the header keeps working for the callers
 * that genuinely can't (Server Actions, the auth-gated `account`/`bookmarks`
 * pages, the root `not-found.tsx`). `undefined` means neither is available
 * (only possible outside production — an unmatched host in production never
 * reaches here, proxy.ts 404s first).
 *
 * Wrapped in React's `cache()` so every Server Component/module in the same
 * render pass sharing the same argument shares one result instead of
 * re-reading headers per call.
 */
export const getRequestTenantId = cache(
  async (tenant?: string): Promise<string | undefined> => {
    if (tenant) return tenant;

    const headersList = await headers();
    return headersList.get(TENANT_ID_HEADER) ?? undefined;
  },
);
