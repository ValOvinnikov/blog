import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';

import { reportStepStatus } from './report-step-status';

/**
 * Persists one `elevateTenantOwner` check's outcome to the tenant's
 * `OWNER_ELEVATION` provisioning step. Every outcome — including STALLED and
 * AMBIGUOUS_MEMBERSHIP — is a completed check, not a failed step, so this
 * always reports DONE; only the `detail` distinguishes the outcome. Called
 * by both `provision-tenant/run.ts` (once, right after core provisioning)
 * and `recheck-tenant-owners/run.ts` (the recurring sweep).
 */
export async function reportOwnerElevationOutcome(
  tenantId: string,
  outcome: TElevateTenantOwnerOutcome,
): Promise<void> {
  await reportStepStatus({
    tenantId,
    step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    detail: outcome,
  });
}
