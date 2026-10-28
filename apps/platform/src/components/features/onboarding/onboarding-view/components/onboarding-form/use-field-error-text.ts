'use client';

import type { TCreateSiteFieldError } from '@platform/server/onboarding/create-site-input';
import { useTranslations } from 'next-intl';

import { ONBOARDING_FIELD_ERROR_KEYS } from './onboarding-error-keys';

export const useFieldErrorText = () => {
  const t = useTranslations('onboardingForm');

  return (reason: TCreateSiteFieldError) =>
    t(`fieldErrors.${ONBOARDING_FIELD_ERROR_KEYS[reason]}`);
};
