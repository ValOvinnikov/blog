'use client';

import { TenantDetailsPanel } from '@admin/components/tenant-details-panel';
import { Link } from '@admin/i18n/navigation';
import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { getDomainVerificationStatusAction } from '@admin/server/provisioning/get-domain-verification-status-action';
import { getTenantProvisioningStatusAction } from '@admin/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@admin/server/provisioning/retry-provisioning-step-action';
import { adminRoutes } from '@admin/utils/routes/routes';
import {
  Size,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/config';
import type {
  TTenant,
  TTenantProvisioningSteps,
} from '@blog/db/schema/tenants';
import { Button } from '@blog/ui/atoms/button';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { StatusBadge } from '@blog/ui/atoms/status-badge';
import { Text } from '@blog/ui/atoms/text';
import { LinkButton } from '@blog/ui/molecules';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';

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

const STEP_POLL_INTERVAL_MS = 4000;
// The domain check makes a live Vercel API call with its own 5s timeout —
// slower and less urgent than step polling — so it runs on a longer,
// independent interval rather than sharing the step interval and risking
// overlapping in-flight requests.
const DOMAIN_POLL_INTERVAL_MS = 10000;

function isTerminalProvisioningStatus(
  status: TTenantProvisioningStatus | null,
): boolean {
  return (
    status === TENANT_PROVISIONING_STATUS.READY ||
    status === TENANT_PROVISIONING_STATUS.FAILED
  );
}

function isTerminalDomainVerificationStatus(
  status: TDomainVerificationStatus,
): boolean {
  return status === 'VERIFIED' || status === 'NOT_CONFIGURED';
}

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
export function ProvisioningStatusView({
  tenant,
  domainVerificationStatus,
}: TProvisioningStatusViewProps) {
  const t = useTranslations('provisioningStatusView');
  const router = useRouter();
  const [retryingStep, setRetryingStep] =
    useState<TTenantProvisioningStep | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [, startTransition] = useTransition();
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [provisioningStatus, setProvisioningStatus] =
    useState<TTenantProvisioningStatus | null>(tenant.provisioningStatus);
  const [provisioningSteps, setProvisioningSteps] =
    useState<TTenantProvisioningSteps | null>(tenant.provisioningSteps);
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
  }
  if (domainVerificationStatus !== renderedDomainStatus) {
    setRenderedDomainStatus(domainVerificationStatus);
    setDomainStatus(domainVerificationStatus);
  }

  const {
    root,
    header,
    description,
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
    stepError,
    trailing,
    stepStatusLive,
    failedBadge,
    detailsColumn,
    goToTenantButton,
    dnsCard,
    dnsRow,
    dnsStatusLive,
    dnsHint,
  } = provisioningStatusViewVariants();

  useEffect(() => {
    if (isTerminalProvisioningStatus(provisioningStatus)) {
      return;
    }

    let cancelled = false;

    const intervalId = setInterval(() => {
      void getTenantProvisioningStatusAction(tenant.id).then((result) => {
        if (cancelled || !result) {
          return;
        }
        setProvisioningStatus(result.provisioningStatus);
        setProvisioningSteps(result.provisioningSteps);
      });
    }, STEP_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [tenant.id, provisioningStatus]);

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

  const allIdle = STEP_ORDER.every((stepKey) => {
    const status =
      provisioningSteps?.[stepKey]?.status ??
      TENANT_PROVISIONING_STEP_STATUS.IDLE;
    return status === TENANT_PROVISIONING_STEP_STATUS.IDLE;
  });

  function handleRetry(stepKey: TTenantProvisioningStep) {
    setRetryingStep(stepKey);
    startTransition(async () => {
      await retryProvisioningStepAction(tenant.id);
      router.refresh();
      setRetryingStep(null);
    });
  }

  function handleStart() {
    setIsStarting(true);
    startTransition(async () => {
      await retryProvisioningStepAction(tenant.id);
      router.refresh();
      setIsStarting(false);
    });
  }

  return (
    <div className={root()}>
      <div className={header()}>
        <Eyebrow>{t('eyebrow')}</Eyebrow>
        <Heading level={1} size={Size.MD}>
          {tenant.name}
        </Heading>
        <Text variant="muted" className={description()}>
          {t('description')}
        </Text>
      </div>

      {allIdle && (
        <div className={startAction()}>
          <Button
            type="button"
            variant="primary"
            onClick={handleStart}
            disabled={isStarting}
          >
            {isStarting ? t('startingButton') : t('startButton')}
          </Button>
        </div>
      )}

      <div className={layout()}>
        <aside className={steps()}>
          <div className={list()}>
            {STEP_ORDER.map((stepKey, index) => {
              const stepState = provisioningSteps?.[stepKey];
              const status =
                stepState?.status ?? TENANT_PROVISIONING_STEP_STATUS.IDLE;
              const isFailed =
                status === TENANT_PROVISIONING_STEP_STATUS.FAILED;
              const isDone = status === TENANT_PROVISIONING_STEP_STATUS.DONE;
              const isRetrying = retryingStep === stepKey;
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
                    {isFailed && stepState?.error && (
                      <span className={stepError()}>{stepState.error}</span>
                    )}
                  </div>
                  <div className={trailing()}>
                    <span className={stepStatusLive()} aria-live="polite">
                      {isFailed ? (
                        <span className={failedBadge()}>
                          {t(`statusLabel.${status}`)}
                        </span>
                      ) : (
                        <StatusBadge tone={STEP_TONE[status]}>
                          {t(`statusLabel.${status}`)}
                        </StatusBadge>
                      )}
                    </span>
                    {isFailed && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleRetry(stepKey)}
                        disabled={isRetrying}
                      >
                        {isRetrying ? t('retryingButton') : t('retryButton')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <div className={detailsColumn()}>
          <TenantDetailsPanel tenant={tenant} editable={allIdle} />
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
          <Text variant="muted" className={dnsHint()}>
            {t('dnsNotConfiguredHint')}
          </Text>
        )}
      </div>
    </div>
  );
}
