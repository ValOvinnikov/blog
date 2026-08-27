'use server';

import { requireAdmin } from '@admin/server/auth/require-admin';
import { logger } from '@admin/utils/logger/logger';
import { queries } from '@blog/db';

/**
 * Called from `PlatformBreadcrumb`, a client component with no type-safe way
 * to read `tenantId` from `(platform)/layout.tsx`'s own `params` — that
 * layout's directory path has no `[tenantId]` segment, even though it wraps
 * the `/tenants/{id}` and `/tenants/{id}/provisioning` routes that do.
 */
export const getTenantNameAction = async (
  tenantId: string,
): Promise<string | undefined> => {
  await requireAdmin();

  const [tenant] = await queries.tenants.listTenantsByIds([tenantId]);
  if (!tenant) {
    logger.error('platform_breadcrumb.tenant_not_found', { tenantId });
    return undefined;
  }

  return tenant.name;
};
