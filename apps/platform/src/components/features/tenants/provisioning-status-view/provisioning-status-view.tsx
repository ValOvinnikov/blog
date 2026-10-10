'use client';

import { ALERT_TYPE, SIZE } from '@blog/config';
import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { RunErrorCard } from '@platform/components/features/tenants/run-error-card';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { Disclosure } from '@platform/components/shared/disclosure';
import { headingVariants } from '@platform/components/shared/heading/heading-variants';
import { PageHeader } from '@platform/components/shared/page-header';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { StepList } from '@platform/components/shared/step-list';
import { Text } from '@platform/components/shared/text';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { formatRelativeTime } from '@platform/utils/format-relative-time/format-relative-time';
import { provisioningStepTone } from '@platform/utils/status-tone/status-tone';
import { useCollapseOnDone } from '@platform/utils/use-collapse-on-done/use-collapse-on-done';
import { useRelativeTimeTick } from '@platform/utils/use-relative-time-tick/use-relative-time-tick';
import { useLocale, useTranslations } from 'next-intl';
import { useId } from 'react';

import { RunCard } from './components/run-card/run-card';
import { provisioningStatusViewVariants } from './provisioning-status-view-variants';
import { STEP_ORDER, useProvisioningPoll } from './use-provisioning-poll';

type TProvisioningStatusViewProps = {
  tenant: TClientTenant;
  ownerEmail: string | undefined;
};

export const ProvisioningStatusView = ({
  tenant,
  ownerEmail,
}: TProvisioningStatusViewProps) => {
  const t = useTranslations('provisioningStatusView');
  const locale = useLocale();
  const {
    dispatchNotice,
    isStarting,
    isRetrying,
    handleStart,
    handleRetry,
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
  } = useProvisioningPoll(tenant);
  useRelativeTimeTick();

  const doneStepCount = stepStatuses.filter(
    (status) => status === TENANT_PROVISIONING_STEP_STATUS.DONE,
  ).length;
  const isArchived = Boolean(tenant.deprovisionedAt);
  const archivedNoticeId = useId();
  const isOverallDone =
    displayOverallStatus === TENANT_PROVISIONING_STEP_STATUS.DONE;
  const { isOpen: isStepsOpen, onOpenChange: setIsStepsOpen } =
    useCollapseOnDone(isOverallDone);

  const {
    root,
    ownerRow,
    cardsRow,
    stepsCard,
    stepsSummary,
    overallStatusLive,
  } = provisioningStatusViewVariants();

  const stepListSteps = STEP_ORDER.map((stepKey, index) => {
    const status =
      displayStepStatuses[index] ?? TENANT_PROVISIONING_STEP_STATUS.IDLE;
    const isFailed = status === TENANT_PROVISIONING_STEP_STATUS.FAILED;
    const isDone = status === TENANT_PROVISIONING_STEP_STATUS.DONE;
    const isRunning = status === TENANT_PROVISIONING_STEP_STATUS.RUNNING;
    const updatedAt = stepUpdatedAt[index];
    const relativeUpdatedAt =
      (isDone || isFailed) && updatedAt
        ? formatRelativeTime(new Date(updatedAt), t, locale)
        : undefined;

    return {
      key: stepKey,
      title: t(`stepLabel.${stepKey}`),
      status,
      statusLabel: t(`statusLabel.${status}`),
      trailingSlot: isRunning ? t('stepRunningNow') : undefined,
      updatedAt,
      updatedAtLabel: relativeUpdatedAt,
    };
  });

  const overallStatusBadge = isOverallFailed ? (
    <StatusBadge tone="bad">
      {t(`statusLabel.${overallStepStatus}`)}
    </StatusBadge>
  ) : (
    <StatusBadge tone={provisioningStepTone(displayOverallStatus)}>
      {t(`statusLabel.${displayOverallStatus}`)}
    </StatusBadge>
  );

  const overallStatusBadgeLive = (
    <span
      className={overallStatusLive()}
      aria-live="polite"
      data-testid="run-status-live"
    >
      {overallStatusBadge}
    </span>
  );

  const retryButtonNode = isOverallFailed ? (
    <Button
      type="button"
      variant="secondary"
      size={SIZE.SM}
      onClick={handleRetry}
      isDisabled={isRetrying || isArchived || isProvisioningRunning}
      aria-describedby={isArchived ? archivedNoticeId : undefined}
    >
      {isRetrying ? t('retryingButton') : t('retryButton')}
    </Button>
  ) : null;

  const startButtonNode =
    allIdle && !isProvisioningRunning ? (
      <Button
        type="button"
        variant="primary"
        onClick={handleStart}
        isDisabled={isStarting || isArchived}
        aria-describedby={isArchived ? archivedNoticeId : undefined}
      >
        {isStarting ? t('startingButton') : t('startButton')}
      </Button>
    ) : null;

  const runCardActions = (
    <>
      {overallStatusBadgeLive}
      {retryButtonNode}
    </>
  );

  return (
    <div className={root()}>
      <PageHeader
        title={t('pageTitle')}
        description={t('description', { tenantName: tenant.name })}
        actions={startButtonNode}
      />

      {tenant.deprovisionedAt && (
        <ArchivedTenantNotice
          id={archivedNoticeId}
          archivedAt={tenant.deprovisionedAt}
        />
      )}

      {!ownerEmail && (
        <div className={ownerRow()}>
          <Text variant="hint">{t('ownerLabel')}</Text>
          <StatusBadge tone="warn">{t('ownerInvitedPendingBadge')}</StatusBadge>
        </div>
      )}

      {dispatchNotice && (
        <Alert
          type={
            dispatchNotice === 'already-in-progress'
              ? ALERT_TYPE.INFO
              : ALERT_TYPE.ERROR
          }
          title={
            dispatchNotice === 'not-found'
              ? t('startErrorNotFound')
              : dispatchNotice === 'archived'
                ? t('startErrorArchived')
                : dispatchNotice === 'already-in-progress'
                  ? t('startNoticeAlreadyInProgress')
                  : t('startError')
          }
        />
      )}

      <div className={cardsRow()}>
        <div data-testid="provisioning-steps">
          <Disclosure
            className={stepsCard()}
            isOpen={isStepsOpen}
            onOpenChange={setIsStepsOpen}
            headingLevel={2}
            summary={
              <span className={stepsSummary()}>
                <span className={headingVariants({ size: 'cardTitle' })}>
                  {t('stepsCardTitle')}
                </span>
                <StatusBadge tone="neutral">
                  {t('stepsCompletionBadge', {
                    done: doneStepCount,
                    total: STEP_ORDER.length,
                  })}
                </StatusBadge>
              </span>
            }
          >
            <StepList steps={stepListSteps} />
          </Disclosure>
        </div>

        {provisioningRun ? (
          <RunCard run={provisioningRun} actions={runCardActions} />
        ) : (
          <Card>
            <Card.Header title={t('runCardTitle')} actions={runCardActions} />
            <Card.Body>
              <Text variant="supporting">{t('runCardEmpty')}</Text>
            </Card.Body>
          </Card>
        )}
      </div>

      {isOverallFailed && errorKind && (
        <RunErrorCard
          headline={t(`errorKind.${errorKind}.headline`)}
          body={t(`errorKind.${errorKind}.body`)}
          nextStep={t(`errorKind.${errorKind}.nextStep`)}
          technicalDetails={failedStepError}
          technicalDetailsLabel={t('technicalDetailsToggle')}
        />
      )}
    </div>
  );
};
