'use client';

import { Button } from '@platform/components/shared/button';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { onboardingActionsVariants } from './onboarding-actions-variants';

export type TOnboardingActionsProps = {
  isFirstStep: boolean;
  isLastStep: boolean;
  isPending: boolean;
  isContinueDisabled: boolean;
  onBack: () => void;
  onContinue: () => void;
  children?: ReactNode;
};

export const OnboardingActions = ({
  isFirstStep,
  isLastStep,
  isPending,
  isContinueDisabled,
  onBack,
  onContinue,
  children,
}: TOnboardingActionsProps) => {
  const t = useTranslations('onboardingForm');
  const { root, back, status } = onboardingActionsVariants();

  return (
    <div className={root()}>
      {!isFirstStep && (
        <Button onClick={onBack} className={back()}>
          {t('back')}
        </Button>
      )}
      {children && <div className={status()}>{children}</div>}
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
        <Button
          variant="primary"
          isDisabled={isContinueDisabled}
          onClick={onContinue}
        >
          {t('continue')}
        </Button>
      )}
    </div>
  );
};
