'use client';

import { ALERT_TYPE, ICONS } from '@blog/config';
import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { Heading } from '@platform/components/shared/heading';
import { Icon } from '@platform/components/shared/icon';
import { LinkButton } from '@platform/components/shared/link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { Link } from '@platform/i18n/navigation';
import { formatDateTime } from '@platform/utils/format-date-time/format-date-time';
import { adminRoutes } from '@platform/utils/routes/routes';
import { provisioningStepTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { RunCard } from './components/run-card/run-card';
import { provisioningStatusViewVariants } from './provisioning-status-view-variants';
import { STEP_ORDER, useProvisioningPoll } from './use-provisioning-poll';

type TProvisioningStatusViewProps = {
  tenant: TTenant;
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
 * retryable. The live polling, retry dispatch, and status-derivation behind
 * this all live in `useProvisioningPoll` — this component only renders what
 * it returns.
 */
export const ProvisioningStatusView = ({
  tenant,
  ownerEmail,
}: TProvisioningStatusViewProps) => {
  const t = useTranslations('provisioningStatusView');
  const {
    dispatchError,
    isStarting,
    isRetrying,
    handleStart,
    handleRetry,
    stepStatuses,
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

  const doneStepCount = stepStatuses.filter(
    (status) => status === TENANT_PROVISIONING_STEP_STATUS.DONE,
  ).length;
  const isArchived = Boolean(tenant.deprovisionedAt);
  const archivedNoticeId = useId();

  const {
    root,
    ownerRow,
    startAction,
    layout,
    steps,
    stepsCard,
    stepsCardBody,
    list,
    step,
    indicatorCol,
    circle,
    connector,
    stepBody,
    stepTitle,
    stepStatusLive,
    stepWhen,
    visuallyHidden,
    detailsColumn,
    detailsHeader,
    overallStatusLive,
    errorCard,
    errorHeadingRow,
    errorHeadline,
    errorIcon,
    errorDetails,
    errorDetailsSummary,
    errorDetailsText,
  } = provisioningStatusViewVariants();

  const overallStatusBadge = isOverallFailed ? (
    <StatusBadge tone="bad">
      {t(`statusLabel.${overallStepStatus}`)}
    </StatusBadge>
  ) : (
    <StatusBadge tone={provisioningStepTone(displayOverallStatus)}>
      {t(`statusLabel.${displayOverallStatus}`)}
    </StatusBadge>
  );

  return (
    <div className={root()}>
      <PageHeader
        title={t('pageTitle')}
        description={t('description', { tenantName: tenant.name })}
        badges={overallStatusBadge}
        actions={
          <LinkButton
            as={Link}
            href={adminRoutes.tenantOverview(tenant.id)}
            variant="ghost"
          >
            {t('backToTenantAction')}
          </LinkButton>
        }
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

      {dispatchError && (
        <Alert
          type={ALERT_TYPE.ERROR}
          title={
            dispatchError === 'not-found'
              ? t('startErrorNotFound')
              : dispatchError === 'archived'
                ? t('startErrorArchived')
                : t('startError')
          }
        />
      )}

      {allIdle && !isProvisioningRunning && (
        <div className={startAction()}>
          <Button
            type="button"
            variant="primary"
            onClick={handleStart}
            isDisabled={isStarting || isArchived}
            aria-describedby={isArchived ? archivedNoticeId : undefined}
          >
            {isStarting ? t('startingButton') : t('startButton')}
          </Button>
        </div>
      )}

      <div className={layout()}>
        <aside className={steps()}>
          <Card className={stepsCard()}>
            <Card.Header
              title={t('stepsCardTitle')}
              headingLevel={2}
              actions={
                <StatusBadge tone="neutral">
                  {t('stepsCompletionBadge', {
                    done: doneStepCount,
                    total: STEP_ORDER.length,
                  })}
                </StatusBadge>
              }
            />
            <Card.Body className={stepsCardBody()}>
              <div className={list()}>
                {STEP_ORDER.map((stepKey, index) => {
                  const status =
                    stepStatuses[index] ?? TENANT_PROVISIONING_STEP_STATUS.IDLE;
                  const isFailed =
                    status === TENANT_PROVISIONING_STEP_STATUS.FAILED;
                  const isDone =
                    status === TENANT_PROVISIONING_STEP_STATUS.DONE;
                  const isRunning =
                    status === TENANT_PROVISIONING_STEP_STATUS.RUNNING;
                  const isLast = index === STEP_ORDER.length - 1;
                  const title = t(`stepLabel.${stepKey}`);
                  const updatedAt = stepUpdatedAt[index];
                  const whenText = isRunning
                    ? t('stepRunningNow')
                    : (isDone || isFailed) && updatedAt
                      ? formatDateTime(updatedAt)
                      : undefined;

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
                      {whenText && (
                        <span className={stepWhen()}>{whenText}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </aside>

        <div className={detailsColumn()}>
          {(!allIdle || isProvisioningRunning) && (
            <div className={detailsHeader()}>
              <span className={overallStatusLive()} aria-live="polite">
                {overallStatusBadge}
              </span>
              {isOverallFailed && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRetry}
                  isDisabled={isRetrying || isArchived}
                  aria-describedby={isArchived ? archivedNoticeId : undefined}
                >
                  {isRetrying ? t('retryingButton') : t('retryButton')}
                </Button>
              )}
            </div>
          )}

          {provisioningRun && <RunCard run={provisioningRun} />}

          {isOverallFailed && errorKind && (
            <div className={errorCard()} role="alert">
              <div className={errorHeadingRow()}>
                <Icon name={ICONS.WARNING} className={errorIcon()} />
                <Heading level={2} size="cardTitle" className={errorHeadline()}>
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
        </div>
      </div>
    </div>
  );
};
