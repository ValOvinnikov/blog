'use client';

import { Button } from '@platform/components/shared/button';
import { useTranslations } from 'next-intl';

import { onboardingActionsVariants } from './onboarding-actions-variants';

export type TOnboardingActionsProps = {
  isFirstStep: boolean;
  isLastStep: boolean;
  isPending: boolean;
  onBack: () => void;
  onContinue: () => void;
  className?: string;
};

export const OnboardingActions = ({
  isFirstStep,
  isLastStep,
  isPending,
  onBack,
  onContinue,
  className,
}: TOnboardingActionsProps) => {
  const t = useTranslations('onboardingForm');
  const { root, back } = onboardingActionsVariants();

  return (
    <div className={root({ class: className })}>
      {!isFirstStep && (
        <Button onClick={onBack} className={back()}>
          {t('back')}
        </Button>
      )}
      {isLastStep ? (
        <Button
          type="submit"
          variant="primary"
          isPending={isPending}
          pendingLabel={t('creating')}
        >
          {t('createSite')}
        </Button>
      ) : (
        <Button variant="primary" onClick={onContinue}>
          {t('continue')}
        </Button>
      )}
    </div>
  );
};
