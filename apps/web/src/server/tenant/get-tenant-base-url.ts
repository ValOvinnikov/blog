import { queries } from '@blog/db';
import { env } from '@web/utils/env/env';
import { headers } from 'next/headers';
import { cache } from 'react';

import { resolveTenantId } from './resolve-tenant-id';

/**
 * Resolves the absolute base URL every canonical/OG/feed/JSON-LD URL the app
 * emits is built from — the resolved tenant's own `https://{primaryDomain}`
 * when a tenant resolves for the request's `Host`, `NEXT_PUBLIC_SITE_URL`
 * otherwise (local dev, or any deployment where no tenant matches). A
 * resolved tenant with no `primaryDomain` set also falls back to
 * `NEXT_PUBLIC_SITE_URL`, same as the no-tenant case.
 *
 * Wrapped in React's `cache()`, not `unstable_cache` — same reasoning as
 * `getHostTenantSanityContext`: request-scoped only, deduped within one
 * render pass.
 */
export const getTenantBaseUrl = cache(async (): Promise<string | undefined> => {
  const host = (await headers()).get('host');
  const tenantId = await resolveTenantId(host);
  if (!tenantId) {
    return env.NEXT_PUBLIC_SITE_URL;
  }

  const tenant = await queries.tenants.getTenantById(tenantId);
  if (!tenant?.primaryDomain) {
    return env.NEXT_PUBLIC_SITE_URL;
  }

  return `https://${tenant.primaryDomain}`;
});
