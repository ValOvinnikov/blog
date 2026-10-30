import type { TMaybeUndefined } from '@blog/config';
import { RailBrand } from '@platform/components/features/layout/rail-brand';
import { RailIntro } from '@platform/components/features/layout/rail-intro';
import { SignedInAccount } from '@platform/components/features/layout/signed-in-account';
import type { TOnboardingStep } from '@platform/constants/onboarding';
import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';
import { useTranslations } from 'next-intl';

import { OnboardingRailStep } from './components/onboarding-rail-step/onboarding-rail-step';
import { onboardingRailVariants } from './onboarding-rail-variants';

export type TOnboardingRailStep = {
  id: TOnboardingStep;
  label: string;
  summary: TMaybeUndefined<string>;
};

export type TOnboardingRailProps = {
  steps: TOnboardingRailStep[];
  currentIndex: number;
  accountEmail: TMaybeUndefined<string>;
};

const toIndicatorState = (index: number, currentIndex: number) => {
  if (index < currentIndex) return STEP_INDICATOR_STATE.DONE;
  if (index === currentIndex) return STEP_INDICATOR_STATE.ACTIVE;
  return STEP_INDICATOR_STATE.UPCOMING;
};

export const OnboardingRail = ({
  steps,
  currentIndex,
  accountEmail,
}: TOnboardingRailProps) => {
  const t = useTranslations('onboardingPage');
  const tForm = useTranslations('onboardingForm');
  const { root, brand, intro, progress, list, account } =
    onboardingRailVariants();
  const currentStep = steps[currentIndex];

  return (
    <header className={root()}>
      <RailBrand className={brand()} />
      <RailIntro
        title={t('heading')}
        description={t('description')}
        className={intro()}
      />
      {currentStep && (
        <p className={progress()}>
          {tForm('stepProgressNamed', {
            n: currentIndex + 1,
            total: steps.length,
            step: currentStep.label,
          })}
        </p>
      )}
      <ol aria-label={tForm('stepsAriaLabel')} className={list()}>
        {steps.map((step, index) => (
          <OnboardingRailStep
            key={step.id}
            stepNumber={index + 1}
            label={step.label}
            summary={step.summary}
            state={toIndicatorState(index, currentIndex)}
          />
        ))}
      </ol>
      {accountEmail && (
        <div className={account()}>
          <SignedInAccount email={accountEmail} surface="rail" />
        </div>
      )}
    </header>
  );
};
