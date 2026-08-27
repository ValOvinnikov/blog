import type { ReactNode } from 'react';

import { wizardRailVariants } from './wizard-rail-variants';

export type TWizardRailStep = {
  title: ReactNode;
  description: ReactNode;
};

export type TWizardRailProps = {
  steps: TWizardRailStep[];
  /** Zero-based index of the step currently underway. */
  activeIndex: number;
  ariaLabel: string;
  className?: string;
};

/**
 * A static left-rail step indicator for a multi-step flow — numbered circles
 * connected by a rule, the active step's circle filled in brand color and
 * every other step left neutral. Purely presentational: it renders whatever
 * `steps`/`activeIndex` it's given and has no notion of progress itself.
 */
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
    <nav aria-label={ariaLabel} className={root({ class: className })}>
      <ol className={list()}>
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
                {!isLast && <span className={connector()} aria-hidden="true" />}
              </div>
              <div className={stepBody()}>
                <span className={stepTitle()}>{step.title}</span>
                <span className={stepDescription()}>{step.description}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
