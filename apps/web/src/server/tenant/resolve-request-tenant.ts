import type { TTenant } from '@blog/db/schema/tenants';
import { headers } from 'next/headers';
import { cache } from 'react';

import { resolveTenant } from './resolve-tenant';

/**
 * resolveRequestTenant — the single per-request tenant lookup every helper
 * that needs the full tenant row (base URL, Sanity read/write credentials)
 * is built on, so a request resolves "which tenant is this" once no matter
 * how many of those helpers ask. Always resolves fresh from the request
 * `Host` header rather than the `x-tenant-id` header `proxy.ts` sets — this
 * function backs helpers serving routes `proxy.ts`'s matcher excludes
 * (`/api/*`, any path containing a dot), which never pass through
 * `proxy.ts` and so never have that header sanitised; trusting a
 * client-supplied value there would let a request claim any tenant's
 * credentials.
 */
export const resolveRequestTenant = cache(
  async (): Promise<TTenant | undefined> => {
    const host = (await headers()).get('host');
    return resolveTenant(host);
  },
);
