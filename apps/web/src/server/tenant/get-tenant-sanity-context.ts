import { queries } from '@blog/db';
import {
  getPlatformSanityContext,
  type TTenantSanityContext,
} from '@blog/service';
import { cache } from 'react';

import { getRequestTenantId } from './get-request-tenant-id';

/**
 * Resolves the current request's tenant Sanity credentials, falling back to
 * `getPlatformSanityContext()` when no request-scoped tenant is resolved (or
 * the resolved tenant has no token set yet) — the deliberate single-tenant
 * dev/preview fallback. `proxy.ts` 404s an unmatched host in production
 * before any route reaches this, so that fallback only ever engages outside
 * production.
 *
 * Wrapped in React's `cache()`, not `unstable_cache` — this reads a
 * decrypted Sanity token, which must stay request-scoped, and the `cache()`
 * also dedupes the credentials query across every page/module in one render
 * pass rather than one query per caller.
 */
export const getTenantSanityContext = cache(
  async (): Promise<TTenantSanityContext> => {
    const tenantId = await getRequestTenantId();
    if (!tenantId) return getPlatformSanityContext();

    const tenant = await queries.tenants.getTenantSanityCredentials(tenantId);
    return tenant ?? getPlatformSanityContext();
  },
);
