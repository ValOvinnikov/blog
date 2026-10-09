import { Card } from '@platform/components/shared/card';
import type { ReactNode } from 'react';

import { wizardRailVariants } from './wizard-rail-variants';

export type TWizardRailStep = {
  title: ReactNode;
  description: ReactNode;
};

type TWizardRailProps = {
  steps: TWizardRailStep[];
  activeIndex: number;
  ariaLabel: string;
  className?: string;
};

export const WizardRail = ({
  steps,
  activeIndex,
  ariaLabel,
  className,
}: TWizardRailProps) => {
  const {
    root,
    list,
    item,
    indicatorCol,
    circle,
    connector,
    stepBody,
    stepTitle,
    stepDescription,
  } = wizardRailVariants();

  return (
    <Card className={root({ class: className })}>
      <Card.Body>
        <ol aria-label={ariaLabel} className={list()}>
          {steps.map((step, index) => {
            const isActive = index === activeIndex;
            const isLast = index === steps.length - 1;

            return (
              <li
                key={index}
                className={item()}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className={indicatorCol()}>
                  <span className={circle({ isActive })} aria-hidden="true">
                    {index + 1}
                  </span>
                  {!isLast && (
                    <span className={connector()} aria-hidden="true" />
                  )}
                </div>
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
