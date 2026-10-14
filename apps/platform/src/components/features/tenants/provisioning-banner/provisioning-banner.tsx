'use client';

import { ALERT_TYPE, SIZE } from '@blog/config';
import {
  CORE_PROVISIONING_STEPS,
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import { Alert } from '@platform/components/shared/alert';
import { LinkButton } from '@platform/components/shared/link-button';
import { adminRoutes } from '@platform/utils/routes/routes';
import { findFailedStep } from '@platform/utils/run-steps/run-steps';
import type { TUseProvisioningPollResult } from '@platform/utils/use-provisioning-poll/use-provisioning-poll';
import { useTranslations } from 'next-intl';

import { provisioningBannerVariants } from './provisioning-banner-variants';

export type TProvisioningBannerProps = {
  tenantId: string;
  poll: Pick<
    TUseProvisioningPollResult,
    | 'provisioningStatus'
    | 'stepStatuses'
    | 'isOverallFailed'
    | 'isProvisioningRunning'
    | 'errorKind'
    | 'ownerElevationOutcome'
  >;
};

const ACTIONABLE_OWNER_ELEVATION_OUTCOMES: TElevateTenantOwnerOutcome[] = [
  ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
  ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP,
];

export const ProvisioningBanner = ({
  tenantId,
  poll,
}: TProvisioningBannerProps) => {
  const {
    provisioningStatus,
    stepStatuses,
    isOverallFailed,
    isProvisioningRunning,
    errorKind,
    ownerElevationOutcome,
  } = poll;
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
    const failedStep = findFailedStep(stepStatuses, CORE_PROVISIONING_STEPS);
    const failedDescription =
      errorKind && failedStep
        ? t('failedDescription', {
            step: tSteps(`stepLabel.${failedStep}`),
            reason: tSteps(`errorKind.${errorKind}.headline`),
          })
        : t('failedDescriptionFallback');

    return (
      <Alert
        type={ALERT_TYPE.ERROR}
        title={t('failedTitle', {
          step: failedStep
            ? CORE_PROVISIONING_STEPS.indexOf(failedStep) + 1
            : 0,
          total: CORE_PROVISIONING_STEPS.length,
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
          total: CORE_PROVISIONING_STEPS.length,
        })}
        description={t('runningDescription')}
        action={viewStepsButton}
      />
    );
  }

  return null;
};
