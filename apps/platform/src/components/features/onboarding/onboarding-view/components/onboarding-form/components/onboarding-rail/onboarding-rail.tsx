import type { TMaybeUndefined } from '@blog/config';
import { RailBrand } from '@platform/components/features/layout/rail-brand';
import { RailIntro } from '@platform/components/features/layout/rail-intro';
import { SignedInAccount } from '@platform/components/features/layout/signed-in-account';
import { SegmentedProgress } from '@platform/components/shared/segmented-progress';
import type { TOnboardingStep } from '@platform/constants/onboarding';
import { toStepProgressState } from '@platform/utils/step-progress-state/step-progress-state';
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
      <RailBrand isWizard={true} className={brand()} />
      <RailIntro
        title={t('heading')}
        description={t('description')}
        isWizard={true}
        className={intro()}
      />
      {currentStep && (
        <SegmentedProgress
          value={currentIndex + 1}
          total={steps.length}
          ariaLabel={tForm('stepsAriaLabel')}
          valueText={tForm('stepProgressNamed', {
            n: currentIndex + 1,
            total: steps.length,
            step: currentStep.label,
          })}
          isOnDark={true}
          className={progress()}
        />
      )}
      <ol aria-label={tForm('stepsAriaLabel')} className={list()}>
        {steps.map((step, index) => (
          <OnboardingRailStep
            key={step.id}
            stepNumber={index + 1}
            label={step.label}
            summary={step.summary}
            state={toStepProgressState(index, currentIndex)}
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
