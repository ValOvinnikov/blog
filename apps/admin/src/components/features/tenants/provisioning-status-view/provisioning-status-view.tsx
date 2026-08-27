'use client';

import { Alert } from '@admin/components/shared/alert';
import { Button } from '@admin/components/shared/button';
import { Heading } from '@admin/components/shared/heading';
import { Icon } from '@admin/components/shared/icon';
import { LinkButton } from '@admin/components/shared/link-button';
import { StatusBadge } from '@admin/components/shared/status-badge';
import { Text } from '@admin/components/shared/text';
import { Link } from '@admin/i18n/navigation';
import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { adminRoutes } from '@admin/utils/routes/routes';
import {
  domainVerificationTone,
  provisioningStepTone,
} from '@admin/utils/status-tone/status-tone';
import { ALERT_TYPE, ICONS } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { useTranslations } from 'next-intl';

import { provisioningStatusViewVariants } from './provisioning-status-view-variants';
import { STEP_ORDER, useProvisioningPoll } from './use-provisioning-poll';

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
 * retryable. The live polling, retry dispatch, and status-derivation behind
 * this all live in `useProvisioningPoll` — this component only renders what
 * it returns.
 */
export const ProvisioningStatusView = ({
  tenant,
  domainVerificationStatus,
  ownerEmail,
}: TProvisioningStatusViewProps) => {
  const t = useTranslations('provisioningStatusView');
  const {
    pollError,
    dispatchError,
    isStarting,
    isRetrying,
    handleStart,
    handleRetry,
    provisioningStatus,
    stepStatuses,
    allIdle,
    isProvisioningRunning,
    overallStepStatus,
    isOverallFailed,
    displayOverallStatus,
    failedStepError,
    errorKind,
    domainStatus,
  } = useProvisioningPoll(tenant, domainVerificationStatus);

  const {
    root,
    header,
    eyebrow,
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
    goToTenantButton,
    dnsCard,
    dnsRow,
    dnsValue,
    dnsStatusLive,
  } = provisioningStatusViewVariants();

  return (
    <div className={root()}>
      <div className={header()}>
        <span className={eyebrow()}>{t('eyebrow')}</span>
        <Heading level={1} size="pageTitle">
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
        <Alert type={ALERT_TYPE.WARNING} title={t('pollErrorWarning')} />
      )}

      {dispatchError && (
        <Alert
          type={ALERT_TYPE.ERROR}
          title={
            dispatchError === 'not-found'
              ? t('startErrorNotFound')
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
                  <StatusBadge tone="bad">
                    {t(`statusLabel.${overallStepStatus}`)}
                  </StatusBadge>
                ) : (
                  <StatusBadge
                    tone={provisioningStepTone(displayOverallStatus)}
                  >
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

          {provisioningStatus === TENANT_PROVISIONING_STATUS.READY && (
            <LinkButton
              as={Link}
              href={adminRoutes.look(tenant.id)}
              variant="primary"
              className={goToTenantButton()}
            >
              {t('goToTenantButton')}
            </LinkButton>
          )}
        </div>
      </div>

      <div className={dnsCard()}>
        <Heading level={2} size="cardTitle">
          {t('dnsHeading')}
        </Heading>
        <div className={dnsRow()}>
          <Text className={dnsValue()}>{tenant.primaryDomain}</Text>
          <span className={dnsStatusLive()} aria-live="polite">
            <StatusBadge tone={domainVerificationTone(domainStatus)}>
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
