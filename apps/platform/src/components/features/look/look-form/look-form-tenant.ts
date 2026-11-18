import type { TTenant } from '@shinefold/db/schema/tenants';
import type { TTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export type TLookFormTenant = Pick<TTenant, 'id' | 'name'> &
  Pick<TTenantEntitlements, 'lookFields'> & {
    siteHost: string;
    archivedAt?: Date;
  };
