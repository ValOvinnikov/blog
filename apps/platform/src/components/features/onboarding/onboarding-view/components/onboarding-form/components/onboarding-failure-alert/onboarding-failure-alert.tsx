import { ALERT_TYPE } from '@blog/config';
import { ONBOARDING_FAILURE_KEYS } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/onboarding-error-keys';
import type { TOnboardingFormFailure } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-onboarding-form';
import { Alert } from '@platform/components/shared/alert';
import { useTranslations } from 'next-intl';

export type TOnboardingFailureAlertProps = {
  failure: TOnboardingFormFailure;
};

export const OnboardingFailureAlert = ({
  failure,
}: TOnboardingFailureAlertProps) => {
  const t = useTranslations('onboardingForm');

  return (
    <Alert
      type={ALERT_TYPE.ERROR}
      title={t('failureTitle')}
      description={t(`failures.${ONBOARDING_FAILURE_KEYS[failure]}`)}
    />
  );
};
