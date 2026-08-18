'use client';

import { TenantDetailsPanel } from '@admin/components/tenant-details-panel';
import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { getTenantProvisioningStatusAction } from '@admin/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@admin/server/provisioning/retry-provisioning-step-action';
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
import { Spinner } from '@blog/ui/atoms/spinner';
import { StatusBadge } from '@blog/ui/atoms/status-badge';
import { Text } from '@blog/ui/atoms/text';
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

const POLL_INTERVAL_MS = 4000;

function isTerminalProvisioningStatus(
  status: TTenantProvisioningStatus | null,
): boolean {
  return (
    status === TENANT_PROVISIONING_STATUS.READY ||
    status === TENANT_PROVISIONING_STATUS.FAILED
  );
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
 * retryable, alongside a read-only summary of the tenant row itself. While
 * provisioning hasn't reached a terminal status, this polls for fresh status
 * so an operator watching a run in progress sees the step circles advance
 * without reloading. Retry's own `router.refresh()` still covers picking up
 * a fresh full tenant row after a step retry.
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

  // A fresh `tenant` prop (e.g. after Retry's own `router.refresh()`) should
  // win over whatever polling last saw — adjusted during render, per React's
  // guidance for state derived from props, rather than in an effect.
  if (tenant !== renderedTenant) {
    setRenderedTenant(tenant);
    setProvisioningStatus(tenant.provisioningStatus);
    setProvisioningSteps(tenant.provisioningSteps);
  }

  const {
    root,
    header,
    description,
    startAction,
    layout,
    card,
    list,
    step,
    indicatorCol,
    circle,
    connector,
    stepBody,
    stepTitle,
    stepError,
    trailing,
    failedBadge,
    dnsCard,
    dnsRow,
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
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [tenant.id, provisioningStatus]);

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
        <div className={card()}>
          <div className={list()}>
            {STEP_ORDER.map((stepKey, index) => {
              const stepState = provisioningSteps?.[stepKey];
              const status =
                stepState?.status ?? TENANT_PROVISIONING_STEP_STATUS.IDLE;
              const isFailed =
                status === TENANT_PROVISIONING_STEP_STATUS.FAILED;
              const isRunning =
                status === TENANT_PROVISIONING_STEP_STATUS.RUNNING;
              const isDone = status === TENANT_PROVISIONING_STEP_STATUS.DONE;
              const isRetrying = retryingStep === stepKey;
              const isLast = index === STEP_ORDER.length - 1;
              const title = t(`stepLabel.${stepKey}`);

              return (
                <div className={step()} key={stepKey}>
                  <div className={indicatorCol()}>
                    <span
                      className={circle({ status })}
                      aria-hidden={isRunning ? undefined : true}
                    >
                      {isRunning ? (
                        <Spinner
                          label={t('stepRunningLabel', { step: title })}
                          size={Size.SM}
                        />
                      ) : isDone ? (
                        '✓'
                      ) : isFailed ? (
                        '!'
                      ) : (
                        index + 1
                      )}
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
                    {isFailed ? (
                      <span className={failedBadge()}>
                        {t(`statusLabel.${status}`)}
                      </span>
                    ) : (
                      <StatusBadge
                        tone={STEP_TONE[status]}
                        aria-hidden={isRunning ? 'true' : undefined}
                      >
                        {t(`statusLabel.${status}`)}
                      </StatusBadge>
                    )}
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
        </div>

        <TenantDetailsPanel tenant={tenant} />
      </div>

      <div className={dnsCard()}>
        <Heading level={2} size={Size.XS}>
          {t('dnsHeading')}
        </Heading>
        <div className={dnsRow()}>
          <Text>{tenant.primaryDomain}</Text>
          <StatusBadge tone={DNS_TONE[domainVerificationStatus]}>
            {t(`dnsStatus.${domainVerificationStatus}`)}
          </StatusBadge>
        </div>
        {domainVerificationStatus === 'NOT_CONFIGURED' && (
          <Text variant="muted" className={dnsHint()}>
            {t('dnsNotConfiguredHint')}
          </Text>
        )}
      </div>
    </div>
  );
}
