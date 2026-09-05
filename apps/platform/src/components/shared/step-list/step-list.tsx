import {
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
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

type TStepListProps = {
  steps: TStepListStep[];
  className?: string;
};

/**
 * A numbered/✓/! indicator stepper with a connector between steps and a
 * visually-hidden per-step status announcement — every value it renders is
 * already resolved by the caller.
 */
export const StepList = ({ steps, className }: TStepListProps) => {
  const {
    list,
    step,
    indicatorCol,
    circle,
    connector,
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
          const isFailed = status === TENANT_PROVISIONING_STEP_STATUS.FAILED;
          const isDone = status === TENANT_PROVISIONING_STEP_STATUS.DONE;
          const isLast = index === steps.length - 1;

          return (
            <div className={step()} key={key}>
              <div className={indicatorCol()}>
                <span className={circle({ status })} aria-hidden="true">
                  {isDone ? '✓' : isFailed ? '!' : index + 1}
                </span>
                {!isLast && (
                  <span className={connector({ isDone })} aria-hidden="true" />
                )}
              </div>
              <div className={stepBody()}>
                <span className={stepTitle()}>{title}</span>
                {/* The circle glyph is decorative (`aria-hidden`); this
                    visually-hidden text is what actually carries the step's
                    status to assistive tech, inside a stable live region. */}
                <span className={stepStatusLive()} aria-live="polite">
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
