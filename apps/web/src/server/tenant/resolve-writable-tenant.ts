import { TENANT_WRITE_REFUSAL, type TTenantWriteRefusal } from '@blog/config';
import { TENANT_STATUS } from '@blog/db';
import { logger } from '@web/utils/logger/logger';

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

  if (tenant.status !== TENANT_STATUS.ACTIVE) {
    return { ok: false, reason: TENANT_WRITE_REFUSAL.INACTIVE };
  }

  return { ok: true, tenantId: tenant.id };
};
