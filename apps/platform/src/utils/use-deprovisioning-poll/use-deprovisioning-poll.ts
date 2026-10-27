'use client';

import type { TMaybeUndefined } from '@blog/config';
import {
  CORE_DEPROVISIONING_STEPS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TDeprovisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import type {
  TDeprovisioningRun,
  TTenantDeprovisioningState,
} from '@blog/db/schema/tenants';
import { getTenantDeprovisioningStatusAction } from '@platform/server/provisioning/get-tenant-deprovisioning-status-action';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  classifyProvisioningError,
  type TProvisioningErrorKind,
} from '@platform/utils/provisioning-error/provisioning-error';
import {
  findFailedStep,
  stepStatusesFor,
  stepUpdatedAtFor,
} from '@platform/utils/run-steps/run-steps';
import { useDocumentVisible } from '@platform/utils/use-document-visible/use-document-visible';
import { useEffect, useRef, useState } from 'react';

export const STEP_POLL_INTERVAL_MS = 4000;
// ~5 minutes: bounds a crashed runner, well past any realistic teardown.
export const MAX_POLL_TICKS = 75;

const OVERALL_STATUS_PRIORITY: TTenantProvisioningStepStatus[] = [
  TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  TENANT_PROVISIONING_STEP_STATUS.FAILED,
  TENANT_PROVISIONING_STEP_STATUS.DONE,
];

const deriveOverallStatus = (
  statuses: TTenantProvisioningStepStatus[],
): TTenantProvisioningStepStatus => {
  return (
    OVERALL_STATUS_PRIORITY.find((candidate) => statuses.includes(candidate)) ??
    TENANT_PROVISIONING_STEP_STATUS.IDLE
  );
};

const isTerminalOverallStatus = (
  status: TTenantProvisioningStepStatus,
): boolean =>
  status === TENANT_PROVISIONING_STEP_STATUS.DONE ||
  status === TENANT_PROVISIONING_STEP_STATUS.FAILED;

// A dispatch newer than the last run is a retry not yet reported, even over a stale FAILED run.
const isRetryPending = (
  deprovisionRequestedAt: TMaybeUndefined<string>,
  run: TMaybeUndefined<TDeprovisioningRun>,
): boolean => {
  if (!deprovisionRequestedAt) {
    return false;
  }
  const lastRunAt = run?.finishedAt ?? run?.startedAt;
  return (
    !lastRunAt ||
    new Date(deprovisionRequestedAt).getTime() > new Date(lastRunAt).getTime()
  );
};

export type TUseDeprovisioningPollResult = {
  deprovisioningSteps: TTenantDeprovisioningState | null;
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
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [polledDeprovisioningSteps, setPolledDeprovisioningSteps] =
    useState<TTenantDeprovisioningState | null>(tenant.deprovisioningSteps);
  const pollTicksRef = useRef(0);
  const isVisible = useDocumentVisible();

  if (tenant !== renderedTenant) {
    setRenderedTenant(tenant);
    setPolledDeprovisioningSteps(tenant.deprovisioningSteps);
  }

  const deprovisioningSteps = isRetryPending(
    deprovisionRequestedAt,
    polledDeprovisioningSteps?.run,
  )
    ? null
    : polledDeprovisioningSteps;

  const stepStatuses = stepStatusesFor(
    deprovisioningSteps,
    CORE_DEPROVISIONING_STEPS,
  );
  const overallStatus = deriveOverallStatus(stepStatuses);
  const isRunning = overallStatus === TENANT_PROVISIONING_STEP_STATUS.RUNNING;
  const isInProgress = isEnabled && !isTerminalOverallStatus(overallStatus);
  const shouldPoll = isInProgress && isVisible;

  useEffect(() => {
    pollTicksRef.current = 0;
  }, [tenant]);

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    let cancelled = false;

    const intervalId = setInterval(() => {
      pollTicksRef.current += 1;
      if (pollTicksRef.current > MAX_POLL_TICKS) {
        clearInterval(intervalId);
        return;
      }

      void getTenantDeprovisioningStatusAction(tenant.id)
        .then((result) => {
          if (cancelled || !result) {
            return;
          }
          setPolledDeprovisioningSteps(result.deprovisioningSteps);
        })
        // A rejected tick (an expired-session redirect) leaves the next tick to retry.
        .catch(() => {});
    }, STEP_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [tenant.id, shouldPoll]);

  const stepUpdatedAt = stepUpdatedAtFor(
    deprovisioningSteps,
    CORE_DEPROVISIONING_STEPS,
  );
  const run = deprovisioningSteps?.run;
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
