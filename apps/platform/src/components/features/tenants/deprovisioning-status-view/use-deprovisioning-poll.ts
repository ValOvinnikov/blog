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
import { useDocumentVisible } from '@platform/utils/use-document-visible/use-document-visible';
import { useEffect, useRef, useState } from 'react';

export const STEP_ORDER = CORE_DEPROVISIONING_STEPS;

const STEP_POLL_INTERVAL_MS = 4000;
// Bounds a run that never reports a terminal step (a crashed runner),
// comfortably past any realistic teardown duration.
const MAX_POLL_TICKS = 75; // ~5 minutes of visible polling at STEP_POLL_INTERVAL_MS

const OVERALL_STATUS_PRIORITY: TTenantProvisioningStepStatus[] = [
  TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  TENANT_PROVISIONING_STEP_STATUS.FAILED,
  TENANT_PROVISIONING_STEP_STATUS.DONE,
];

const stepStatusesFor = (
  steps: TTenantDeprovisioningState | null,
): TTenantProvisioningStepStatus[] =>
  STEP_ORDER.map(
    (stepKey) =>
      steps?.[stepKey]?.status ?? TENANT_PROVISIONING_STEP_STATUS.IDLE,
  );

const stepUpdatedAtFor = (
  steps: TTenantDeprovisioningState | null,
): TMaybeUndefined<string>[] =>
  STEP_ORDER.map((stepKey) => steps?.[stepKey]?.updatedAt);

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

// A dispatch that postdates the tenant's own last run (its `finishedAt`, or
// `startedAt` for one still in flight) is a retry the workflow hasn't
// reported in on yet — including one dispatched over a stale FAILED run.
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

  const stepStatuses = stepStatusesFor(deprovisioningSteps);
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

  const stepUpdatedAt = stepUpdatedAtFor(deprovisioningSteps);
  const run = deprovisioningSteps?.run;
  const isFailed = overallStatus === TENANT_PROVISIONING_STEP_STATUS.FAILED;
  const isDone = overallStatus === TENANT_PROVISIONING_STEP_STATUS.DONE;

  const failedStepEntry = isFailed
    ? STEP_ORDER.find(
        (stepKey) =>
          deprovisioningSteps?.[stepKey]?.status ===
          TENANT_PROVISIONING_STEP_STATUS.FAILED,
      )
    : undefined;
  const failedStepError = failedStepEntry
    ? deprovisioningSteps?.[failedStepEntry]?.error
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
    failedStep: failedStepEntry,
    failedStepError,
    errorKind,
  };
};
