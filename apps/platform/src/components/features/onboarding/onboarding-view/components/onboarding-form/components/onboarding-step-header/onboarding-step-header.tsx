import { Heading } from '@platform/components/shared/heading';
import { SegmentedProgress } from '@platform/components/shared/segmented-progress';
import type { TOnboardingStep } from '@platform/constants/onboarding';
import { useTranslations } from 'next-intl';

import { onboardingStepHeaderVariants } from './onboarding-step-header-variants';

export type TOnboardingStepHeaderProps = {
  step: TOnboardingStep;
  stepNumber: number;
  stepTotal: number;
};

export const OnboardingStepHeader = ({
  step,
  stepNumber,
  stepTotal,
}: TOnboardingStepHeaderProps) => {
  const t = useTranslations('onboardingForm');

  return (
    <div className={onboardingStepHeaderVariants()}>
      <SegmentedProgress
        value={stepNumber}
        total={stepTotal}
        label={t('stepProgress', { n: stepNumber, total: stepTotal })}
      />
      <Heading level={1} size="pageTitle">
        {t(`steps.${step}`)}
      </Heading>
    </div>
  );
};
