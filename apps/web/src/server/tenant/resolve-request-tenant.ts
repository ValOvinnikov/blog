import type { TTenant } from '@blog/db/schema/tenants';
import { headers } from 'next/headers';
import { cache } from 'react';

import { resolveTenant } from './resolve-tenant';

/**
 * resolveRequestTenant — the single per-request tenant lookup, deduped via
 * `cache()`, that every tenant helper builds on. Resolves from the request
 * `Host` header only, never the `x-tenant-id` header `proxy.ts` sets — some
 * callers serve routes `proxy.ts`'s matcher excludes (`/api/*`, any dotted
 * path) and never have that header sanitised, so trusting it here would let
 * a request claim another tenant's credentials.
 */
export const resolveRequestTenant = cache(
  async (): Promise<TTenant | undefined> => {
    const host = (await headers()).get('host');
    return resolveTenant(host);
  },
);
