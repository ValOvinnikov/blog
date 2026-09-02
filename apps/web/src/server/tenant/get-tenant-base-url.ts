import { env } from '@web/utils/env/env';
import { cache } from 'react';

import { resolveRequestTenant } from './resolve-request-tenant';

/**
 * Resolves the absolute base URL every canonical/OG/feed/JSON-LD URL the app
 * emits is built from — the resolved tenant's own `https://{primaryDomain}`,
 * `NEXT_PUBLIC_SITE_URL` otherwise (local dev, no tenant resolved, or a
 * resolved tenant with no `primaryDomain` set).
 */
export const getTenantBaseUrl = cache(async (): Promise<string | undefined> => {
  const tenant = await resolveRequestTenant();
  if (!tenant?.primaryDomain) {
    return env.NEXT_PUBLIC_SITE_URL;
  }

  return `https://${tenant.primaryDomain}`;
});
