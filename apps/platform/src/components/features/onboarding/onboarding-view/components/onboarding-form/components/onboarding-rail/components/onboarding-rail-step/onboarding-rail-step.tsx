import type { TMaybeUndefined } from '@blog/config';
import { StepIndicator } from '@platform/components/shared/step-indicator';
import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';

import {
  onboardingRailStepVariants,
  type TOnboardingRailStepVariants,
} from './onboarding-rail-step-variants';

export type TOnboardingRailStepProps = {
  stepNumber: number;
  label: string;
  summary: TMaybeUndefined<string>;
  state: NonNullable<TOnboardingRailStepVariants['state']>;
};

export const OnboardingRailStep = ({
  stepNumber,
  label,
  summary,
  state,
}: TOnboardingRailStepProps) => {
  const {
    item,
    body,
    label: labelSlot,
    summary: summarySlot,
  } = onboardingRailStepVariants({ state });
  const isDone = state === STEP_INDICATOR_STATE.DONE;

  return (
    <li
      className={item()}
      aria-current={state === STEP_INDICATOR_STATE.ACTIVE ? 'step' : undefined}
    >
      <StepIndicator
        state={state}
        stepNumber={stepNumber}
        hasConnector={false}
        isOnDark={true}
      />
      <span className={body()}>
        <span className={labelSlot()}>{label}</span>
        {isDone && summary && <span className={summarySlot()}>{summary}</span>}
      </span>
    </li>
  );
};
