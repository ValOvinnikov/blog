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
import type { TDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { getDomainVerificationStatusAction } from '@platform/server/provisioning/get-domain-verification-status-action';
import { getTenantProvisioningStatusAction } from '@platform/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@platform/server/provisioning/retry-provisioning-step-action';
import {
  classifyProvisioningError,
  type TProvisioningErrorKind,
} from '@platform/utils/provisioning-error/provisioning-error';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef, useTransition } from 'react';

export const STEP_ORDER = CORE_PROVISIONING_STEPS;

// Highest-priority status wins: any FAILED step outranks a RUNNING one, which
// outranks a still-IDLE one, so the overall status always reflects the most
// urgent thing happening across the whole run rather than the last step
// polled. `provisioningStatus` itself can't be used for this — the DB column
// only settles to READY/FAILED once the *last* step finishes, so a failure
// partway through the sequence would otherwise never surface here.
const OVERALL_STATUS_PRIORITY: TTenantProvisioningStepStatus[] = [
  TENANT_PROVISIONING_STEP_STATUS.FAILED,
  TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  TENANT_PROVISIONING_STEP_STATUS.IDLE,
  TENANT_PROVISIONING_STEP_STATUS.DONE,
];

const STEP_POLL_INTERVAL_MS = 4000;
// The domain check makes a live Vercel API call with its own 5s timeout —
// slower and less urgent than step polling — so it runs on a longer,
// independent interval rather than sharing the step interval and risking
// overlapping in-flight requests.
const DOMAIN_POLL_INTERVAL_MS = 10000;
// A GitHub Actions dispatch-to-runner-pickup normally resolves in well under
// a minute, but during an outage, a disabled workflow, or a permissions
// failure it may never resolve at all — this caps how long a retry/start
// keeps polling against an unchanged pre-retry snapshot before giving up on
// it, comfortably exceeding realistic pickup latency.
const RETRY_BASELINE_MAX_TICKS = 75; // ~5 minutes at STEP_POLL_INTERVAL_MS

const isTerminalProvisioningStatus = (
  status: TTenantProvisioningStatus | null,
): boolean => {
  return (
    status === TENANT_PROVISIONING_STATUS.READY ||
    status === TENANT_PROVISIONING_STATUS.FAILED
  );
};

const shouldContinuePolling = (
  status: TTenantProvisioningStatus | null,
  steps: TTenantProvisioningState | null,
): boolean => {
  if (isTerminalProvisioningStatus(status)) {
    return false;
  }

  const statuses = stepStatusesFor(steps);
  const hasRunningStep = statuses.includes(
    TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  );
  const hasFailedStep = statuses.includes(
    TENANT_PROVISIONING_STEP_STATUS.FAILED,
  );

  // A failed step with nothing else running means the run is stuck and
  // nothing further will happen until an operator retries —
  // `provisioningStatus` never reflects this on its own (it only settles to
  // FAILED once the *last* step fails), so it has to be read off the steps
  // directly rather than off the column.
  return !(hasFailedStep && !hasRunningStep);
};

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

const stepStatusesEqual = (
  a: TTenantProvisioningStepStatus[],
  b: TTenantProvisioningStepStatus[],
): boolean => a.length === b.length && a.every((status, i) => status === b[i]);

const isTerminalDomainVerificationStatus = (
  status: TDomainVerificationStatus,
): boolean => {
  return status === 'VERIFIED' || status === 'NOT_CONFIGURED';
};

type TDispatchNoticeKind =
  'not-found' | 'archived' | 'already-in-progress' | 'other';

export type TUseProvisioningPollResult = {
  /** Non-undefined when the last Start/Retry dispatch didn't result in a fresh run — `already-in-progress` means one is genuinely in flight, the rest are real failures. */
  dispatchNotice: TDispatchNoticeKind | undefined;
  isStarting: boolean;
  isRetrying: boolean;
  handleStart: () => void;
  handleRetry: () => void;
  provisioningStatus: TTenantProvisioningStatus | null;
  provisioningSteps: TTenantProvisioningState | null;
  /** `PROVISIONING` while a Start/Retry dispatch is in flight, whatever the last-polled status was. */
  effectiveProvisioningStatus: TTenantProvisioningStatus | null;
  stepStatuses: TTenantProvisioningStepStatus[];
  /** `stepStatuses`, but with any stale FAILED entry masked to IDLE while `isProvisioningRunning` — what the step list should actually render. */
  displayStepStatuses: TTenantProvisioningStepStatus[];
  /** Each step's last status-change timestamp, parallel to `stepStatuses` and `STEP_ORDER` — `undefined` for a step with none recorded. */
  stepUpdatedAt: (string | undefined)[];
  /** The overall run this set of steps belongs to — `undefined` for a tenant that has never been provisioned, or one provisioned before this field existed. */
  provisioningRun: TProvisioningRun | undefined;
  allIdle: boolean;
  isProvisioningRunning: boolean;
  overallStepStatus: TTenantProvisioningStepStatus;
  /** True only when the tenant's own `effectiveProvisioningStatus` is also FAILED — a step still showing FAILED from a prior run while a retry is genuinely in progress does not count. */
  isOverallFailed: boolean;
  displayOverallStatus: Exclude<TTenantProvisioningStepStatus, 'FAILED'>;
  failedStepError: string | undefined;
  errorKind: TProvisioningErrorKind | undefined;
  domainStatus: TDomainVerificationStatus;
  /** The most recent `elevateTenantOwner` check's outcome, independent of the five-step sequence above. `undefined` before any check has run. */
  ownerElevationOutcome: TElevateTenantOwnerOutcome | undefined;
};

/**
 * Owns the status page's live behaviour: step-status polling (with its own
 * stop/continue rules), the slower independent domain-verification poll,
 * the Start/Retry dispatch flow, and the derived overall-status/error-kind
 * values every one of those feeds into. The component consuming this only
 * renders what it returns.
 */
export const useProvisioningPoll = (
  tenant: TTenant,
  // Optional for a caller with nothing to say about the domain (e.g.
  // `ProvisioningStatusView`, which no longer renders a domain card) —
  // `NOT_CONFIGURED` is a terminal status, so the domain poll effect below
  // never actually starts for it.
  domainVerificationStatus: TDomainVerificationStatus = 'NOT_CONFIGURED',
): TUseProvisioningPollResult => {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('provisioningStatusView');
  // Non-null while the current pollErrorWarning toast is showing — lets a
  // later recovering tick dismiss the exact toast a failing one raised,
  // rather than leaving it to its own auto-dismiss timer.
  const pollErrorToastIdRef = useRef<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [dispatchNotice, setDispatchNotice] = useState<
    TDispatchNoticeKind | undefined
  >(undefined);
  const [, startTransition] = useTransition();
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [provisioningStatus, setProvisioningStatus] =
    useState<TTenantProvisioningStatus | null>(tenant.provisioningStatus);
  const [provisioningSteps, setProvisioningSteps] =
    useState<TTenantProvisioningState | null>(tenant.provisioningSteps);
  // The poll loop's own on/off switch — only a poll tick may turn it off.
  const [isPollingActive, setIsPollingActive] = useState(() =>
    shouldContinuePolling(tenant.provisioningStatus, tenant.provisioningSteps),
  );
  // Non-null while waiting to see the retried/started workflow actually take
  // effect: the snapshot of step statuses as of the moment Retry/Start was
  // pressed. A dispatch only acknowledges GitHub's receipt of the request,
  // not a runner picking it up — often well past one poll interval — so the
  // very next tick usually still reflects this same pre-retry snapshot. The
  // poll tick keeps polling active against an unchanged snapshot and only
  // resumes normal stop/continue decisions once the fetched steps genuinely
  // differ from it.
  const [pendingRetryBaseline, setPendingRetryBaseline] = useState<
    TTenantProvisioningStepStatus[] | null
  >(null);
  // Consecutive poll ticks that have matched `pendingRetryBaseline` so far —
  // a ref rather than state because it must not itself trigger a re-render
  // or reset the poll interval; it only gates whether the cap below has
  // been reached. Reset whenever a fresh baseline is recorded.
  const pendingRetryTicksRef = useRef(0);
  const [renderedDomainStatus, setRenderedDomainStatus] = useState(
    domainVerificationStatus,
  );
  const [domainStatus, setDomainStatus] = useState<TDomainVerificationStatus>(
    domainVerificationStatus,
  );

  // A fresh `tenant`/`domainVerificationStatus` argument (e.g. after a
  // Retry, Start, or details save's own `router.refresh()`) should win over
  // whatever polling last saw — adjusted during render, per React's
  // guidance for state derived from props, rather than in an effect.
  if (tenant !== renderedTenant) {
    setRenderedTenant(tenant);
    setProvisioningStatus(tenant.provisioningStatus);
    setProvisioningSteps(tenant.provisioningSteps);
    setIsPollingActive(
      (prev) =>
        prev ||
        shouldContinuePolling(
          tenant.provisioningStatus,
          tenant.provisioningSteps,
        ),
    );
  }
  if (domainVerificationStatus !== renderedDomainStatus) {
    setRenderedDomainStatus(domainVerificationStatus);
    setDomainStatus(domainVerificationStatus);
  }

  useEffect(() => {
    if (!isPollingActive) {
      return;
    }

    let cancelled = false;

    const intervalId = setInterval(() => {
      void getTenantProvisioningStatusAction(tenant.id)
        .then((result) => {
          if (cancelled || !result) {
            return;
          }
          if (pollErrorToastIdRef.current) {
            toast.dismiss(pollErrorToastIdRef.current);
            pollErrorToastIdRef.current = null;
          }
          setProvisioningStatus(result.provisioningStatus);
          setProvisioningSteps(result.provisioningSteps);

          const freshStatuses = stepStatusesFor(result.provisioningSteps);
          if (
            pendingRetryBaseline &&
            stepStatusesEqual(freshStatuses, pendingRetryBaseline)
          ) {
            pendingRetryTicksRef.current += 1;
            if (pendingRetryTicksRef.current < RETRY_BASELINE_MAX_TICKS) {
              // Unchanged since Retry/Start was pressed — the dispatch only
              // confirms GitHub received the request, not that a runner has
              // picked it up yet, so this read alone can't tell "never"
              // apart from "not yet". Keep watching rather than stop on a
              // snapshot that predates the retry, up to the cap above.
              return;
            }
            // Cap reached — that alone is proof nothing is happening, so
            // stop unconditionally rather than deferring to
            // `shouldContinuePolling`, which never stops on an all-IDLE
            // snapshot (the pre-Start case) and would otherwise poll
            // forever.
            setPendingRetryBaseline(null);
            setIsPollingActive(false);
            return;
          }

          setPendingRetryBaseline(null);
          setIsPollingActive(
            shouldContinuePolling(
              result.provisioningStatus,
              result.provisioningSteps,
            ),
          );
        })
        .catch(() => {
          // A rejected tick (e.g. an expired-session redirect thrown by
          // `requireAdmin()`) must not silently kill polling — the interval
          // itself already retries on its own next tick; this only makes
          // the stall visible instead of leaving the last-known state
          // looking current. A toast — not layout — carries this: it's
          // transient and self-correcting, and one already showing isn't
          // replaced by a repeat.
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
  }, [tenant.id, isPollingActive, pendingRetryBaseline, toast, t]);

  useEffect(() => {
    if (isTerminalDomainVerificationStatus(domainStatus)) {
      return;
    }

    let cancelled = false;

    const intervalId = setInterval(() => {
      void getDomainVerificationStatusAction(tenant.id).then((result) => {
        if (cancelled) {
          return;
        }
        setDomainStatus(result);
      });
    }, DOMAIN_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [tenant.id, domainStatus]);

  const stepStatuses = stepStatusesFor(provisioningSteps);
  const stepUpdatedAt = stepUpdatedAtFor(provisioningSteps);
  const provisioningRun = provisioningSteps?.run;
  const allIdle = stepStatuses.every(
    (status) => status === TENANT_PROVISIONING_STEP_STATUS.IDLE,
  );
  // `OVERALL_STATUS_PRIORITY` covers every possible step status, so this
  // always matches — there is no real "not found" case to fall back from.
  const overallStepStatus = OVERALL_STATUS_PRIORITY.find((candidate) =>
    stepStatuses.includes(candidate),
  ) as TTenantProvisioningStepStatus;

  // A dispatch has been requested but the runner hasn't reported a step yet
  // — `provisioningStatus` itself won't reflect this until the Server
  // Action's own `beginTenantProvisioning` call resolves and a refresh (or
  // poll) picks it up, which can lag a slow GitHub dispatch by seconds.
  // Treating the in-flight click itself as "running" is what makes the
  // badge, the field locks, and the Start button react immediately instead
  // of only once the round trip completes.
  const isDispatchPending = isStarting || isRetrying;
  const effectiveProvisioningStatus = isDispatchPending
    ? TENANT_PROVISIONING_STATUS.PROVISIONING
    : provisioningStatus;
  const isProvisioningRunning =
    effectiveProvisioningStatus === TENANT_PROVISIONING_STATUS.PROVISIONING;

  // `beginTenantProvisioning` deliberately never clears a step's FAILED entry
  // when it admits a retry — it isn't overwritten until `run.ts`'s loop
  // reaches that step again. While a run is genuinely live, that leftover
  // FAILED entry must not read as a current failure, so it's masked back to
  // IDLE rather than re-deriving per-step recency client-side.
  const displayStepStatuses = isProvisioningRunning
    ? stepStatuses.map((status) =>
        status === TENANT_PROVISIONING_STEP_STATUS.FAILED
          ? TENANT_PROVISIONING_STEP_STATUS.IDLE
          : status,
      )
    : stepStatuses;

  // `effectiveProvisioningStatus` is the authoritative "is this failure
  // current" signal (it settles to FAILED the moment any step actually
  // fails) — a stale per-step FAILED entry alone must not count.
  const isOverallFailed =
    overallStepStatus === TENANT_PROVISIONING_STEP_STATUS.FAILED &&
    effectiveProvisioningStatus === TENANT_PROVISIONING_STATUS.FAILED;
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

  // A run in progress always displays as RUNNING, regardless of `allIdle` —
  // a stale FAILED step can coexist with a genuinely live run (this is the
  // retry-in-progress case), and must not keep the badge stuck on it.
  const displayOverallStatus = (
    isProvisioningRunning
      ? TENANT_PROVISIONING_STEP_STATUS.RUNNING
      : overallStepStatus
  ) as Exclude<TTenantProvisioningStepStatus, 'FAILED'>;

  const runProvisioningDispatch = (setPending: (pending: boolean) => void) => {
    setDispatchNotice(undefined);
    setPending(true);
    // Force polling back on immediately, and record what the steps look
    // like right now — the re-dispatched workflow hasn't actually started
    // yet, so the poll tick needs this snapshot to recognise "no change
    // observed yet" and keep watching instead of stopping again on it.
    setIsPollingActive(true);
    setPendingRetryBaseline(stepStatuses);
    pendingRetryTicksRef.current = 0;
    startTransition(async () => {
      const result = await retryProvisioningStepAction(tenant.id);

      if (result.outcome === 'dispatched') {
        router.refresh();
      } else if (result.outcome === 'already-in-progress') {
        // A run is genuinely in flight server-side — keep watching the
        // pending-retry baseline (unlike the real failures below) and still
        // refresh, but tell the operator why this click didn't start a new
        // one instead of leaving the button looking broken.
        router.refresh();
        setDispatchNotice('already-in-progress');
      } else {
        // Nothing was actually dispatched (or it was reverted server-side)
        // — stop waiting for a change that predates a retry that never
        // took effect, and let the operator see and act on the failure.
        setPendingRetryBaseline(null);
        setDispatchNotice(
          result.outcome === 'not-found' || result.outcome === 'archived'
            ? result.outcome
            : 'other',
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
    effectiveProvisioningStatus,
    stepStatuses,
    displayStepStatuses,
    stepUpdatedAt,
    provisioningRun,
    allIdle,
    isProvisioningRunning,
    overallStepStatus,
    isOverallFailed,
    displayOverallStatus,
    failedStepError,
    errorKind,
    domainStatus,
    ownerElevationOutcome,
  };
};
