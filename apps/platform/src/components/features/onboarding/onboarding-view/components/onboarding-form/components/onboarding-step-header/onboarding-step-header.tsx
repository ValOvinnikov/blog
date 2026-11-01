import { Heading } from '@platform/components/shared/heading';
import { Text } from '@platform/components/shared/text';
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
  const { root, progress, title } = onboardingStepHeaderVariants();

  return (
    <div className={root()}>
      <Text variant="meta" className={progress()}>
        {t('stepProgress', { n: stepNumber, total: stepTotal })}
      </Text>
      <Heading level={1} size="pageTitle" className={title()}>
        {t(`steps.${step}`)}
      </Heading>
    </div>
  );
};
