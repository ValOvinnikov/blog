'use client';

import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { RunErrorCard } from '@platform/components/features/tenants/run-error-card';
import { Card } from '@platform/components/shared/card';
import { Disclosure } from '@platform/components/shared/disclosure';
import type { THeadingLevel } from '@platform/components/shared/heading';
import { headingVariants } from '@platform/components/shared/heading/heading-variants';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { StepList } from '@platform/components/shared/step-list';
import { Text } from '@platform/components/shared/text';
import { formatRelativeTime } from '@platform/utils/format-relative-time/format-relative-time';
import { provisioningStepTone } from '@platform/utils/status-tone/status-tone';
import { useCollapseOnDone } from '@platform/utils/use-collapse-on-done/use-collapse-on-done';
import { useRelativeTimeTick } from '@platform/utils/use-relative-time-tick/use-relative-time-tick';
import { useLocale, useTranslations } from 'next-intl';

import { RunCard } from './components/run-card/run-card';
import { deprovisioningStatusViewVariants } from './deprovisioning-status-view-variants';
import {
  STEP_ORDER,
  type TUseDeprovisioningPollResult,
} from './use-deprovisioning-poll';

export type TDeprovisioningStatusViewProps = {
  poll: TUseDeprovisioningPollResult;
  headingLevel?: Exclude<THeadingLevel, 1>;
};

/** No retry control: a failed run is re-dispatched through `DeprovisionTenantControl`, which the page renders above this. */
export const DeprovisioningStatusView = ({
  poll,
  headingLevel = 2,
}: TDeprovisioningStatusViewProps) => {
  const t = useTranslations('deprovisioningStatusView');
  const locale = useLocale();
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
  const { isOpen: isStepsOpen, onOpenChange: setIsStepsOpen } =
    useCollapseOnDone(isDone);

  const isPreRun = deprovisioningSteps === null;
  const doneStepCount = stepStatuses.filter(
    (status) => status === TENANT_PROVISIONING_STEP_STATUS.DONE,
  ).length;

  const { root, cardsRow, stepsCard, stepsSummary, overallStatusLive } =
    deprovisioningStatusViewVariants();

  const stepListSteps = STEP_ORDER.map((stepKey, index) => {
    const status = stepStatuses[index] ?? TENANT_PROVISIONING_STEP_STATUS.IDLE;
    const isStepFailed = status === TENANT_PROVISIONING_STEP_STATUS.FAILED;
    const isStepDone = status === TENANT_PROVISIONING_STEP_STATUS.DONE;
    const isStepRunning = status === TENANT_PROVISIONING_STEP_STATUS.RUNNING;
    const updatedAt = stepUpdatedAt[index];
    const relativeUpdatedAt =
      (isStepDone || isStepFailed) && updatedAt
        ? formatRelativeTime(new Date(updatedAt), t, locale)
        : undefined;

    return {
      key: stepKey,
      title: t(`stepLabel.${stepKey}`),
      status,
      statusLabel: isPreRun
        ? t('preRunStepStatusLabel')
        : t(`statusLabel.${status}`),
      trailingSlot: isStepRunning ? t('stepRunningNow') : undefined,
      updatedAt,
      updatedAtLabel: relativeUpdatedAt,
    };
  });

  const overallStatusBadge = isPreRun ? (
    <StatusBadge tone="warn">{t('startingBadge')}</StatusBadge>
  ) : overallStatus === TENANT_PROVISIONING_STEP_STATUS.FAILED ? (
    <StatusBadge tone="bad">{t(`statusLabel.${overallStatus}`)}</StatusBadge>
  ) : (
    <StatusBadge tone={provisioningStepTone(overallStatus)}>
      {t(`statusLabel.${overallStatus}`)}
    </StatusBadge>
  );

  const overallStatusBadgeLive = (
    <span className={overallStatusLive()} aria-live="polite">
      {overallStatusBadge}
    </span>
  );

  return (
    <div className={root()}>
      <div className={cardsRow()}>
        <Disclosure
          className={stepsCard()}
          isOpen={isStepsOpen}
          onOpenChange={setIsStepsOpen}
          headingLevel={headingLevel}
          summary={
            <span className={stepsSummary()}>
              <span className={headingVariants({ size: 'cardTitle' })}>
                {t('cardTitle')}
              </span>
              <StatusBadge tone="neutral">
                {t('stepsCompletionBadge', {
                  done: doneStepCount,
                  total: STEP_ORDER.length,
                })}
              </StatusBadge>
            </span>
          }
        >
          <StepList steps={stepListSteps} />
        </Disclosure>

        {run ? (
          <RunCard
            run={run}
            actions={overallStatusBadgeLive}
            headingLevel={headingLevel}
          />
        ) : (
          <Card>
            <Card.Header
              title={t('runCardTitle')}
              headingLevel={headingLevel}
              actions={overallStatusBadgeLive}
            />
            <Card.Body>
              <Text variant="supporting">{t('runCardEmpty')}</Text>
            </Card.Body>
          </Card>
        )}
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
