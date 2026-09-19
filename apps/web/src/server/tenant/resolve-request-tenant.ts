import type { TTenant } from '@blog/db/schema/tenants';
import { headers } from 'next/headers';
import { cache } from 'react';

import { resolveTenant, resolveTenantById } from './resolve-tenant';
import { UNRESOLVED_TENANT_PLACEHOLDER } from './unresolved-tenant-placeholder';

/**
 * The single per-request tenant lookup, deduped via `cache()`, that every
 * tenant helper needing the full row (not just the id) builds on. Prefers
 * an explicitly supplied `tenant` id (the `[tenant]`
 * route param, threaded down from a page/layout/metadata builder that
 * already has it) over reading `Host` — reading `Host` is what makes a
 * route dynamic. Never resolves from the `x-tenant-id` header `proxy.ts`
 * sets — some callers serve routes `proxy.ts`'s matcher excludes (`/api/*`,
 * any dotted path) and never have that header sanitised, so trusting it
 * here would let a request claim another tenant's credentials.
 *
 * A `tenant` equal to `UNRESOLVED_TENANT_PLACEHOLDER` resolves to
 * `undefined` immediately, without a lookup by either id or `Host` — the
 * same host already failed to resolve a tenant once in `proxy.ts` this
 * request, so re-querying it here would only reproduce that answer at the
 * cost of a redundant database round trip.
 */
export const resolveRequestTenant = cache(
  async (tenant?: string): Promise<TTenant | undefined> => {
    if (tenant === UNRESOLVED_TENANT_PLACEHOLDER) return undefined;
    if (tenant) return resolveTenantById(tenant);

    const host = (await headers()).get('host');
    return resolveTenant(host);
  },
);
