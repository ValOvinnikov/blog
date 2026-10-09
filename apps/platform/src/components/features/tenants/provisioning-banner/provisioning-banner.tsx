'use client';

import { ALERT_TYPE, SIZE } from '@blog/config';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TElevateTenantOwnerOutcome,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import { Alert } from '@platform/components/shared/alert';
import { LinkButton } from '@platform/components/shared/link-button';
import type { TProvisioningErrorKind } from '@platform/utils/provisioning-error/provisioning-error';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

import { STEP_ORDER } from '../provisioning-status-view/use-provisioning-poll';

import { provisioningBannerVariants } from './provisioning-banner-variants';

export type TProvisioningBannerProps = {
  tenantId: string;
  provisioningStatus: TTenantProvisioningStatus | null;
  stepStatuses: TTenantProvisioningStepStatus[];
  isOverallFailed: boolean;
  isProvisioningRunning: boolean;
  errorKind: TProvisioningErrorKind | undefined;
  ownerElevationOutcome: TElevateTenantOwnerOutcome | undefined;
};

const ACTIONABLE_OWNER_ELEVATION_OUTCOMES: TElevateTenantOwnerOutcome[] = [
  ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
  ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP,
];

export const ProvisioningBanner = ({
  tenantId,
  provisioningStatus,
  stepStatuses,
  isOverallFailed,
  isProvisioningRunning,
  errorKind,
  ownerElevationOutcome,
}: TProvisioningBannerProps) => {
  const t = useTranslations('provisioningBanner');
  const tSteps = useTranslations('provisioningStatusView');
  const { root } = provisioningBannerVariants();

  const viewStepsButton = (
    <LinkButton
      href={adminRoutes.tenantProvisioning(tenantId)}
      variant="secondary"
      size={SIZE.SM}
      hasArrow={true}
    >
      {t('viewStepsButton')}
    </LinkButton>
  );

  if (provisioningStatus === TENANT_PROVISIONING_STATUS.READY) {
    const showOwnerElevationNotice =
      !!ownerElevationOutcome &&
      ACTIONABLE_OWNER_ELEVATION_OUTCOMES.includes(ownerElevationOutcome);

    return (
      <div className={root()}>
        <Alert
          type={ALERT_TYPE.SUCCESS}
          title={t('readyTitle')}
          description={t('readyDescription')}
          action={viewStepsButton}
        />
        {showOwnerElevationNotice && ownerElevationOutcome && (
          <Alert
            type={ALERT_TYPE.WARNING}
            title={t(`ownerElevationBadge.${ownerElevationOutcome}`)}
            description={t(
              `ownerElevationDescription.${ownerElevationOutcome}`,
            )}
          />
        )}
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
      <Alert
        type={ALERT_TYPE.ERROR}
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
      <Alert
        type={ALERT_TYPE.WARNING}
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
