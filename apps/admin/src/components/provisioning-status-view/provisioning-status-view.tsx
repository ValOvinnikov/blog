'use client';

import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { retryProvisioningStepAction } from '@admin/server/provisioning/retry-provisioning-step-action';
import {
  Size,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Button } from '@blog/ui/atoms/button';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { StatusBadge } from '@blog/ui/atoms/status-badge';
import { Text } from '@blog/ui/atoms/text';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

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
 * The wizard's remaining-steps view — the five provisioning steps (Sanity
 * project → seed content → deploy Studio → persist read token → map domain)
 * read live from `tenant.provisioningSteps`, each independently retryable.
 * No polling: the operator refreshes (or Retry's own `router.refresh()`
 * does it) to see updated status, matching how the DNS check below is also
 * a live-on-render call, not a background poll.
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

  const {
    root,
    header,
    description,
    startAction,
    card,
    list,
    step,
    stepBody,
    stepTitle,
    stepError,
    failedBadge,
    dnsCard,
    dnsRow,
  } = provisioningStatusViewVariants();

  const steps = tenant.provisioningSteps;
  const allIdle = STEP_ORDER.every((stepKey) => {
    const status =
      steps?.[stepKey]?.status ?? TENANT_PROVISIONING_STEP_STATUS.IDLE;
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

      <div className={card()}>
        <div className={list()}>
          {STEP_ORDER.map((stepKey) => {
            const stepState = steps?.[stepKey];
            const status =
              stepState?.status ?? TENANT_PROVISIONING_STEP_STATUS.IDLE;
            const isFailed = status === TENANT_PROVISIONING_STEP_STATUS.FAILED;
            const isRetrying = retryingStep === stepKey;

            return (
              <div className={step()} key={stepKey}>
                <div className={stepBody()}>
                  <span className={stepTitle()}>
                    {t(`stepLabel.${stepKey}`)}
                  </span>
                  {isFailed && stepState?.error && (
                    <span className={stepError()}>{stepState.error}</span>
                  )}
                </div>
                {isFailed ? (
                  <span className={failedBadge()}>
                    {t(`statusLabel.${status}`)}
                  </span>
                ) : (
                  <StatusBadge tone={STEP_TONE[status]}>
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
            );
          })}
        </div>
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
      </div>
    </div>
  );
}
