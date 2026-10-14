import type { IWithClassName } from '@blog/config/types';
import { Card } from '@platform/components/shared/card';
import { StepIndicator } from '@platform/components/shared/step-indicator';
import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';
import type { ReactNode } from 'react';

import { wizardRailVariants } from './wizard-rail-variants';

export type TWizardRailStep = {
  id: string;
  title: ReactNode;
  description: ReactNode;
};

type TWizardRailProps = IWithClassName & {
  steps: TWizardRailStep[];
  activeIndex: number;
  ariaLabel: string;
};

export const WizardRail = ({
  steps,
  activeIndex,
  ariaLabel,
  className,
}: TWizardRailProps) => {
  const { root, list, item, stepBody, stepTitle, stepDescription } =
    wizardRailVariants();

  return (
    <Card className={root({ class: className })}>
      <Card.Body>
        <ol aria-label={ariaLabel} className={list()}>
          {steps.map((step, index) => {
            const isActive = index === activeIndex;

            return (
              <li
                key={step.id}
                className={item()}
                aria-current={isActive ? 'step' : undefined}
              >
                <StepIndicator
                  state={
                    isActive
                      ? STEP_INDICATOR_STATE.ACTIVE
                      : STEP_INDICATOR_STATE.UPCOMING
                  }
                  stepNumber={index + 1}
                  hasConnector={index < steps.length - 1}
                />
                <div className={stepBody()}>
                  <span className={stepTitle()}>{step.title}</span>
                  <span className={stepDescription()}>{step.description}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </Card.Body>
    </Card>
  );
};
