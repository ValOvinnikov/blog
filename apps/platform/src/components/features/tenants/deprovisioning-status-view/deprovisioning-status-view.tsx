'use client';

import {
  CORE_DEPROVISIONING_STEPS,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { RunCard } from '@platform/components/features/tenants/run-card';
import { RunErrorCard } from '@platform/components/features/tenants/run-error-card';
import { RunStatusBadge } from '@platform/components/features/tenants/run-status-badge';
import { RunStepsCard } from '@platform/components/features/tenants/run-steps-card';
import type { THeadingLevel } from '@platform/components/shared/heading';
import type { TUseDeprovisioningPollResult } from '@platform/utils/use-deprovisioning-poll/use-deprovisioning-poll';
import { useRelativeTimeTick } from '@platform/utils/use-relative-time-tick/use-relative-time-tick';
import { useTranslations } from 'next-intl';

import { deprovisioningStatusViewVariants } from './deprovisioning-status-view-variants';

export type TDeprovisioningStatusViewProps = {
  poll: TUseDeprovisioningPollResult;
  headingLevel?: Exclude<THeadingLevel, 1>;
};

export const DeprovisioningStatusView = ({
  poll,
  headingLevel = 2,
}: TDeprovisioningStatusViewProps) => {
  const t = useTranslations('deprovisioningStatusView');
  const {
    deprovisioningSteps,
    stepStatuses,
    stepUpdatedAt,
    run,
    overallStatus,
    isDone,
    isFailed,
    failedStep,
    failedStepError,
    errorKind,
  } = poll;
  useRelativeTimeTick();

  const isPreRun = deprovisioningSteps === null;
  const { root, cardsRow } = deprovisioningStatusViewVariants();

  const steps = CORE_DEPROVISIONING_STEPS.map((stepKey, index) => ({
    key: stepKey,
    title: t(`stepLabel.${stepKey}`),
    status: stepStatuses[index] ?? TENANT_PROVISIONING_STEP_STATUS.IDLE,
    updatedAt: stepUpdatedAt[index],
  }));

  return (
    <div className={root()}>
      <div className={cardsRow()}>
        <RunStepsCard
          title={t('cardTitle')}
          steps={steps}
          isDone={isDone}
          isPreRun={isPreRun}
          headingLevel={headingLevel}
        />

        <RunCard
          run={run}
          headingLevel={headingLevel}
          actions={
            <RunStatusBadge status={overallStatus} isPreRun={isPreRun} />
          }
        />
      </div>

      {isFailed && errorKind && failedStep && (
        <RunErrorCard
          headline={t(`errorKind.${errorKind}.headline`)}
          body={t(`errorKind.${errorKind}.body`)}
          failedStepLine={t('failedStepLabel', {
            step: t(`stepLabel.${failedStep}`),
          })}
          nextStep={t(`errorKind.${errorKind}.nextStep`)}
          technicalDetails={failedStepError}
          technicalDetailsLabel={t('technicalDetailsToggle')}
          headingLevel={headingLevel}
        />
      )}
    </div>
  );
};
