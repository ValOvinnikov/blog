import type { TTenant } from '@blog/db/schema/tenants';
import { headers } from 'next/headers';
import { cache } from 'react';

import { resolveTenant, resolveTenantById } from './resolve-tenant';
import { UNRESOLVED_TENANT_PLACEHOLDER } from './unresolved-tenant-placeholder';

/**
 * Never resolves from the `x-tenant-id` header: routes `proxy.ts` excludes (`/api/*`, dotted paths) never have it sanitised, so trusting it would let a request claim another tenant's credentials. The placeholder resolves to `undefined` without a lookup.
 */
export const resolveRequestTenant = cache(
  async (tenant?: string): Promise<TTenant | undefined> => {
    if (tenant === UNRESOLVED_TENANT_PLACEHOLDER) return undefined;
    if (tenant) return resolveTenantById(tenant);

    const host = (await headers()).get('host');
    return resolveTenant(host);
  },
);
