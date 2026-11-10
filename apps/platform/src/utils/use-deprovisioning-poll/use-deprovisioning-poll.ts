'use client';

import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import {
  CORE_DEPROVISIONING_STEPS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TDeprovisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import type { TTenantDeprovisioningStatusResult } from '@blog/db/queries/tenants/get-tenant-deprovisioning-status';
import type {
  TDeprovisioningRun,
  TTenantDeprovisioningState,
} from '@blog/db/schema/tenants';
import { getTenantDeprovisioningStatusAction } from '@platform/server/provisioning/get-tenant-deprovisioning-status-action';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  deprovisioningOverallStatus,
  isRetryPending,
} from '@platform/utils/deprovisioning-run-state/deprovisioning-run-state';
import {
  classifyProvisioningError,
  type TProvisioningErrorKind,
} from '@platform/utils/provisioning-error/provisioning-error';
import {
  findFailedStep,
  stepStatusesFor,
  stepUpdatedAtFor,
} from '@platform/utils/run-steps/run-steps';
import { usePolledValue } from '@platform/utils/use-polled-value/use-polled-value';
import { useRouter } from 'next/navigation';

export const STEP_POLL_INTERVAL_MS = 4000;
// ~5 minutes: bounds a crashed runner, well past any realistic teardown.
export const MAX_POLL_TICKS = 75;

export type TUseDeprovisioningPollResult = {
  deprovisioningSteps: TMaybeNull<TTenantDeprovisioningState>;
  stepStatuses: TTenantProvisioningStepStatus[];
  stepUpdatedAt: TMaybeUndefined<string>[];
  run: TMaybeUndefined<TDeprovisioningRun>;
  overallStatus: TTenantProvisioningStepStatus;
  isRunning: boolean;
  isInProgress: boolean;
  isFailed: boolean;
  isDone: boolean;
  failedStep: TMaybeUndefined<TDeprovisioningStep>;
  failedStepError: TMaybeUndefined<string>;
  errorKind: TMaybeUndefined<TProvisioningErrorKind>;
};

export type TUseDeprovisioningPollOptions = {
  isEnabled: boolean;
  deprovisionRequestedAt?: string;
};

export const useDeprovisioningPoll = (
  tenant: TClientTenant,
  { isEnabled, deprovisionRequestedAt }: TUseDeprovisioningPollOptions,
): TUseDeprovisioningPollResult => {
  const router = useRouter();

  const currentRunSteps = (steps: TMaybeNull<TTenantDeprovisioningState>) =>
    isRetryPending(deprovisionRequestedAt, steps?.run) ? null : steps;
  const isFinished = (steps: TMaybeNull<TTenantDeprovisioningState>) =>
    Boolean(currentRunSteps(steps)?.run?.finishedAt);

  const {
    value: { deprovisioningSteps: polledDeprovisioningSteps },
  } = usePolledValue<TTenantDeprovisioningStatusResult>(
    tenant.id,
    tenant,
    getTenantDeprovisioningStatusAction,
    {
      intervalMs: STEP_POLL_INTERVAL_MS,
      maxTicks: MAX_POLL_TICKS,
      isActive: (polled) =>
        isEnabled && !isFinished(polled.deprovisioningSteps),
      onResult: (polled) => {
        if (isFinished(polled.deprovisioningSteps)) {
          router.refresh();
        }
      },
    },
  );

  const deprovisioningSteps = currentRunSteps(polledDeprovisioningSteps);
  const run = deprovisioningSteps?.run;
  const stepStatuses = stepStatusesFor(
    deprovisioningSteps,
    CORE_DEPROVISIONING_STEPS,
  );
  const overallStatus = deprovisioningOverallStatus(stepStatuses, run);
  const isRunning = overallStatus === TENANT_PROVISIONING_STEP_STATUS.RUNNING;
  const isInProgress = isEnabled && !isFinished(polledDeprovisioningSteps);
  const stepUpdatedAt = stepUpdatedAtFor(
    deprovisioningSteps,
    CORE_DEPROVISIONING_STEPS,
  );
  const isFailed = overallStatus === TENANT_PROVISIONING_STEP_STATUS.FAILED;
  const isDone = overallStatus === TENANT_PROVISIONING_STEP_STATUS.DONE;

  const failedStep = isFailed
    ? findFailedStep(stepStatuses, CORE_DEPROVISIONING_STEPS)
    : undefined;
  const failedStepError = failedStep
    ? deprovisioningSteps?.[failedStep]?.error
    : undefined;
  const errorKind = isFailed
    ? classifyProvisioningError(failedStepError)
    : undefined;

  return {
    deprovisioningSteps,
    stepStatuses,
    stepUpdatedAt,
    run,
    overallStatus,
    isRunning,
    isInProgress,
    isFailed,
    isDone,
    failedStep,
    failedStepError,
    errorKind,
  };
};
