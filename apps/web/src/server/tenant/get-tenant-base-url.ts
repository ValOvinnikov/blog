import { cache } from 'react';

import { resolveRequestTenant } from './resolve-request-tenant';
import { toTenantBaseUrl } from './to-tenant-base-url';

export const getTenantBaseUrl = cache(async (): Promise<string | undefined> =>
  toTenantBaseUrl(await resolveRequestTenant()),
);
