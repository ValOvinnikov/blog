import type {
  TElevateTenantOwnerOutcome,
  TTenantProvisioningStep,
  TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import { updateProvisioningStep } from '@blog/db/queries/tenants';

import { overallStatusFor } from './overall-provisioning-status';

export type TReportStepStatusInput = {
  tenantId: string;
  step: TTenantProvisioningStep;
  status: TTenantProvisioningStepStatus;
  error?: string;
  detail?: TElevateTenantOwnerOutcome;
  notifiedOwnerElevationOutcome?: TElevateTenantOwnerOutcome;
};

/**
 * Writes each provisioning step's status directly to Postgres via
 * `updateProvisioningStep` — the CI runner already holds a direct
 * connection (see `run.ts`'s `reactivateTenant` call), so this no longer
 * hops through `apps/platform` over HTTP. Never throws: a write failure here
 * must not mask the underlying step result the caller already logged and
 * is about to act on, so it's logged and swallowed instead.
 */
export async function reportStepStatus(
  input: TReportStepStatusInput,
): Promise<void> {
  const {
    tenantId,
    step,
    status,
    error,
    detail,
    notifiedOwnerElevationOutcome,
  } = input;
  const provisioningStatus = overallStatusFor(step, status);

  const result = await updateProvisioningStep({
    tenantId,
    step,
    status,
    ...(error === undefined ? {} : { error }),
    ...(detail === undefined ? {} : { detail }),
    ...(provisioningStatus === undefined ? {} : { provisioningStatus }),
    ...(notifiedOwnerElevationOutcome === undefined
      ? {}
      : { notifiedOwnerElevationOutcome }),
  });

  if (!result.ok) {
    console.error(
      `report-step-status: failed to record "${step}"/"${status}" for tenant "${tenantId}" (${result.error}).`,
    );
  }
}
