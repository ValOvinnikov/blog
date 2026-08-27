'use client';

import { LinkButton } from '@admin/components/shared/link-button';
import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { adminRoutes } from '@admin/utils/routes/routes';
import { Size } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { useTranslations } from 'next-intl';

import {
  STEP_ORDER,
  useProvisioningPoll,
} from '../provisioning-status-view/use-provisioning-poll';

import { provisioningBannerVariants } from './provisioning-banner-variants';

export type TProvisioningBannerProps = {
  tenant: TTenant;
  domainVerificationStatus: TDomainVerificationStatus;
};

const GLYPH = { ok: '✓', warn: '◐', bad: '!' } as const;

/**
 * The overview page's own provisioning signal — reuses
 * `useProvisioningPoll` so it self-updates the same way the provisioning
 * page's step list does, without duplicating its polling logic. Renders
 * nothing for a tenant that hasn't started provisioning yet — that state
 * isn't reachable from this route in practice.
 */
export const ProvisioningBanner = ({
  tenant,
  domainVerificationStatus,
}: TProvisioningBannerProps) => {
  const t = useTranslations('provisioningBanner');
  const tSteps = useTranslations('provisioningStatusView');
  const {
    provisioningStatus,
    stepStatuses,
    isOverallFailed,
    isProvisioningRunning,
    errorKind,
  } = useProvisioningPoll(tenant, domainVerificationStatus);

  const { root, icon, textGroup, title, description } =
    provisioningBannerVariants();

  const viewStepsButton = (
    <LinkButton
      href={adminRoutes.tenantProvisioning(tenant.id)}
      variant="secondary"
      size={Size.SM}
    >
      {t('viewStepsButton')}
    </LinkButton>
  );

  if (provisioningStatus === TENANT_PROVISIONING_STATUS.READY) {
    return (
      <div className={root({ tone: 'ok' })} role="status">
        <span className={icon()} aria-hidden="true">
          {GLYPH.ok}
        </span>
        <div className={textGroup()} aria-live="polite">
          <strong className={title()}>{t('readyTitle')}</strong>
          <span className={description()}>{t('readyDescription')}</span>
        </div>
        {viewStepsButton}
      </div>
    );
  }

  if (isOverallFailed) {
    const failedIndex = stepStatuses.findIndex(
      (status) => status === TENANT_PROVISIONING_STEP_STATUS.FAILED,
    );
    const failedStepKey = STEP_ORDER[failedIndex];
    const failedDescription =
      errorKind && failedStepKey
        ? t('failedDescription', {
            step: tSteps(`stepLabel.${failedStepKey}`),
            reason: tSteps(`errorKind.${errorKind}.headline`),
          })
        : t('failedDescriptionFallback');

    return (
      <div className={root({ tone: 'bad' })} role="alert">
        <span className={icon()} aria-hidden="true">
          {GLYPH.bad}
        </span>
        <div className={textGroup()} aria-live="polite">
          <strong className={title()}>
            {t('failedTitle', {
              step: failedIndex + 1,
              total: STEP_ORDER.length,
            })}
          </strong>
          <span className={description()}>{failedDescription}</span>
        </div>
        {viewStepsButton}
      </div>
    );
  }

  if (isProvisioningRunning) {
    const runningIndex = stepStatuses.findIndex(
      (status) => status === TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    );
    const currentStep = runningIndex === -1 ? 1 : runningIndex + 1;

    return (
      <div className={root({ tone: 'warn' })} role="status">
        <span className={icon()} aria-hidden="true">
          {GLYPH.warn}
        </span>
        <div className={textGroup()} aria-live="polite">
          <strong className={title()}>
            {t('runningTitle', { step: currentStep, total: STEP_ORDER.length })}
          </strong>
          <span className={description()}>{t('runningDescription')}</span>
        </div>
        {viewStepsButton}
      </div>
    );
  }

  return null;
};
