import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import {
  CORE_PROVISIONING_STEPS,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TElevateTenantOwnerOutcome,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import type {
  TProvisioningRun,
  TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import {
  classifyProvisioningError,
  type TProvisioningErrorKind,
} from '@platform/utils/provisioning-error/provisioning-error';
import {
  findFailedStep,
  stepStatusesFor,
  stepUpdatedAtFor,
} from '@platform/utils/run-steps/run-steps';

const OVERALL_STATUS_PRIORITY: TTenantProvisioningStepStatus[] = [
  TENANT_PROVISIONING_STEP_STATUS.FAILED,
  TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  TENANT_PROVISIONING_STEP_STATUS.IDLE,
  TENANT_PROVISIONING_STEP_STATUS.DONE,
];

export type TProvisioningViewState = {
  stepStatuses: TTenantProvisioningStepStatus[];
  displayStepStatuses: TTenantProvisioningStepStatus[];
  stepUpdatedAt: TMaybeUndefined<string>[];
  provisioningRun: TMaybeUndefined<TProvisioningRun>;
  allIdle: boolean;
  isProvisioningRunning: boolean;
  isAwaitingRunner: boolean;
  isOverallFailed: boolean;
  displayOverallStatus: TTenantProvisioningStepStatus;
  failedStepError: TMaybeUndefined<string>;
  errorKind: TMaybeUndefined<TProvisioningErrorKind>;
  ownerElevationOutcome: TMaybeUndefined<TElevateTenantOwnerOutcome>;
};

export const provisioningViewState = (
  provisioningSteps: TMaybeNull<TTenantProvisioningState>,
  provisioningStatus: TMaybeNull<TTenantProvisioningStatus>,
): TProvisioningViewState => {
  const stepStatuses = stepStatusesFor(
    provisioningSteps,
    CORE_PROVISIONING_STEPS,
  );
  const provisioningRun = provisioningSteps?.run;
  const isProvisioningRunning =
    provisioningStatus === TENANT_PROVISIONING_STATUS.PROVISIONING;
  const overallStepStatus =
    OVERALL_STATUS_PRIORITY.find((candidate) =>
      stepStatuses.includes(candidate),
    ) ?? TENANT_PROVISIONING_STEP_STATUS.IDLE;
  const isOverallFailed =
    overallStepStatus === TENANT_PROVISIONING_STEP_STATUS.FAILED &&
    provisioningStatus === TENANT_PROVISIONING_STATUS.FAILED;
  const failedStep = isOverallFailed
    ? findFailedStep(stepStatuses, CORE_PROVISIONING_STEPS)
    : undefined;
  const failedStepError = failedStep
    ? provisioningSteps?.[failedStep]?.error
    : undefined;

  return {
    stepStatuses,
    // A retry keeps the previous run's FAILED entries until the runner reaches them again.
    displayStepStatuses: isProvisioningRunning
      ? stepStatuses.map((status) =>
          status === TENANT_PROVISIONING_STEP_STATUS.FAILED
            ? TENANT_PROVISIONING_STEP_STATUS.IDLE
            : status,
        )
      : stepStatuses,
    stepUpdatedAt: stepUpdatedAtFor(provisioningSteps, CORE_PROVISIONING_STEPS),
    provisioningRun,
    allIdle: stepStatuses.every(
      (status) => status === TENANT_PROVISIONING_STEP_STATUS.IDLE,
    ),
    isProvisioningRunning,
    // The runner's start replaces the whole run entry, dropping the admission stamp.
    isAwaitingRunner:
      isProvisioningRunning && provisioningRun?.admittedAt !== undefined,
    isOverallFailed,
    displayOverallStatus: isProvisioningRunning
      ? TENANT_PROVISIONING_STEP_STATUS.RUNNING
      : overallStepStatus,
    failedStepError,
    errorKind: isOverallFailed
      ? classifyProvisioningError(failedStepError)
      : undefined,
    ownerElevationOutcome:
      provisioningSteps?.[TENANT_PROVISIONING_STEP.OWNER_ELEVATION]?.detail,
  };
};
