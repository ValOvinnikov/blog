import { env } from '@web/utils/env/env';
import { cache } from 'react';

import { resolveRequestTenant } from './resolve-request-tenant';

/**
 * Resolves the absolute base URL every canonical/OG/feed/JSON-LD URL the app
 * emits is built from — the resolved tenant's own `https://{primaryDomain}`,
 * `NEXT_PUBLIC_SITE_URL` otherwise (local dev, no tenant resolved, or a
 * resolved tenant with no `primaryDomain` set). Accepts the `[tenant]` route
 * param and forwards it to `resolveRequestTenant`.
 */
export const getTenantBaseUrl = cache(
  async (tenant?: string): Promise<string | undefined> => {
    const tenantRecord = await resolveRequestTenant(tenant);
    if (!tenantRecord?.primaryDomain) {
      return env.NEXT_PUBLIC_SITE_URL;
    }

    return `https://${tenantRecord.primaryDomain}`;
  },
);
