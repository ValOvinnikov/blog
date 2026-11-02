import type { TMaybeUndefined } from '@blog/config';
import {
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import type { TProvisioningRun } from '@blog/db/schema/tenants';
import { RunCard } from '@platform/components/features/tenants/run-card';
import { RunStatusBadge } from '@platform/components/features/tenants/run-status-badge';
import type { ReactNode } from 'react';

type TProvisioningRunCardProps = {
  run: TMaybeUndefined<TProvisioningRun>;
  overallStatus: TTenantProvisioningStepStatus;
  isFailed: boolean;
  isRevealingSteps: boolean;
  isPreRun: boolean;
  retryAction: ReactNode;
};

export const ProvisioningRunCard = ({
  run,
  overallStatus,
  isFailed,
  isRevealingSteps,
  isPreRun,
  retryAction,
}: TProvisioningRunCardProps) => {
  const status = isFailed
    ? TENANT_PROVISIONING_STEP_STATUS.FAILED
    : isRevealingSteps
      ? TENANT_PROVISIONING_STEP_STATUS.RUNNING
      : overallStatus;

  return (
    <RunCard
      run={isRevealingSteps && run ? { ...run, finishedAt: undefined } : run}
      actions={
        <>
          <RunStatusBadge status={status} isPreRun={isPreRun} />
          {retryAction}
        </>
      }
    />
  );
};
