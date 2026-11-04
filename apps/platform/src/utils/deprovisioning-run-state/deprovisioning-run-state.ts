import type { TMaybeUndefined } from '@blog/config';
import {
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import type { TDeprovisioningRun } from '@blog/db/schema/tenants';

const OVERALL_STATUS_PRIORITY: TTenantProvisioningStepStatus[] = [
  TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  TENANT_PROVISIONING_STEP_STATUS.FAILED,
  TENANT_PROVISIONING_STEP_STATUS.DONE,
];

// An unfinished run outranks the step statuses a previous, failed run left behind.
export const deprovisioningOverallStatus = (
  stepStatuses: TTenantProvisioningStepStatus[],
  run: TMaybeUndefined<TDeprovisioningRun>,
): TTenantProvisioningStepStatus => {
  if (run && !run.finishedAt) {
    return TENANT_PROVISIONING_STEP_STATUS.RUNNING;
  }
  return (
    OVERALL_STATUS_PRIORITY.find((candidate) =>
      stepStatuses.includes(candidate),
    ) ?? TENANT_PROVISIONING_STEP_STATUS.IDLE
  );
};

// The worker records a run's start before the request's audit event exists, so only a finished run can be stale.
export const isRetryPending = (
  deprovisionRequestedAt: TMaybeUndefined<string>,
  run: TMaybeUndefined<TDeprovisioningRun>,
): boolean => {
  if (!deprovisionRequestedAt) {
    return false;
  }
  if (!run) {
    return true;
  }
  const { finishedAt } = run;
  if (!finishedAt) {
    return false;
  }
  return (
    new Date(deprovisionRequestedAt).getTime() > new Date(finishedAt).getTime()
  );
};
