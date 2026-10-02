import type { TTenant } from '@blog/db/schema/tenants';
import { env } from '@web/utils/env/env';

export const toTenantBaseUrl = (
  tenant: TTenant | undefined,
): string | undefined =>
  tenant?.primaryDomain
    ? `https://${tenant.primaryDomain}`
    : env.NEXT_PUBLIC_SITE_URL;
