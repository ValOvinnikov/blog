import type { IWithClassName } from '@blog/config/types';
import {
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import { StepIndicator } from '@platform/components/shared/step-indicator';
import {
  STEP_INDICATOR_STATE,
  type TStepIndicatorState,
} from '@platform/constants/step-indicator';
import type { ReactNode } from 'react';

import { stepListVariants } from './step-list-variants';

export type TStepListStep = {
  key: string;
  title: string;
  status: TTenantProvisioningStepStatus;
  statusLabel: string;
  trailingSlot?: ReactNode;
  updatedAt?: string;
  updatedAtLabel?: string;
};

type TStepListProps = IWithClassName & {
  steps: TStepListStep[];
};

const INDICATOR_STATE_BY_STATUS: Record<
  TTenantProvisioningStepStatus,
  TStepIndicatorState
> = {
  [TENANT_PROVISIONING_STEP_STATUS.IDLE]: STEP_INDICATOR_STATE.UPCOMING,
  [TENANT_PROVISIONING_STEP_STATUS.RUNNING]: STEP_INDICATOR_STATE.RUNNING,
  [TENANT_PROVISIONING_STEP_STATUS.DONE]: STEP_INDICATOR_STATE.DONE,
  [TENANT_PROVISIONING_STEP_STATUS.FAILED]: STEP_INDICATOR_STATE.FAILED,
};

export const StepList = ({ steps, className }: TStepListProps) => {
  const {
    list,
    step,
    stepBody,
    stepTitle,
    stepStatusLive,
    stepWhen,
    visuallyHidden,
  } = stepListVariants();

  return (
    <div className={list({ class: className })}>
      {steps.map(
        (
          {
            key,
            title,
            status,
            statusLabel,
            trailingSlot,
            updatedAt,
            updatedAtLabel,
          },
          index,
        ) => {
          return (
            <div className={step()} key={key}>
              <StepIndicator
                state={INDICATOR_STATE_BY_STATUS[status]}
                stepNumber={index + 1}
                hasConnector={index < steps.length - 1}
                isConnectorDone={
                  status === TENANT_PROVISIONING_STEP_STATUS.DONE
                }
              />
              <div className={stepBody()}>
                <span className={stepTitle()}>{title}</span>
                <span
                  className={stepStatusLive()}
                  role="status"
                  aria-live="polite"
                  data-testid={`step-status-live-${key}`}
                >
                  <span className={visuallyHidden()}>{statusLabel}</span>
                </span>
              </div>
              {trailingSlot && (
                <span className={stepWhen()}>{trailingSlot}</span>
              )}
              {updatedAt && updatedAtLabel && (
                <time dateTime={updatedAt} className={stepWhen()}>
                  {updatedAtLabel}
                </time>
              )}
            </div>
          );
        },
      )}
    </div>
  );
};
