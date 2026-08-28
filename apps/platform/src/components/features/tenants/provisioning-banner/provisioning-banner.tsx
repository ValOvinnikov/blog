'use client';

import { Size } from '@blog/config';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TElevateTenantOwnerOutcome,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import { BannerState } from '@platform/components/shared/banner-state';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type { TProvisioningErrorKind } from '@platform/utils/provisioning-error/provisioning-error';
import { adminRoutes } from '@platform/utils/routes/routes';
import { ownerElevationTone } from '@platform/utils/status-tone/status-tone';
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
  /** Only rendered once provisioning is READY, and only for the two outcomes an operator can act on (`STALLED` / `AMBIGUOUS_MEMBERSHIP`) — see `ownerElevationTone`. */
  ownerElevationOutcome: TElevateTenantOwnerOutcome | undefined;
};

const ACTIONABLE_OWNER_ELEVATION_OUTCOMES: TElevateTenantOwnerOutcome[] = [
  ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
  ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP,
];

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
  ownerElevationOutcome,
}: TProvisioningBannerProps) => {
  const t = useTranslations('provisioningBanner');
  const tSteps = useTranslations('provisioningStatusView');
  const { root, ownerElevationRow, ownerElevationDescription } =
    provisioningBannerVariants();

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
    const showOwnerElevationNotice =
      !!ownerElevationOutcome &&
      ACTIONABLE_OWNER_ELEVATION_OUTCOMES.includes(ownerElevationOutcome);

    return (
      <div className={root()}>
        <BannerState
          tone="ok"
          role="status"
          title={t('readyTitle')}
          description={t('readyDescription')}
          action={viewStepsButton}
        />
        {showOwnerElevationNotice && ownerElevationOutcome && (
          <div className={ownerElevationRow()} role="status">
            <StatusBadge tone={ownerElevationTone(ownerElevationOutcome)}>
              {t(`ownerElevationBadge.${ownerElevationOutcome}`)}
            </StatusBadge>
            <span className={ownerElevationDescription()}>
              {t(`ownerElevationDescription.${ownerElevationOutcome}`)}
            </span>
          </div>
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
