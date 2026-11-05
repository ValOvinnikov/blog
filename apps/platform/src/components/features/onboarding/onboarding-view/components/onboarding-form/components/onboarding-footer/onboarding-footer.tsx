import type { TMaybeUndefined } from '@blog/config';
import {
  AddressVerdict,
  type TAddressVerdict,
} from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/address-verdict';
import {
  OnboardingActions,
  type TOnboardingActionsProps,
} from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-actions';
import { OnboardingFailureAlert } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-failure-alert';
import type { TOnboardingFormFailure } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-onboarding-form';
import {
  ONBOARDING_STEP,
  type TOnboardingStep,
} from '@platform/constants/onboarding';

import { onboardingFooterVariants } from './onboarding-footer-variants';

export type TOnboardingFooterProps = Omit<
  TOnboardingActionsProps,
  'children'
> & {
  step: TOnboardingStep;
  addressVerdict: TAddressVerdict;
  failure: TMaybeUndefined<TOnboardingFormFailure>;
};

export const OnboardingFooter = ({
  step,
  addressVerdict,
  failure,
  ...actionsProps
}: TOnboardingFooterProps) => {
  const { root, failure: failureSlot } = onboardingFooterVariants();

  return (
    <div className={root()}>
      {actionsProps.isLastStep && failure && (
        <OnboardingFailureAlert failure={failure} className={failureSlot()} />
      )}
      <OnboardingActions {...actionsProps}>
        {step === ONBOARDING_STEP.ADDRESS && (
          <AddressVerdict verdict={addressVerdict} />
        )}
      </OnboardingActions>
    </div>
  );
};
