import type {
  TDeprovisioningStep,
  TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import { updateDeprovisioningStep } from '@blog/db/queries/tenants';

export type TReportDeprovisioningStepStatusInput = {
  tenantId: string;
  step: TDeprovisioningStep;
  status: TTenantProvisioningStepStatus;
  error?: string;
};

/**
 * Writes each deprovisioning step's status directly to Postgres via
 * `updateDeprovisioningStep`. Never throws: a write failure here must not
 * abort the teardown it's only trying to describe, so it's logged and
 * swallowed instead.
 */
export async function reportDeprovisioningStepStatus(
  input: TReportDeprovisioningStepStatusInput,
): Promise<void> {
  const { tenantId, step, status, error } = input;

  const result = await updateDeprovisioningStep({
    tenantId,
    step,
    status,
    ...(error === undefined ? {} : { error }),
  });

  if (!result.ok) {
    console.error(
      `report-deprovisioning-step-status: failed to record "${step}"/"${status}" for tenant "${tenantId}" (${result.error}).`,
    );
  }
}
