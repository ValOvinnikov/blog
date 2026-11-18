import 'server-only';

import {
  type TPlatformTenant,
  toPlatformTenant,
} from '@platform/utils/platform-tenant/platform-tenant';
import { queries } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';

export const loadPlatformTenant = async (
  tenant: TTenant,
): Promise<TPlatformTenant> =>
  toPlatformTenant(
    tenant,
    await queries.tenantEntitlementGrants.listResolvableEntitlementGrants(
      tenant.id,
    ),
  );
