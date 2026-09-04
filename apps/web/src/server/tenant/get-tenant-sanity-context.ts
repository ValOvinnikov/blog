import { queries } from '@blog/db';
import {
  getPlatformSanityContext,
  type TTenantSanityContext,
} from '@blog/service';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { getRequestTenantId } from './get-request-tenant-id';

/**
 * Resolves the current request's tenant Sanity credentials. Accepts the
 * `[tenant]` route param and prefers it over the `x-tenant-id` header
 * (`getRequestTenantId`'s own precedence). An unmatched host falls back to
 * `getPlatformSanityContext()` only outside production — `proxy.ts` 404s an
 * unmatched host (or one refused by `resolveTenant()`'s own servability
 * check) in production before any route reaches this. A matched tenant
 * whose credentials query still comes back empty — a race against
 * `proxy.ts`'s own check, in practice — refuses with `notFound()` in
 * production rather than ever substituting the platform's content; outside
 * production it keeps the same platform fallback.
 *
 * Wrapped in React's `cache()`, not `unstable_cache` — this reads a
 * decrypted Sanity token, which must stay request-scoped, and the `cache()`
 * also dedupes the credentials query across every page/module in one render
 * pass sharing the same argument, rather than one query per caller.
 */
export const getTenantSanityContext = cache(
  async (tenant?: string): Promise<TTenantSanityContext> => {
    const tenantId = await getRequestTenantId(tenant);
    if (!tenantId) return getPlatformSanityContext();

    const credentials =
      await queries.tenants.getTenantSanityCredentials(tenantId);
    if (credentials) return credentials;

    if (isProductionEnvironment()) {
      notFound();
    }
    return getPlatformSanityContext();
  },
);
