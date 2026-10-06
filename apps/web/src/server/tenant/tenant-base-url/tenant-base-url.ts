import type { TTenant } from '@blog/db/schema/tenants';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { env } from '@web/utils/env/env';
import { cache } from 'react';

export const toTenantBaseUrl = (
  tenant: TTenant | undefined,
): string | undefined =>
  tenant?.primaryDomain
    ? `https://${tenant.primaryDomain}`
    : env.NEXT_PUBLIC_SITE_URL;

export const getTenantBaseUrl = cache(async (): Promise<string | undefined> =>
  toTenantBaseUrl(await resolveRequestTenant()),
);
