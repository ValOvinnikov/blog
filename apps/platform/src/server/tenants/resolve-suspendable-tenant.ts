import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  type TOutcome,
  type TReasonedFailure,
} from '@blog/config';
import { queries, TENANT_STATUS, type TSuspensionStatus } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { TENANT_LOG, TENANT_REFUSAL } from '@platform/constants/tenant';
import { resolveIsPlatformTenant } from '@platform/server/tenants/resolve-is-platform-tenant';
import { logger } from '@platform/utils/logger/logger';

type TSuspendableTenantRefusal =
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.ARCHIVED
  | typeof TENANT_REFUSAL.PLATFORM_TENANT;

export type TResolveSuspendableTenantResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; tenant: TTenant }
  | (TOutcome<typeof ACTION_OUTCOME.REFUSED> &
      TReasonedFailure<TSuspendableTenantRefusal>);

const refused = (
  reason: TSuspendableTenantRefusal,
): TResolveSuspendableTenantResult => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});

export const resolveSuspendableTenant = async (
  tenantId: string,
  status: TSuspensionStatus,
): Promise<TResolveSuspendableTenantResult> => {
  const tenant = await queries.tenants.getTenantById(tenantId, {
    includeArchived: true,
  });
  if (!tenant) return refused(TENANT_REFUSAL.NOT_FOUND);
  if (tenant.deprovisionedAt || tenant.status === TENANT_STATUS.ARCHIVED) {
    return refused(TENANT_REFUSAL.ARCHIVED);
  }
  if (
    status === TENANT_STATUS.SUSPENDED &&
    (await resolveIsPlatformTenant(tenant))
  ) {
    logger.warn(TENANT_LOG.PLATFORM_TENANT_REFUSED, {
      tenantId,
      action: AUDIT_ACTION.SUSPENSION_APPLIED,
    });
    return refused(TENANT_REFUSAL.PLATFORM_TENANT);
  }

  return { outcome: ACTION_OUTCOME.SUCCESS, tenant };
};
