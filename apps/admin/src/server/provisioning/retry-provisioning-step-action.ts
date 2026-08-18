'use server';

import { requireSuperAdmin } from '@admin/server/auth/require-super-admin';

import { dispatchProvisioningWorkflow } from './dispatch-provisioning-workflow';

/**
 * Backs both the status page's per-step Retry button and its all-idle Start
 * provisioning action — re-dispatches the whole provisioning workflow for
 * `tenantId` rather than a single step, since every step is independently
 * idempotent: only the failed-or-later steps actually do work, everything
 * already `done` is skipped via its own persisted-state check.
 */
export async function retryProvisioningStepAction(
  tenantId: string,
): Promise<void> {
  await requireSuperAdmin();
  await dispatchProvisioningWorkflow(tenantId);
}
