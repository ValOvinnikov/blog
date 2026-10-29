import { OPERATOR_ALERT_KIND } from '@blog/config/constants';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  OWNER_ACCESS_STALL_AFTER_MS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import { updateProvisioningStep } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { logger } from '@worker/utils/logger/logger';
import { postOperatorAlert } from '@worker/utils/operator-alert/operator-alert';

export function msSinceOwnerInvited(tenant: TTenant): number {
  const invitedAt = tenant.ownerInviteSentAt ?? tenant.createdAt;
  return Date.now() - invitedAt.getTime();
}

export function pendingOwnerAccessOutcome(
  tenant: TTenant,
): TElevateTenantOwnerOutcome {
  return msSinceOwnerInvited(tenant) >= OWNER_ACCESS_STALL_AFTER_MS
    ? ELEVATE_TENANT_OWNER_OUTCOME.STALLED
    : ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE;
}

async function alertOnceWhenStalled(
  tenant: TTenant,
  outcome: TElevateTenantOwnerOutcome,
): Promise<boolean> {
  const { STALLED } = ELEVATE_TENANT_OWNER_OUTCOME;
  if (
    outcome !== STALLED ||
    tenant.lastNotifiedOwnerElevationOutcome === STALLED
  ) {
    return false;
  }
  return postOperatorAlert({
    kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
    tenantId: tenant.id,
    outcome: STALLED,
  });
}

export async function reportOwnerAccessOutcome(
  tenant: TTenant,
  outcome: TElevateTenantOwnerOutcome,
): Promise<void> {
  const alerted = await alertOnceWhenStalled(tenant, outcome);

  const result = await updateProvisioningStep({
    tenantId: tenant.id,
    step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    detail: outcome,
    ...(alerted ? { notifiedOwnerElevationOutcome: outcome } : {}),
  });
  if (!result.ok) {
    logger.error('owner_access.report_failed', {
      tenantId: tenant.id,
      outcome,
      error: result.error,
    });
  }
}
