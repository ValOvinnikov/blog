import {
  OnboardingActions,
  type TOnboardingActionsProps,
} from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-actions';
import { OnboardingFailureAlert } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-failure-alert';
import type { TOnboardingFormFailure } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-onboarding-form';
import type { TMaybeUndefined } from '@shinefold/config';

import { onboardingFooterVariants } from './onboarding-footer-variants';

export type TOnboardingFooterProps = TOnboardingActionsProps & {
  failure: TMaybeUndefined<TOnboardingFormFailure>;
};

export const OnboardingFooter = ({
  failure,
  ...actionsProps
}: TOnboardingFooterProps) => {
  const { root, failure: failureSlot } = onboardingFooterVariants();

  return (
    <div className={root()}>
      {actionsProps.isLastStep && failure && (
        <OnboardingFailureAlert failure={failure} className={failureSlot()} />
      )}
      <OnboardingActions {...actionsProps} />
    </div>
  );
};
