import type { TTenant } from '@blog/db/schema/tenants';
import { headers } from 'next/headers';
import { cache } from 'react';

import { resolveTenant, resolveTenantById } from './resolve-tenant';
import { UNRESOLVED_TENANT_PLACEHOLDER } from './unresolved-tenant-placeholder';

/** `proxy.ts` does not sanitise `x-tenant-id` on `/api/*` or dotted paths, so it is never trusted here. */
export const resolveRequestTenant = cache(
  async (tenant?: string): Promise<TTenant | undefined> => {
    if (tenant === UNRESOLVED_TENANT_PLACEHOLDER) return undefined;
    if (tenant) return resolveTenantById(tenant);

    const host = (await headers()).get('host');
    return resolveTenant(host);
  },
);
