'use client';

import type { TLocaleIsoCode, TMaybeUndefined } from '@blog/config';
import { PRESET_LABEL_KEY } from '@platform/components/shared/preset-picker';
import { ONBOARDING_STEP } from '@platform/constants/onboarding';
import { useTranslations } from 'next-intl';
import { useId, type FormEvent } from 'react';

import type { TAddressVerdict } from './components/address-verdict';
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
  const toAddress = (slug: string) =>
    rootDomain ? `${slug}.${rootDomain}` : slug;
  const siteAddress = toAddress(values.slug);
  const previewAddress = toAddress(
    values.slug || t('previewAddressPlaceholder'),
  );
  const addressMessageId = useId();
  const addressVerdict: TAddressVerdict = {
    messageId: addressMessageId,
    siteAddress,
    status: addressCheck.status,
    error: fieldErrors.slug?.reason ?? addressCheck.error,
  };

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
    addressVerdict,
    addressErrorId: addressVerdict.error ? addressMessageId : undefined,
    siteAddress,
    previewAddress,
    railSteps,
    handleSubmit,
  };
};
