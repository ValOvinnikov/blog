'use server';

import { requireSuperAdmin } from '@admin/server/auth/require-super-admin';
import { logger } from '@admin/utils/logger/logger';
import { ERROR_CODE } from '@blog/config/constants';
import { queries } from '@blog/db';

import { dispatchProvisioningWorkflow } from './dispatch-provisioning-workflow';

export type TRetryProvisioningStepResult =
  | { outcome: 'dispatched' }
  | { outcome: 'already-in-progress' }
  | { outcome: 'not-found' }
  | { outcome: 'dispatch-error' };

/**
 * Backs both the status page's per-step Retry button and its all-idle Start
 * provisioning action — re-dispatches the whole provisioning workflow for
 * `tenantId` rather than a single step, since every step is independently
 * idempotent: only the failed-or-later steps actually do work, everything
 * already `done` is skipped via its own persisted-state check.
 *
 * `beginTenantProvisioning`'s atomic guard is the real backstop against a
 * concurrent double-dispatch (the client-side disabled button only helps);
 * a guard hit is reported back as a legitimate no-op, not an error. If the
 * subsequent GitHub dispatch itself fails, the `PROVISIONING` transition is
 * reverted so the tenant never sits showing a workflow that isn't running.
 */
export const retryProvisioningStepAction = async (
  tenantId: string,
): Promise<TRetryProvisioningStepResult> => {
  await requireSuperAdmin();

  const began = await queries.tenants.beginTenantProvisioning(tenantId);

  if (!began.ok) {
    if (began.error === ERROR_CODE.DB_ALREADY_PROVISIONING) {
      return { outcome: 'already-in-progress' };
    }

    logger.error('provisioning.begin_failed', {
      tenantId,
      error: began.error,
    });
    return { outcome: 'not-found' };
  }

  const dispatched = await dispatchProvisioningWorkflow(tenantId);

  if (!dispatched) {
    const reverted = await queries.tenants.setTenantProvisioningStatus(
      tenantId,
      began.data.previousProvisioningStatus,
    );

    if (!reverted.ok) {
      logger.error('provisioning.revert_failed', {
        tenantId,
        error: reverted.error,
      });
    }

    return { outcome: 'dispatch-error' };
  }

  return { outcome: 'dispatched' };
};
