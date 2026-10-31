'use client';

import { ACTION_OUTCOME, ALERT_TYPE, SIZE } from '@blog/config';
import {
  CORE_PROVISIONING_STEPS,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { RunStepsCard } from '@platform/components/features/tenants/run-steps-card';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { useProvisioningPoll } from '@platform/utils/use-provisioning-poll/use-provisioning-poll';
import { useTranslations } from 'next-intl';

import { siteSetupCardVariants } from './site-setup-card-variants';

export type TSiteSetupCardProps = {
  tenant: TClientTenant;
  canRetry: boolean;
};

export const SiteSetupCard = ({ tenant, canRetry }: TSiteSetupCardProps) => {
  const t = useTranslations('ownerHomePage');
  const tSteps = useTranslations('provisioningStatusView');
  const {
    dispatchNotice,
    handleDispatch,
    isDispatchPending,
    displayStepStatuses,
    stepUpdatedAt,
    isAwaitingRunner,
    isOverallFailed,
    allIdle,
    provisioningStatus,
  } = useProvisioningPoll(tenant);
  const { root } = siteSetupCardVariants();

  const steps = CORE_PROVISIONING_STEPS.map((stepKey, index) => ({
    key: stepKey,
    title: tSteps(`stepLabel.${stepKey}`),
    status: displayStepStatuses[index] ?? TENANT_PROVISIONING_STEP_STATUS.IDLE,
    updatedAt: stepUpdatedAt[index],
  }));
  const isRetryFailed =
    dispatchNotice !== undefined &&
    dispatchNotice !== TENANT_REFUSAL.ALREADY_IN_PROGRESS;
  const isNotStarted =
    allIdle && provisioningStatus === TENANT_PROVISIONING_STATUS.PENDING;
  const dispatchButton = (label: string, pendingLabel: string) =>
    canRetry ? (
      <Button
        variant={BUTTON_VARIANT.SECONDARY}
        size={SIZE.SM}
        isPending={isDispatchPending}
        pendingLabel={pendingLabel}
        onClick={handleDispatch}
      >
        {label}
      </Button>
    ) : undefined;

  return (
    <div className={root()}>
      {isOverallFailed && (
        <Alert
          type={ALERT_TYPE.ERROR}
          title={t('siteSetupFailedTitle')}
          description={t(
            canRetry
              ? 'siteSetupFailedDescription'
              : 'siteSetupFailedContactDescription',
          )}
          action={dispatchButton(t('siteSetupRetry'), t('siteSetupRetrying'))}
        />
      )}
      {isNotStarted && (
        <Alert
          type={ALERT_TYPE.WARNING}
          title={t('siteSetupNotStartedTitle')}
          description={t(
            canRetry
              ? 'siteSetupNotStartedDescription'
              : 'siteSetupNotStartedContactDescription',
          )}
          action={dispatchButton(t('siteSetupStart'), t('siteSetupStarting'))}
        />
      )}
      {isRetryFailed && (
        <Alert
          type={ALERT_TYPE.ERROR}
          title={t(
            dispatchNotice === ACTION_OUTCOME.SERVER_ERROR
              ? 'siteSetupRetryFailed'
              : 'siteSetupRetryRefused',
          )}
        />
      )}
      <RunStepsCard
        title={t('siteSetupCardTitle')}
        steps={steps}
        isDone={steps.every(
          ({ status }) => status === TENANT_PROVISIONING_STEP_STATUS.DONE,
        )}
        isPreRun={isAwaitingRunner}
      />
    </div>
  );
};
