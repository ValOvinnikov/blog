import { TENANT_WRITE_REFUSAL, type TTenantWriteRefusal } from '@blog/config';
import { logger } from '@web/utils/logger/logger';

import { isTenantActive } from './is-tenant-active';
import { resolveRequestTenant } from './resolve-request-tenant';

type TWritableTenantResult =
  { ok: true; tenantId: string } | { ok: false; reason: TTenantWriteRefusal };

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
