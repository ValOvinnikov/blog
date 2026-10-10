'use client';

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
  TTenant,
  TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import { useToast } from '@platform/context/toast-provider';
import { getTenantProvisioningStatusAction } from '@platform/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@platform/server/provisioning/retry-provisioning-step-action';
import {
  classifyProvisioningError,
  type TProvisioningErrorKind,
} from '@platform/utils/provisioning-error/provisioning-error';
import { useDocumentVisible } from '@platform/utils/use-document-visible/use-document-visible';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef, useTransition } from 'react';

export const STEP_ORDER = CORE_PROVISIONING_STEPS;

const OVERALL_STATUS_PRIORITY: TTenantProvisioningStepStatus[] = [
  TENANT_PROVISIONING_STEP_STATUS.FAILED,
  TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  TENANT_PROVISIONING_STEP_STATUS.IDLE,
  TENANT_PROVISIONING_STEP_STATUS.DONE,
];

const STEP_POLL_INTERVAL_MS = 4000;
// Outlasts the workflow's 20-minute job timeout plus runner pickup, so only a
// runner that stopped reporting reaches it.
const MAX_POLL_TICKS = 375; // 25 minutes of visible polling at STEP_POLL_INTERVAL_MS

const stepStatusesFor = (
  steps: TTenantProvisioningState | null,
): TTenantProvisioningStepStatus[] =>
  STEP_ORDER.map(
    (stepKey) =>
      steps?.[stepKey]?.status ?? TENANT_PROVISIONING_STEP_STATUS.IDLE,
  );

const stepUpdatedAtFor = (
  steps: TTenantProvisioningState | null,
): (string | undefined)[] =>
  STEP_ORDER.map((stepKey) => steps?.[stepKey]?.updatedAt);

type TDispatchNoticeKind =
  'not-found' | 'archived' | 'already-in-progress' | 'other';

export type TUseProvisioningPollResult = {
  dispatchNotice: TDispatchNoticeKind | undefined;
  isStarting: boolean;
  isRetrying: boolean;
  handleStart: () => void;
  handleRetry: () => void;
  provisioningStatus: TTenantProvisioningStatus | null;
  provisioningSteps: TTenantProvisioningState | null;
  stepStatuses: TTenantProvisioningStepStatus[];
  displayStepStatuses: TTenantProvisioningStepStatus[];
  stepUpdatedAt: (string | undefined)[];
  provisioningRun: TProvisioningRun | undefined;
  allIdle: boolean;
  isProvisioningRunning: boolean;
  isOverallFailed: boolean;
  displayOverallStatus: Exclude<TTenantProvisioningStepStatus, 'FAILED'>;
  failedStepError: string | undefined;
  errorKind: TProvisioningErrorKind | undefined;
  ownerElevationOutcome: TElevateTenantOwnerOutcome | undefined;
};

export const useProvisioningPoll = (
  tenant: TTenant,
): TUseProvisioningPollResult => {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('provisioningStatusView');
  // Non-null while the current pollErrorWarning toast is showing, so a
  // recovering tick dismisses the exact toast a failing one raised.
  const pollErrorToastIdRef = useRef<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [dispatchNotice, setDispatchNotice] = useState<
    TDispatchNoticeKind | undefined
  >(undefined);
  const [, startTransition] = useTransition();
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [polledProvisioningStatus, setPolledProvisioningStatus] =
    useState<TTenantProvisioningStatus | null>(tenant.provisioningStatus);
  const [provisioningSteps, setProvisioningSteps] =
    useState<TTenantProvisioningState | null>(tenant.provisioningSteps);
  const [pollTicks, setPollTicks] = useState(0);
  const isVisible = useDocumentVisible();

  if (tenant !== renderedTenant) {
    setRenderedTenant(tenant);
    setPolledProvisioningStatus(tenant.provisioningStatus);
    setProvisioningSteps(tenant.provisioningSteps);
    setPollTicks(0);
  }

  // The status only turns PROVISIONING once the dispatch's own round trip
  // resolves, so the in-flight click stands in for it until then.
  const isDispatchPending = isStarting || isRetrying;
  const provisioningStatus = isDispatchPending
    ? TENANT_PROVISIONING_STATUS.PROVISIONING
    : polledProvisioningStatus;
  const isProvisioningRunning =
    provisioningStatus === TENANT_PROVISIONING_STATUS.PROVISIONING;
  const shouldPoll =
    isProvisioningRunning && isVisible && pollTicks < MAX_POLL_TICKS;

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    let cancelled = false;

    const intervalId = setInterval(() => {
      setPollTicks((ticks) => ticks + 1);

      void getTenantProvisioningStatusAction(tenant.id)
        .then((result) => {
          if (cancelled || !result) {
            return;
          }
          if (pollErrorToastIdRef.current) {
            toast.dismiss(pollErrorToastIdRef.current);
            pollErrorToastIdRef.current = null;
          }
          setPolledProvisioningStatus(result.provisioningStatus);
          setProvisioningSteps(result.provisioningSteps);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          if (!pollErrorToastIdRef.current) {
            pollErrorToastIdRef.current = toast.warning({
              message: t('pollErrorWarning'),
            });
          }
        });
    }, STEP_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [tenant.id, shouldPoll, toast, t]);

  const stepStatuses = stepStatusesFor(provisioningSteps);
  const stepUpdatedAt = stepUpdatedAtFor(provisioningSteps);
  const provisioningRun = provisioningSteps?.run;
  const allIdle = stepStatuses.every(
    (status) => status === TENANT_PROVISIONING_STEP_STATUS.IDLE,
  );
  // `OVERALL_STATUS_PRIORITY` covers every step status, so this always matches.
  const overallStepStatus = OVERALL_STATUS_PRIORITY.find((candidate) =>
    stepStatuses.includes(candidate),
  ) as TTenantProvisioningStepStatus;

  // A retry leaves the previous run's FAILED entry in place until the runner
  // reaches that step again, so it must not read as a current failure.
  const displayStepStatuses = isProvisioningRunning
    ? stepStatuses.map((status) =>
        status === TENANT_PROVISIONING_STEP_STATUS.FAILED
          ? TENANT_PROVISIONING_STEP_STATUS.IDLE
          : status,
      )
    : stepStatuses;

  const isOverallFailed =
    overallStepStatus === TENANT_PROVISIONING_STEP_STATUS.FAILED &&
    provisioningStatus === TENANT_PROVISIONING_STATUS.FAILED;
  const failedStepError = isOverallFailed
    ? STEP_ORDER.map((stepKey) => provisioningSteps?.[stepKey]).find(
        (stepState) =>
          stepState?.status === TENANT_PROVISIONING_STEP_STATUS.FAILED,
      )?.error
    : undefined;
  const errorKind = isOverallFailed
    ? classifyProvisioningError(failedStepError)
    : undefined;

  const ownerElevationOutcome =
    provisioningSteps?.[TENANT_PROVISIONING_STEP.OWNER_ELEVATION]?.detail;

  const displayOverallStatus = (
    isProvisioningRunning
      ? TENANT_PROVISIONING_STEP_STATUS.RUNNING
      : overallStepStatus
  ) as Exclude<TTenantProvisioningStepStatus, 'FAILED'>;

  const runProvisioningDispatch = (setPending: (pending: boolean) => void) => {
    setDispatchNotice(undefined);
    setPending(true);
    setPollTicks(0);
    startTransition(async () => {
      const result = await retryProvisioningStepAction(tenant.id);

      if (
        result.outcome === 'dispatched' ||
        result.outcome === 'already-in-progress'
      ) {
        setPolledProvisioningStatus(TENANT_PROVISIONING_STATUS.PROVISIONING);
        router.refresh();
      }
      if (result.outcome !== 'dispatched') {
        setDispatchNotice(
          result.outcome === 'dispatch-error' ? 'other' : result.outcome,
        );
      }

      setPending(false);
    });
  };

  const handleRetry = () => runProvisioningDispatch(setIsRetrying);
  const handleStart = () => runProvisioningDispatch(setIsStarting);

  return {
    dispatchNotice,
    isStarting,
    isRetrying,
    handleStart,
    handleRetry,
    provisioningStatus,
    provisioningSteps,
    stepStatuses,
    displayStepStatuses,
    stepUpdatedAt,
    provisioningRun,
    allIdle,
    isProvisioningRunning,
    isOverallFailed,
    displayOverallStatus,
    failedStepError,
    errorKind,
    ownerElevationOutcome,
  };
};
