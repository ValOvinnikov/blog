import { TENANT_WRITE_REFUSAL, type TTenantWriteRefusal } from '@blog/config';
import { TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { logger } from '@web/utils/logger/logger';

export const isTenantActive = (tenant: TTenant): boolean =>
  tenant.status === TENANT_STATUS.ACTIVE && !tenant.deprovisionedAt;

export const resolveWritableTenant = async (
  site: string,
): Promise<TResult<string, TTenantWriteRefusal>> => {
  const tenant = await resolveRequestTenant();

  if (!tenant) {
    logger.error('tenant_write.unresolved', { site });
    return errorResult(TENANT_WRITE_REFUSAL.UNRESOLVED);
  }

  if (!isTenantActive(tenant)) {
    return errorResult(TENANT_WRITE_REFUSAL.INACTIVE);
  }

  return okResult(tenant.id);
};
