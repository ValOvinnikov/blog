'use client';

import { SIZE, type TMaybeUndefined } from '@blog/config';
import {
  CORE_PROVISIONING_STEPS,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { RunCard } from '@platform/components/features/tenants/run-card';
import { RunErrorCard } from '@platform/components/features/tenants/run-error-card';
import { RunStatusBadge } from '@platform/components/features/tenants/run-status-badge';
import { RunStepsCard } from '@platform/components/features/tenants/run-steps-card';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { Button } from '@platform/components/shared/button';
import { PageHeader } from '@platform/components/shared/page-header';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { useProvisioningPoll } from '@platform/utils/use-provisioning-poll/use-provisioning-poll';
import { useRelativeTimeTick } from '@platform/utils/use-relative-time-tick/use-relative-time-tick';
import { useStagedStepStatuses } from '@platform/utils/use-staged-step-statuses/use-staged-step-statuses';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { DispatchNotice } from './components/dispatch-notice/dispatch-notice';
import { QueuedRunNotice } from './components/queued-run-notice/queued-run-notice';
import { provisioningStatusViewVariants } from './provisioning-status-view-variants';

type TProvisioningStatusViewProps = {
  tenant: TClientTenant;
  ownerEmail: TMaybeUndefined<string>;
};

export const ProvisioningStatusView = ({
  tenant,
  ownerEmail,
}: TProvisioningStatusViewProps) => {
  const t = useTranslations('provisioningStatusView');
  const {
    dispatchNotice,
    handleDispatch,
    displayStepStatuses,
    stepUpdatedAt,
    provisioningRun,
    allIdle,
    isProvisioningRunning,
    isAwaitingRunner,
    isOverallFailed,
    displayOverallStatus,
    failedStepError,
    errorKind,
  } = useProvisioningPoll(tenant);
  useRelativeTimeTick();
  const { stagedStatuses, isRevealing } =
    useStagedStepStatuses(displayStepStatuses);

  const isArchived = Boolean(tenant.deprovisionedAt);
  const archivedNoticeId = useId();
  const { root, ownerRow, cardsRow } = provisioningStatusViewVariants();

  const steps = CORE_PROVISIONING_STEPS.map((stepKey, index) => ({
    key: stepKey,
    title: t(`stepLabel.${stepKey}`),
    status: stagedStatuses[index] ?? TENANT_PROVISIONING_STEP_STATUS.IDLE,
    updatedAt: stepUpdatedAt[index],
  }));

  const retryButtonNode = isOverallFailed ? (
    <Button
      type="button"
      variant={BUTTON_VARIANT.SECONDARY}
      size={SIZE.SM}
      focusGround={FOCUS_RING_GROUND.SURFACE_HEAD}
      onClick={handleDispatch}
      isDisabled={isArchived}
      aria-describedby={isArchived ? archivedNoticeId : undefined}
    >
      {t('retryButton')}
    </Button>
  ) : null;

  const startButtonNode =
    allIdle && !isProvisioningRunning ? (
      <Button
        type="button"
        variant={BUTTON_VARIANT.PRIMARY}
        focusGround={FOCUS_RING_GROUND.BG}
        onClick={handleDispatch}
        isDisabled={isArchived}
        aria-describedby={isArchived ? archivedNoticeId : undefined}
      >
        {t('startButton')}
      </Button>
    ) : null;

  const runCardActions = (
    <>
      <RunStatusBadge
        status={
          isOverallFailed
            ? TENANT_PROVISIONING_STEP_STATUS.FAILED
            : isRevealing
              ? TENANT_PROVISIONING_STEP_STATUS.RUNNING
              : displayOverallStatus
        }
        isPreRun={isAwaitingRunner}
      />
      {retryButtonNode}
    </>
  );

  return (
    <div className={root()}>
      <PageHeader
        title={t('pageTitle')}
        description={t('description', { tenantName: tenant.name })}
        actions={startButtonNode}
      />

      {tenant.deprovisionedAt && (
        <ArchivedTenantNotice
          id={archivedNoticeId}
          archivedAt={tenant.deprovisionedAt}
        />
      )}

      {!ownerEmail && (
        <div className={ownerRow()}>
          <Text variant="meta">{t('ownerLabel')}</Text>
          <StatusBadge tone="warn">{t('ownerInvitedPendingBadge')}</StatusBadge>
        </div>
      )}

      {dispatchNotice && <DispatchNotice notice={dispatchNotice} />}

      {isAwaitingRunner && (
        <QueuedRunNotice admittedAt={provisioningRun?.admittedAt} />
      )}

      <div className={cardsRow()}>
        <div data-testid="provisioning-steps">
          <RunStepsCard
            title={t('stepsCardTitle')}
            steps={steps}
            isDone={stagedStatuses.every(
              (status) => status === TENANT_PROVISIONING_STEP_STATUS.DONE,
            )}
            isPreRun={isAwaitingRunner}
          />
        </div>

        <RunCard run={provisioningRun} actions={runCardActions} />
      </div>

      {isOverallFailed && errorKind && (
        <RunErrorCard
          headline={t(`errorKind.${errorKind}.headline`)}
          body={t(`errorKind.${errorKind}.body`)}
          nextStep={t(`errorKind.${errorKind}.nextStep`)}
          technicalDetails={failedStepError}
          technicalDetailsLabel={t('technicalDetailsToggle')}
        />
      )}
    </div>
  );
};
