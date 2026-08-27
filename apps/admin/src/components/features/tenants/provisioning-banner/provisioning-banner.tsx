'use client';

import { LinkButton } from '@admin/components/shared/link-button';
import type { TProvisioningErrorKind } from '@admin/utils/provisioning-error/provisioning-error';
import { adminRoutes } from '@admin/utils/routes/routes';
import { Size } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { STEP_ORDER } from '../provisioning-status-view/use-provisioning-poll';

import {
  provisioningBannerVariants,
  type TProvisioningBannerVariants,
} from './provisioning-banner-variants';

export type TProvisioningBannerProps = {
  tenantId: string;
  provisioningStatus: TTenantProvisioningStatus | null;
  stepStatuses: TTenantProvisioningStepStatus[];
  isOverallFailed: boolean;
  isProvisioningRunning: boolean;
  errorKind: TProvisioningErrorKind | undefined;
};

const GLYPH: Record<
  NonNullable<TProvisioningBannerVariants['tone']>,
  string
> = { ok: '✓', warn: '◐', bad: '!' };

type TBannerStateProps = {
  tone: NonNullable<TProvisioningBannerVariants['tone']>;
  role: 'status' | 'alert';
  title: ReactNode;
  description: ReactNode;
  action: ReactNode;
};

const BannerState = ({
  tone,
  role,
  title,
  description,
  action,
}: TBannerStateProps) => {
  const {
    root,
    icon,
    textGroup,
    title: titleClass,
    description: descriptionClass,
  } = provisioningBannerVariants();

  return (
    <div className={root({ tone })} role={role}>
      <span className={icon()} aria-hidden="true">
        {GLYPH[tone]}
      </span>
      <div className={textGroup()} aria-live="polite">
        <strong className={titleClass()}>{title}</strong>
        <span className={descriptionClass()}>{description}</span>
      </div>
      {action}
    </div>
  );
};

/**
 * The overview page's own provisioning signal — renders from the same
 * `useProvisioningPoll` instance the page lifts up for the details panel,
 * rather than polling independently, so the two never disagree about
 * provisioning status. Renders nothing for a tenant that hasn't started
 * provisioning yet — that state isn't reachable from this route in
 * practice.
 */
export const ProvisioningBanner = ({
  tenantId,
  provisioningStatus,
  stepStatuses,
  isOverallFailed,
  isProvisioningRunning,
  errorKind,
}: TProvisioningBannerProps) => {
  const t = useTranslations('provisioningBanner');
  const tSteps = useTranslations('provisioningStatusView');

  const viewStepsButton = (
    <LinkButton
      href={adminRoutes.tenantProvisioning(tenantId)}
      variant="secondary"
      size={Size.SM}
    >
      {t('viewStepsButton')}
    </LinkButton>
  );

  if (provisioningStatus === TENANT_PROVISIONING_STATUS.READY) {
    return (
      <BannerState
        tone="ok"
        role="status"
        title={t('readyTitle')}
        description={t('readyDescription')}
        action={viewStepsButton}
      />
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
      <BannerState
        tone="bad"
        role="alert"
        title={t('failedTitle', {
          step: failedIndex + 1,
          total: STEP_ORDER.length,
        })}
        description={failedDescription}
        action={viewStepsButton}
      />
    );
  }

  if (isProvisioningRunning) {
    const runningIndex = stepStatuses.findIndex(
      (status) => status === TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    );
    const currentStep = runningIndex === -1 ? 1 : runningIndex + 1;

    return (
      <BannerState
        tone="warn"
        role="status"
        title={t('runningTitle', {
          step: currentStep,
          total: STEP_ORDER.length,
        })}
        description={t('runningDescription')}
        action={viewStepsButton}
      />
    );
  }

  return null;
};
