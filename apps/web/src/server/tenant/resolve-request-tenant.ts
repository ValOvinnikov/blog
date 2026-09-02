import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { headers } from 'next/headers';
import { cache } from 'react';

import { getRequestTenantId } from './get-request-tenant-id';
import { resolveTenant } from './resolve-tenant';

/**
 * resolveRequestTenant — the single per-request tenant lookup every helper
 * that needs the full tenant row (base URL, Sanity read credentials) is built
 * on, so a request resolves "which tenant is this" once no matter how many of
 * those helpers ask. Prefers the id `proxy.ts` already resolved onto
 * `TENANT_ID_HEADER`; falls back to resolving fresh from the request `Host`
 * header for the routes `proxy.ts`'s matcher excludes (any path containing a
 * dot, `/api/*`) and which therefore never carry that header.
 */
export const resolveRequestTenant = cache(
  async (): Promise<TTenant | undefined> => {
    const headerTenantId = await getRequestTenantId();
    if (headerTenantId) {
      return queries.tenants.getTenantById(headerTenantId);
    }

    const host = (await headers()).get('host');
    return resolveTenant(host);
  },
);
