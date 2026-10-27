import { TENANT_WRITE_REFUSAL, type TTenantWriteRefusal } from '@blog/config';
import { TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { TENANT_WRITE_LOG } from '@web/constants/tenant-write';
import { getRequestContext } from '@web/server/request-context/request-context';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { logger } from '@web/utils/logger/logger';

export const isTenantActive = (tenant: TTenant): boolean =>
  tenant.status === TENANT_STATUS.ACTIVE && !tenant.deprovisionedAt;

/** Server actions run outside the `[tenant]/[locale]` layout, so they gate with `resolveWritableTenant` instead. */
export const isRequestTenantActive = async (): Promise<boolean> => {
  const { tenantId } = await getRequestContext();
  const tenant = await resolveRequestTenant(
    tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER,
  );
  return tenant !== undefined && isTenantActive(tenant);
};

export const resolveWritableTenant = async (
  site: string,
): Promise<TResult<string, TTenantWriteRefusal>> => {
  const tenant = await resolveRequestTenant();

  if (!tenant) {
    logger.error(TENANT_WRITE_LOG.UNRESOLVED, { site });
    return errorResult(TENANT_WRITE_REFUSAL.UNRESOLVED);
  }

  if (!isTenantActive(tenant)) {
    return errorResult(TENANT_WRITE_REFUSAL.INACTIVE);
  }

  return okResult(tenant.id);
};
