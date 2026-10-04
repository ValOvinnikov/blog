import { TENANT_WRITE_REFUSAL, type TTenantWriteRefusal } from '@blog/config';
import { TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { logger } from '@web/utils/logger/logger';

type TWritableTenantResult =
  { ok: true; tenantId: string } | { ok: false; reason: TTenantWriteRefusal };

export const isTenantActive = (tenant: TTenant): boolean =>
  tenant.status === TENANT_STATUS.ACTIVE && !tenant.deprovisionedAt;

export const resolveWritableTenant = async (
  site: string,
): Promise<TWritableTenantResult> => {
  const tenant = await resolveRequestTenant();

  if (!tenant) {
    logger.error('tenant_write.unresolved', { site });
    return { ok: false, reason: TENANT_WRITE_REFUSAL.UNRESOLVED };
  }

  if (!isTenantActive(tenant)) {
    return { ok: false, reason: TENANT_WRITE_REFUSAL.INACTIVE };
  }

  return { ok: true, tenantId: tenant.id };
};
