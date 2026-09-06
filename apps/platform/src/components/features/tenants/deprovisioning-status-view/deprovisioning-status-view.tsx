'use client';

import { ICONS } from '@blog/config';
import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { Card } from '@platform/components/shared/card';
import { Heading } from '@platform/components/shared/heading';
import { Icon } from '@platform/components/shared/icon';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { StepList } from '@platform/components/shared/step-list';
import { Text } from '@platform/components/shared/text';
import { formatRelativeTime } from '@platform/utils/format-relative-time/format-relative-time';
import { provisioningStepTone } from '@platform/utils/status-tone/status-tone';
import { useRelativeTimeTick } from '@platform/utils/use-relative-time-tick/use-relative-time-tick';
import { useTranslations } from 'next-intl';

import { RunCard } from './components/run-card/run-card';
import { deprovisioningStatusViewVariants } from './deprovisioning-status-view-variants';
import { STEP_ORDER, useDeprovisioningPoll } from './use-deprovisioning-poll';

type TDeprovisioningStatusViewProps = {
  tenant: TTenant;
};

/**
 * The danger page's live teardown-progress card — the six deprovisioning
 * steps read live from `tenant.deprovisioningSteps`, polled while a run is
 * in progress. There is no retry control here: a failed run is re-dispatched
 * through `DeprovisionTenantControl`, the card above this one.
 */
export const DeprovisioningStatusView = ({
  tenant,
}: TDeprovisioningStatusViewProps) => {
  const t = useTranslations('deprovisioningStatusView');
  const {
    deprovisioningSteps,
    stepStatuses,
    stepUpdatedAt,
    run,
    overallStatus,
    isFailed,
    failedStep,
    failedStepError,
    errorKind,
  } = useDeprovisioningPoll(tenant);
  useRelativeTimeTick();

  const isPreRun = deprovisioningSteps === null;

  const {
    root,
    cardBody,
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

  return (
    <div className={root()}>
      <Card>
        <Card.Header
          title={t('cardTitle')}
          headingLevel={2}
          actions={overallStatusBadge}
        />
        <Card.Body className={cardBody()}>
          <StepList steps={stepListSteps} />
        </Card.Body>
      </Card>

      {run && <RunCard run={run} />}

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
