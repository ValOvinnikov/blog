'use server';

import { requireAdmin } from '@admin/server/auth/require-admin';

import { dispatchProvisioningWorkflow } from './dispatch-provisioning-workflow';

/**
 * The status page's per-step Retry button — re-dispatches the whole
 * provisioning workflow for `tenantId` rather than a single step, since
 * every step is independently idempotent: only the failed-or-later steps
 * actually do work, everything already `done` is skipped via its own
 * persisted-state check.
 */
export async function retryProvisioningStepAction(
  tenantId: string,
): Promise<void> {
  await requireAdmin();
  await dispatchProvisioningWorkflow(tenantId);
}
