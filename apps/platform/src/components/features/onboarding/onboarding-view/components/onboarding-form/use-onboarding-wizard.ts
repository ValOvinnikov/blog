'use client';

import type { TLocaleIsoCode, TMaybeUndefined } from '@blog/config';
import { PRESET_LABEL_KEY } from '@platform/components/shared/preset-picker';
import { ONBOARDING_STEP } from '@platform/constants/onboarding';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

import type { TOnboardingRailStep } from './components/onboarding-rail';
import { useOnboardingForm } from './use-onboarding-form';
import { ONBOARDING_STEPS, useOnboardingSteps } from './use-onboarding-steps';
import { useSiteAddressCheck } from './use-site-address-check';

export const useOnboardingWizard = (
  initialLocale: TLocaleIsoCode,
  rootDomain: TMaybeUndefined<string>,
) => {
  const t = useTranslations('onboardingForm');
  const tPreset = useTranslations('presetPicker');
  const form = useOnboardingForm(initialLocale);
  const { values, fieldErrors, flagField, submit } = form;
  const addressCheck = useSiteAddressCheck(values.slug);
  const steps = useOnboardingSteps({
    values,
    fieldErrors,
    addressStatus: addressCheck.status,
    flagField,
  });
  const siteAddress = rootDomain ? `${values.slug}.${rootDomain}` : values.slug;
  const addressError = fieldErrors.slug?.reason ?? addressCheck.error;

  const summaries = {
    [ONBOARDING_STEP.SITE]: t('siteSummary', {
      siteType: t(`siteTypes.${values.siteType}`),
      name: values.name,
    }),
    [ONBOARDING_STEP.ADDRESS]: siteAddress,
    [ONBOARDING_STEP.LOOK]: tPreset(PRESET_LABEL_KEY[values.preset]),
    [ONBOARDING_STEP.REVIEW]: undefined,
  };

  const railSteps: TOnboardingRailStep[] = ONBOARDING_STEPS.map((id) => ({
    id,
    label: t(`steps.${id}`),
    summary: summaries[id],
  }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (steps.isLastStep) submit(steps.showFirstFieldError);
    else steps.goNext();
  };

  return {
    ...form,
    ...steps,
    addressStatus: addressCheck.status,
    addressError,
    siteAddress,
    railSteps,
    handleSubmit,
  };
};
