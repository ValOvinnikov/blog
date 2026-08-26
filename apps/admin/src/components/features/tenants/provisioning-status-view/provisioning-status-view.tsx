'use client';

import { TenantDetailsPanel } from '@admin/components/features/tenants/tenant-details-panel';
import { Link } from '@admin/i18n/navigation';
import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { adminRoutes } from '@admin/utils/routes/routes';
import {
  domainVerificationTone,
  provisioningStepTone,
} from '@admin/utils/status-tone/status-tone';
import { computeTenantFieldLocks } from '@admin/utils/tenant-field-locks/tenant-field-locks';
import { ALERT_TYPE, ICONS, Size } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { Icon } from '@blog/ui/atoms/icon';
import { StatusBadge } from '@blog/ui/atoms/status-badge';
import { Text } from '@blog/ui/atoms/text';
import { LinkButton } from '@blog/ui/molecules/link-button';
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
 * retryable, alongside an editable summary of the tenant row itself. The
 * live polling, retry dispatch, and status-derivation behind this all live
 * in `useProvisioningPoll` — this component only renders what it returns.
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
    provisioningSteps,
    effectiveProvisioningStatus,
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
        <Alert
          type={ALERT_TYPE.ERROR}
          message={
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
                  <span className={failedBadge()}>
                    {t(`statusLabel.${overallStepStatus}`)}
                  </span>
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
