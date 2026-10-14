import type { TMaybeUndefined } from '@blog/config';
import {
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';

type TRunStepState = {
  status: TTenantProvisioningStepStatus;
  updatedAt?: string;
};

type TRunSteps<TStep extends string> = Partial<
  Record<TStep, TRunStepState>
> | null;

export const stepStatusesFor = <TStep extends string>(
  steps: TRunSteps<TStep>,
  order: readonly TStep[],
): TTenantProvisioningStepStatus[] =>
  order.map(
    (stepKey) =>
      steps?.[stepKey]?.status ?? TENANT_PROVISIONING_STEP_STATUS.IDLE,
  );

export const stepUpdatedAtFor = <TStep extends string>(
  steps: TRunSteps<TStep>,
  order: readonly TStep[],
): TMaybeUndefined<string>[] =>
  order.map((stepKey) => steps?.[stepKey]?.updatedAt);

export const findFailedStep = <TStep extends string>(
  stepStatuses: TTenantProvisioningStepStatus[],
  order: readonly TStep[],
): TMaybeUndefined<TStep> =>
  order[stepStatuses.indexOf(TENANT_PROVISIONING_STEP_STATUS.FAILED)];
