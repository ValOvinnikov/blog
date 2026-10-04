import type { TTenant } from '@blog/db/schema/tenants';
import {
  TENANT_ID_HEADER,
  UNRESOLVED_TENANT_PLACEHOLDER,
} from '@web/server/tenant/constants/constants';
import {
  resolveTenant,
  resolveTenantById,
} from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { isValidTenantId } from '@web/utils/is-tenant-shaped-path-segment';
import { headers } from 'next/headers';
import { cache } from 'react';

/** `proxy.ts` does not sanitise `x-tenant-id` on `/api/*` or dotted paths, so it is never trusted here. */
export const resolveRequestTenant = cache(
  async (tenant?: string): Promise<TTenant | undefined> => {
    if (tenant === UNRESOLVED_TENANT_PLACEHOLDER) return undefined;
    if (tenant) return resolveTenantById(tenant);

    const host = (await headers()).get('host');
    return resolveTenant(host);
  },
);

/**
 * Preferring `tenant` over the header avoids the header read, which makes a route dynamic.
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
