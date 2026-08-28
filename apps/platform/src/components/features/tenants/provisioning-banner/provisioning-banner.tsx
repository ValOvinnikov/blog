'use client';

import { Size } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import { LinkButton } from '@platform/components/shared/link-button';
import type { TProvisioningErrorKind } from '@platform/utils/provisioning-error/provisioning-error';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

import { STEP_ORDER } from '../provisioning-status-view/use-provisioning-poll';

import { BannerState } from './components/banner-state/banner-state';

export type TProvisioningBannerProps = {
  tenantId: string;
  provisioningStatus: TTenantProvisioningStatus | null;
  stepStatuses: TTenantProvisioningStepStatus[];
  isOverallFailed: boolean;
  isProvisioningRunning: boolean;
  errorKind: TProvisioningErrorKind | undefined;
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
