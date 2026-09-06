'use client';

import {
  CORE_DEPROVISIONING_STEPS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TDeprovisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import type {
  TDeprovisioningRun,
  TTenant,
  TTenantDeprovisioningState,
} from '@blog/db/schema/tenants';
import { getTenantDeprovisioningStatusAction } from '@platform/server/provisioning/get-tenant-deprovisioning-status-action';
import {
  classifyProvisioningError,
  type TProvisioningErrorKind,
} from '@platform/utils/provisioning-error/provisioning-error';
import { useEffect, useRef, useState } from 'react';

export const STEP_ORDER = CORE_DEPROVISIONING_STEPS;

const STEP_POLL_INTERVAL_MS = 4000;
// A stuck run (a crashed runner that never reports a terminal step) would
// otherwise poll forever for as long as the tab stays open — this caps how
// long a non-terminal run keeps being polled, comfortably past any realistic
// teardown duration.
const STALE_RUN_MAX_TICKS = 75; // ~5 minutes at STEP_POLL_INTERVAL_MS

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
): (string | undefined)[] =>
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

export type TUseDeprovisioningPollResult = {
  deprovisioningSteps: TTenantDeprovisioningState | null;
  stepStatuses: TTenantProvisioningStepStatus[];
  stepUpdatedAt: (string | undefined)[];
  run: TDeprovisioningRun | undefined;
  overallStatus: TTenantProvisioningStepStatus;
  isRunning: boolean;
  isFailed: boolean;
  isDone: boolean;
  failedStep: TDeprovisioningStep | undefined;
  failedStepError: string | undefined;
  errorKind: TProvisioningErrorKind | undefined;
};

/**
 * Owns `DeprovisioningStatusView`'s live behaviour: polling the tenant's
 * deprovisioning step map while a run is in progress, and the
 * derived overall-status/error values the view renders from it. There is no
 * start/retry dispatch to model here — re-dispatch happens through
 * `DeprovisionTenantControl`.
 */
export const useDeprovisioningPoll = (
  tenant: TTenant,
): TUseDeprovisioningPollResult => {
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [deprovisioningSteps, setDeprovisioningSteps] =
    useState<TTenantDeprovisioningState | null>(tenant.deprovisioningSteps);
  const staleTicksRef = useRef(0);

  if (tenant !== renderedTenant) {
    setRenderedTenant(tenant);
    setDeprovisioningSteps(tenant.deprovisioningSteps);
  }

  const stepStatuses = stepStatusesFor(deprovisioningSteps);
  const overallStatus = deriveOverallStatus(stepStatuses);
  const isRunning = !isTerminalOverallStatus(overallStatus);

  useEffect(() => {
    staleTicksRef.current = 0;
  }, [tenant]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    let cancelled = false;

    const intervalId = setInterval(() => {
      staleTicksRef.current += 1;
      if (staleTicksRef.current > STALE_RUN_MAX_TICKS) {
        clearInterval(intervalId);
        return;
      }

      void getTenantDeprovisioningStatusAction(tenant.id)
        .then((result) => {
          if (cancelled || !result) {
            return;
          }
          setDeprovisioningSteps(result.deprovisioningSteps);
        })
        .catch(() => {
          // A rejected tick (e.g. an expired-session redirect thrown by
          // `requireSuperAdmin()`) must not kill polling — the next
          // interval tick retries on its own.
        });
    }, STEP_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [tenant.id, isRunning]);

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
    isFailed,
    isDone,
    failedStep: failedStepEntry,
    failedStepError,
    errorKind,
  };
};
