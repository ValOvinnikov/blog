'use client';

import {
  type ACTION_OUTCOME,
  isOutcomeInvalid,
  isOutcomeRefused,
  isOutcomeServerError,
  PRESET_REGISTRY,
  SITE_TYPE,
  STARTER_PRESET_BY_SITE_TYPE,
  type TFieldErrors,
  type TLocaleIsoCode,
  type TMaybeUndefined,
  type TPresetId,
} from '@blog/config';
import type { TSelfServeSiteType } from '@platform/constants/onboarding';
import { createSiteAction } from '@platform/server/onboarding/create-site-action';
import type {
  TCreateSiteFieldError,
  TCreateSiteInput,
  TCreateSiteRefusal,
  TCreateSiteResult,
} from '@platform/server/onboarding/create-site-input';
import { useState, useTransition } from 'react';

export type TOnboardingFieldErrors = TFieldErrors<
  keyof TCreateSiteInput,
  TCreateSiteFieldError
>;

export type TOnboardingFormFailure =
  TCreateSiteRefusal | typeof ACTION_OUTCOME.SERVER_ERROR;

const toFailure = (
  result: TCreateSiteResult,
): TMaybeUndefined<TOnboardingFormFailure> => {
  if (isOutcomeRefused(result)) return result.reason;
  if (isOutcomeServerError(result)) return result.outcome;
  return undefined;
};

const toLook = (preset: TPresetId) => ({
  preset,
  accentHue: PRESET_REGISTRY[preset].themeTokens.accentHue,
});

const toStarterLook = (siteType: TSelfServeSiteType) =>
  toLook(STARTER_PRESET_BY_SITE_TYPE[siteType]);

const toInitialValues = (
  siteType: TSelfServeSiteType,
  locale: TLocaleIsoCode,
): TCreateSiteInput => ({
  siteType,
  name: '',
  slug: '',
  locale,
  ...toStarterLook(siteType),
  hasAcceptedTerms: false,
});

export const useOnboardingForm = (initialLocale: TLocaleIsoCode) => {
  const [values, setValues] = useState<TCreateSiteInput>(() =>
    toInitialValues(SITE_TYPE.BLOG, initialLocale),
  );
  const [hasChosenLook, setHasChosenLook] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<TOnboardingFieldErrors>({});
  const [failure, setFailure] =
    useState<TMaybeUndefined<TOnboardingFormFailure>>(undefined);
  const [isPending, startTransition] = useTransition();

  const changeField = (patch: Partial<TCreateSiteInput>) => {
    setValues((current) => ({ ...current, ...patch }));
    setFieldErrors((current) => {
      const next = { ...current };
      for (const field of Object.keys(patch)) {
        delete next[field as keyof TCreateSiteInput];
      }
      return next;
    });
  };

  const changeSiteType = (siteType: TSelfServeSiteType) =>
    changeField(
      hasChosenLook ? { siteType } : { siteType, ...toStarterLook(siteType) },
    );

  const changePreset = (preset: TPresetId) => {
    setHasChosenLook(true);
    changeField(toLook(preset));
  };

  const changeAccentHue = (accentHue: number) => {
    setHasChosenLook(true);
    changeField({ accentHue });
  };

  const flagField = (
    field: keyof TCreateSiteInput,
    reason: TCreateSiteFieldError,
  ) => setFieldErrors((current) => ({ ...current, [field]: { reason } }));

  const submit = (onFieldErrors: (errors: TOnboardingFieldErrors) => void) => {
    startTransition(async () => {
      const result = await createSiteAction(values);
      const nextFieldErrors = isOutcomeInvalid(result)
        ? result.fieldErrors
        : {};

      setFieldErrors(nextFieldErrors);
      setFailure(toFailure(result));
      onFieldErrors(nextFieldErrors);
    });
  };

  return {
    values,
    fieldErrors,
    failure,
    isPending,
    changeField,
    changeSiteType,
    changePreset,
    changeAccentHue,
    flagField,
    submit,
  };
};
