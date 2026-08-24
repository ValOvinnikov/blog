import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';

// Only the workflow's last step ever settles the tenant's overall
// `provisioningStatus`. Every earlier step's update touches only its own
// entry in `provisioningSteps`, regardless of whether it succeeded or
// failed, since a mid-sequence failure is resumable (the admin UI's Retry
// button re-dispatches the workflow, which resumes past whatever already
// succeeded).
export function overallStatusFor(
  step: TTenantProvisioningStep,
  status: TTenantProvisioningStepStatus,
): TTenantProvisioningStatus | undefined {
  if (step !== TENANT_PROVISIONING_STEP.CREATE_WEBHOOK) return undefined;
  if (status === TENANT_PROVISIONING_STEP_STATUS.DONE) {
    return TENANT_PROVISIONING_STATUS.READY;
  }
  if (status === TENANT_PROVISIONING_STEP_STATUS.FAILED) {
    return TENANT_PROVISIONING_STATUS.FAILED;
  }
  return undefined;
}
