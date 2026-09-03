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
 * and `recheck-tenant-owners/run.ts` (the recurring sweep). When the caller
 * already knows `notifyOwnerElevationOutcome` sent this same outcome to
 * operators, pass it as `notifiedOutcome` to record both in the single
 * underlying write instead of a separate follow-up one.
 */
export async function reportOwnerElevationOutcome(
  tenantId: string,
  outcome: TElevateTenantOwnerOutcome,
  notifiedOutcome?: TElevateTenantOwnerOutcome,
): Promise<void> {
  await reportStepStatus({
    tenantId,
    step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    detail: outcome,
    ...(notifiedOutcome === undefined
      ? {}
      : { notifiedOwnerElevationOutcome: notifiedOutcome }),
  });
}
