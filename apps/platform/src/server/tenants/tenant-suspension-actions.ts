'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TAuditAction,
} from '@blog/config';
import { queries, TENANT_STATUS, type TSuspensionStatus } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import type { TTenantLifecycleResult } from '@platform/server/provisioning/tenant-lifecycle-result';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { logger } from '@platform/utils/logger/logger';

export type TTenantSuspensionResult = TTenantLifecycleResult<
  typeof TENANT_REFUSAL.NOT_FOUND | typeof TENANT_REFUSAL.ARCHIVED
>;

const SUSPENSION_AUDIT_ACTION = {
  [TENANT_STATUS.SUSPENDED]: AUDIT_ACTION.SUSPENSION_APPLIED,
  [TENANT_STATUS.ACTIVE]: AUDIT_ACTION.SUSPENSION_LIFTED,
} as const satisfies Record<TSuspensionStatus, TAuditAction>;

const setSuspension = async (
  tenantId: string,
  status: TSuspensionStatus,
): Promise<TTenantSuspensionResult> => {
  await requireSuperAdmin();

  const tenant = await queries.tenants.getTenantById(tenantId, {
    includeArchived: true,
  });
  if (!tenant) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    };
  }
  if (tenant.deprovisionedAt || tenant.status === TENANT_STATUS.ARCHIVED) {
    return { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.ARCHIVED };
  }

  try {
    const updated = await queries.tenants.setTenantSuspension(tenantId, status);
    if (!updated.ok) {
      return {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.ARCHIVED,
      };
    }
    await revalidateSiteConfig(tenantId);
  } catch (error) {
    logger.error('tenant.suspension_save_failed', { tenantId, status, error });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  await recordAuditEvent({
    logEvent: 'tenant.suspension_audit_failed',
    action: SUSPENSION_AUDIT_ACTION[status],
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { name: tenant.name },
  });

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};

export const suspendTenantAction = async (
  tenantId: string,
): Promise<TTenantSuspensionResult> =>
  setSuspension(tenantId, TENANT_STATUS.SUSPENDED);

export const liftTenantSuspensionAction = async (
  tenantId: string,
): Promise<TTenantSuspensionResult> =>
  setSuspension(tenantId, TENANT_STATUS.ACTIVE);
