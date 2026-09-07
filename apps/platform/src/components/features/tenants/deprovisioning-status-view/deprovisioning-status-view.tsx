'use client';

import { ICONS } from '@blog/config';
import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { Card } from '@platform/components/shared/card';
import { Disclosure } from '@platform/components/shared/disclosure';
import { Heading } from '@platform/components/shared/heading';
import { Icon } from '@platform/components/shared/icon';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { StepList } from '@platform/components/shared/step-list';
import { Text } from '@platform/components/shared/text';
import { formatRelativeTime } from '@platform/utils/format-relative-time/format-relative-time';
import { provisioningStepTone } from '@platform/utils/status-tone/status-tone';
import { useCollapseOnDone } from '@platform/utils/use-collapse-on-done/use-collapse-on-done';
import { useRelativeTimeTick } from '@platform/utils/use-relative-time-tick/use-relative-time-tick';
import { useTranslations } from 'next-intl';

import { RunCard } from './components/run-card/run-card';
import { deprovisioningStatusViewVariants } from './deprovisioning-status-view-variants';
import {
  STEP_ORDER,
  type TUseDeprovisioningPollResult,
} from './use-deprovisioning-poll';

export type TDeprovisioningStatusViewProps = {
  poll: TUseDeprovisioningPollResult;
};

/**
 * The danger page's live teardown-progress view — the six deprovisioning
 * steps read from the poll result its caller derived, paired with the run
 * card. There is no retry control here: a failed run is re-dispatched
 * through `DeprovisionTenantControl`, rendered above this by the page.
 */
export const DeprovisioningStatusView = ({
  poll,
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
  const { isOpen: isStepsOpen, onOpenChange: setIsStepsOpen } =
    useCollapseOnDone(isDone);

  const isPreRun = deprovisioningSteps === null;
  const doneStepCount = stepStatuses.filter(
    (status) => status === TENANT_PROVISIONING_STEP_STATUS.DONE,
  ).length;

  const {
    root,
    cardsRow,
    stepsCard,
    stepsSummary,
    overallStatusLive,
    errorCard,
    errorHeadingRow,
    errorHeadline,
    errorIcon,
    errorDetails,
    errorDetailsSummary,
    errorDetailsText,
  } = deprovisioningStatusViewVariants();

  const stepListSteps = STEP_ORDER.map((stepKey, index) => {
    const status = stepStatuses[index] ?? TENANT_PROVISIONING_STEP_STATUS.IDLE;
    const isStepFailed = status === TENANT_PROVISIONING_STEP_STATUS.FAILED;
    const isStepDone = status === TENANT_PROVISIONING_STEP_STATUS.DONE;
    const isStepRunning = status === TENANT_PROVISIONING_STEP_STATUS.RUNNING;
    const updatedAt = stepUpdatedAt[index];
    const relativeUpdatedAt =
      (isStepDone || isStepFailed) && updatedAt
        ? formatRelativeTime(new Date(updatedAt), t)
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
          summary={
            <span className={stepsSummary()}>
              <Heading level={2} size="cardTitle">
                {t('cardTitle')}
              </Heading>
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
          <RunCard run={run} actions={overallStatusBadgeLive} />
        ) : (
          <Card>
            <Card.Header
              title={t('runCardTitle')}
              headingLevel={2}
              actions={overallStatusBadgeLive}
            />
          </Card>
        )}
      </div>

      {isFailed && errorKind && failedStep && (
        <div className={errorCard()} role="alert">
          <div className={errorHeadingRow()}>
            <Icon name={ICONS.WARNING} className={errorIcon()} />
            <Heading level={2} size="cardTitle" className={errorHeadline()}>
              {t(`errorKind.${errorKind}.headline`)}
            </Heading>
          </div>
          <Text variant="supporting">{t(`errorKind.${errorKind}.body`)}</Text>
          <Text variant="hint">
            {t('failedStepLabel', { step: t(`stepLabel.${failedStep}`) })}
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
    </div>
  );
};
