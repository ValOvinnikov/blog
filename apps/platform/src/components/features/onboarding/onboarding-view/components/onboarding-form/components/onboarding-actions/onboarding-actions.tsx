'use client';

import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { SIZE } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { onboardingActionsVariants } from './onboarding-actions-variants';

export type TOnboardingActionsProps = {
  isFirstStep: boolean;
  isLastStep: boolean;
  isPending: boolean;
  isContinueDisabled: boolean;
  onBack: () => void;
  onContinue: () => void;
};

export const OnboardingActions = ({
  isFirstStep,
  isLastStep,
  isPending,
  isContinueDisabled,
  onBack,
  onContinue,
}: TOnboardingActionsProps) => {
  const t = useTranslations('onboardingForm');
  const { root, back, primary } = onboardingActionsVariants();

  return (
    <div className={root()}>
      {!isFirstStep && (
        <Button size={SIZE.XL} onClick={onBack} className={back()}>
          {t('back')}
        </Button>
      )}
      {isLastStep ? (
        <Button
          key="create-site"
          type="submit"
          variant={BUTTON_VARIANT.PRIMARY}
          size={SIZE.XL}
          className={primary()}
          isPending={isPending}
          pendingLabel={t('creating')}
        >
          {t('createSite')}
        </Button>
      ) : (
        <Button
          key="continue"
          variant={BUTTON_VARIANT.PRIMARY}
          size={SIZE.XL}
          className={primary()}
          isAriaDisabled={isContinueDisabled}
          onClick={onContinue}
        >
          {t('continue')}
        </Button>
      )}
    </div>
  );
};
