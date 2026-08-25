'use client';

import { TenantDetailsPanel } from '@admin/components/tenant-details-panel';
import { Link } from '@admin/i18n/navigation';
import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { getDomainVerificationStatusAction } from '@admin/server/provisioning/get-domain-verification-status-action';
import { getTenantProvisioningStatusAction } from '@admin/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@admin/server/provisioning/retry-provisioning-step-action';
import { classifyProvisioningError } from '@admin/utils/provisioning-error/provisioning-error';
import { adminRoutes } from '@admin/utils/routes/routes';
import { computeTenantFieldLocks } from '@admin/utils/tenant-field-locks/tenant-field-locks';
import { ALERT_TYPE, ICONS, Size } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import type {
  TTenant,
  TTenantProvisioningSteps,
} from '@blog/db/schema/tenants';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { Icon } from '@blog/ui/atoms/icon';
import { StatusBadge } from '@blog/ui/atoms/status-badge';
import { Text } from '@blog/ui/atoms/text';
import { LinkButton } from '@blog/ui/molecules/link-button';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useTransition } from 'react';

import { provisioningStatusViewVariants } from './provisioning-status-view-variants';

// Object key insertion order matches the config-declared step sequence, so
// this can't drift if a step is ever reordered there.
const STEP_ORDER = Object.values(TENANT_PROVISIONING_STEP);

const STEP_TONE: Record<
  Exclude<TTenantProvisioningStepStatus, 'FAILED'>,
  'ok' | 'warn' | 'neutral'
> = {
  IDLE: 'neutral',
  RUNNING: 'warn',
  DONE: 'ok',
};

// Highest-priority status wins: any FAILED step outranks a RUNNING one, which
// outranks a still-IDLE one, so the header badge always reflects the most
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
  steps: TTenantProvisioningSteps | null,
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
  steps: TTenantProvisioningSteps | null,
): TTenantProvisioningStepStatus[] =>
  STEP_ORDER.map(
    (stepKey) =>
      steps?.[stepKey]?.status ?? TENANT_PROVISIONING_STEP_STATUS.IDLE,
  );

const stepStatusesEqual = (
  a: TTenantProvisioningStepStatus[],
  b: TTenantProvisioningStepStatus[],
): boolean => a.length === b.length && a.every((status, i) => status === b[i]);

const isTerminalDomainVerificationStatus = (
  status: TDomainVerificationStatus,
): boolean => {
  return status === 'VERIFIED' || status === 'NOT_CONFIGURED';
};

const DNS_TONE: Record<TDomainVerificationStatus, 'ok' | 'warn' | 'neutral'> = {
  NOT_CONFIGURED: 'neutral',
  NOT_ADDED: 'neutral',
  PENDING: 'warn',
  VERIFIED: 'ok',
  ERROR: 'warn',
};

type TProvisioningStatusViewProps = {
  tenant: TTenant;
  domainVerificationStatus: TDomainVerificationStatus;
  // `undefined` means the tenant's OWNER row is still a pending
  // `membershipInvites` entry rather than a real `memberships` row (see
  // `queries.memberships.getTenantOwnerEmail`) — every tenant has exactly
  // one of the two from the moment it's created.
  ownerEmail: string | undefined;
};

/**
 * The wizard's remaining-steps view — the provisioning steps (Sanity project
 * → seed content → deploy Studio → persist read token → map domain → create
 * webhook) read live from `tenant.provisioningSteps`, each independently
 * retryable, alongside an editable summary of the tenant row itself. While
 * provisioning hasn't reached a terminal status, this polls for fresh step
 * status; the domain verification badge polls on its own, slower interval
 * so a slow or failed Vercel lookup can never stall step polling.
 */
export const ProvisioningStatusView = ({
  tenant,
  domainVerificationStatus,
  ownerEmail,
}: TProvisioningStatusViewProps) => {
  const t = useTranslations('provisioningStatusView');
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  // A string message means "show it"; distinct from `undefined` so a stale
  // error from a previous attempt never lingers into a fresh one.
  const [dispatchError, setDispatchError] = useState<string | undefined>(
    undefined,
  );
  // True while the most recent poll tick rejected (e.g. an expired-session
  // redirect thrown by `requireAdmin()`) — the interval keeps retrying on
  // its own; this only drives the operator-visible indicator.
  const [pollError, setPollError] = useState(false);
  const [, startTransition] = useTransition();
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [provisioningStatus, setProvisioningStatus] =
    useState<TTenantProvisioningStatus | null>(tenant.provisioningStatus);
  const [provisioningSteps, setProvisioningSteps] =
    useState<TTenantProvisioningSteps | null>(tenant.provisioningSteps);
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

  // A fresh `tenant`/`domainVerificationStatus` prop (e.g. after a Retry,
  // Start, or details save's own `router.refresh()`) should win over
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

  const {
    root,
    header,
    ownerRow,
    startAction,
    layout,
    steps,
    list,
    step,
    indicatorCol,
    circle,
    connector,
    stepBody,
    stepTitle,
    stepStatusLive,
    visuallyHidden,
    failedBadge,
    detailsColumn,
    detailsHeader,
    overallStatusLive,
    errorCard,
    errorHeadingRow,
    errorIcon,
    errorDetails,
    errorDetailsSummary,
    errorDetailsText,
    goToTenantButton,
    dnsCard,
    dnsRow,
    dnsStatusLive,
  } = provisioningStatusViewVariants();

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
          setPollError(false);
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
          // looking current.
          if (cancelled) {
            return;
          }
          setPollError(true);
        });
    }, STEP_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [tenant.id, isPollingActive, pendingRetryBaseline]);

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
  const allIdle = stepStatuses.every(
    (status) => status === TENANT_PROVISIONING_STEP_STATUS.IDLE,
  );
  // `OVERALL_STATUS_PRIORITY` covers every possible step status, so this
  // always matches — there is no real "not found" case to fall back from.
  const overallStepStatus = OVERALL_STATUS_PRIORITY.find((candidate) =>
    stepStatuses.includes(candidate),
  ) as TTenantProvisioningStepStatus;
  const isOverallFailed =
    overallStepStatus === TENANT_PROVISIONING_STEP_STATUS.FAILED;
  const failedStepError = isOverallFailed
    ? STEP_ORDER.map((stepKey) => provisioningSteps?.[stepKey]).find(
        (stepState) =>
          stepState?.status === TENANT_PROVISIONING_STEP_STATUS.FAILED,
      )?.error
    : undefined;
  const errorKind = isOverallFailed
    ? classifyProvisioningError(failedStepError)
    : undefined;

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
  // The real per-step statuses drive `overallStepStatus`/`isOverallFailed`
  // above unchanged; this is only what the header badge displays while
  // every step is still IDLE but a dispatch is nonetheless in flight. Only
  // ever rendered from the `!isOverallFailed` branch below, where
  // `overallStepStatus` is never FAILED either way.
  const displayOverallStatus = (
    allIdle && isProvisioningRunning
      ? TENANT_PROVISIONING_STEP_STATUS.RUNNING
      : overallStepStatus
  ) as Exclude<TTenantProvisioningStepStatus, 'FAILED'>;

  const runProvisioningDispatch = (setPending: (pending: boolean) => void) => {
    setDispatchError(undefined);
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

      if (
        result.outcome === 'dispatched' ||
        result.outcome === 'already-in-progress'
      ) {
        router.refresh();
      } else {
        // Nothing was actually dispatched (or it was reverted server-side)
        // — stop waiting for a change that predates a retry that never
        // took effect, and let the operator see and act on the failure.
        setPendingRetryBaseline(null);
        setDispatchError(
          result.outcome === 'not-found'
            ? t('startErrorNotFound')
            : t('startError'),
        );
      }

      setPending(false);
    });
  };

  const handleRetry = () => runProvisioningDispatch(setIsRetrying);
  const handleStart = () => runProvisioningDispatch(setIsStarting);

  return (
    <div className={root()}>
      <div className={header()}>
        <Eyebrow>{t('eyebrow')}</Eyebrow>
        <Heading level={1} size={Size.MD}>
          {tenant.name}
        </Heading>
        <Text variant="supporting">{t('description')}</Text>
        {!ownerEmail && (
          <div className={ownerRow()}>
            <Text variant="hint">{t('ownerLabel')}</Text>
            <StatusBadge tone="warn">
              {t('ownerInvitedPendingBadge')}
            </StatusBadge>
          </div>
        )}
      </div>

      {pollError && (
        <Alert type={ALERT_TYPE.WARNING} message={t('pollErrorWarning')} />
      )}

      {dispatchError && (
        <Alert type={ALERT_TYPE.ERROR} message={dispatchError} />
      )}

      {allIdle && !isProvisioningRunning && (
        <div className={startAction()}>
          <Button
            type="button"
            variant="primary"
            onClick={handleStart}
            isDisabled={isStarting}
          >
            {isStarting ? t('startingButton') : t('startButton')}
          </Button>
        </div>
      )}

      <div className={layout()}>
        <aside className={steps()}>
          <div className={list()}>
            {STEP_ORDER.map((stepKey, index) => {
              const status =
                stepStatuses[index] ?? TENANT_PROVISIONING_STEP_STATUS.IDLE;
              const isFailed =
                status === TENANT_PROVISIONING_STEP_STATUS.FAILED;
              const isDone = status === TENANT_PROVISIONING_STEP_STATUS.DONE;
              const isLast = index === STEP_ORDER.length - 1;
              const title = t(`stepLabel.${stepKey}`);

              return (
                <div className={step()} key={stepKey}>
                  <div className={indicatorCol()}>
                    <span className={circle({ status })} aria-hidden="true">
                      {isDone ? '✓' : isFailed ? '!' : index + 1}
                    </span>
                    {!isLast && (
                      <span
                        className={connector({ isDone })}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className={stepBody()}>
                    <span className={stepTitle()}>{title}</span>
                    {/* The circle glyph is decorative (`aria-hidden`), so
                        this text — visually hidden, not removed — is what
                        actually carries each step's status to assistive
                        tech; the live region still announces it on change
                        even though the sighted badge that used to sit here
                        is gone. */}
                    <span className={stepStatusLive()} aria-live="polite">
                      <span className={visuallyHidden()}>
                        {t(`statusLabel.${status}`)}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <div className={detailsColumn()}>
          {(!allIdle || isProvisioningRunning) && (
            <div className={detailsHeader()}>
              <span className={overallStatusLive()} aria-live="polite">
                {isOverallFailed ? (
                  <span className={failedBadge()}>
                    {t(`statusLabel.${overallStepStatus}`)}
                  </span>
                ) : (
                  <StatusBadge tone={STEP_TONE[displayOverallStatus]}>
                    {t(`statusLabel.${displayOverallStatus}`)}
                  </StatusBadge>
                )}
              </span>
              {isOverallFailed && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRetry}
                  isDisabled={isRetrying}
                >
                  {isRetrying ? t('retryingButton') : t('retryButton')}
                </Button>
              )}
            </div>
          )}

          {isOverallFailed && errorKind && (
            <div className={errorCard()} role="alert">
              <div className={errorHeadingRow()}>
                <Icon name={ICONS.WARNING} className={errorIcon()} />
                <Heading level={2} size={Size.XS}>
                  {t(`errorKind.${errorKind}.headline`)}
                </Heading>
              </div>
              <Text variant="supporting">
                {t(`errorKind.${errorKind}.body`)}
              </Text>
              <Text variant="hint">{t(`errorKind.${errorKind}.nextStep`)}</Text>
              {failedStepError && (
                <details className={errorDetails()}>
                  <summary className={errorDetailsSummary()}>
                    {t('technicalDetailsToggle')}
                  </summary>
                  <pre className={errorDetailsText()}>{failedStepError}</pre>
                </details>
              )}
            </div>
          )}

          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={computeTenantFieldLocks(
              provisioningSteps,
              effectiveProvisioningStatus,
            )}
            ownerEmail={ownerEmail}
          />
          {provisioningStatus === TENANT_PROVISIONING_STATUS.READY && (
            <LinkButton
              as={Link}
              href={adminRoutes.tenant(tenant.slug)}
              variant="primary"
              className={goToTenantButton()}
            >
              {t('goToTenantButton')}
            </LinkButton>
          )}
        </div>
      </div>

      <div className={dnsCard()}>
        <Heading level={2} size={Size.XS}>
          {t('dnsHeading')}
        </Heading>
        <div className={dnsRow()}>
          <Text>{tenant.primaryDomain}</Text>
          <span className={dnsStatusLive()} aria-live="polite">
            <StatusBadge tone={DNS_TONE[domainStatus]}>
              {t(`dnsStatus.${domainStatus}`)}
            </StatusBadge>
          </span>
        </div>
        {domainStatus === 'NOT_CONFIGURED' && (
          <Text variant="hint">{t('dnsNotConfiguredHint')}</Text>
        )}
      </div>
    </div>
  );
};
