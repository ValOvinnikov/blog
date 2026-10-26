'use client';

import {
  ACTION_OUTCOME,
  PRESET_ID,
  PRESET_REGISTRY,
  SITE_TYPE,
  type TFieldErrors,
  type TLocaleIsoCode,
  type TMaybeUndefined,
  type TPresetId,
} from '@blog/config';
import { createSiteAction } from '@platform/server/onboarding/create-site-action';
import type {
  TCreateSiteFieldError,
  TCreateSiteInput,
  TCreateSiteRefusal,
  TCreateSiteResult,
} from '@platform/server/onboarding/create-site-input';
import { useState, useTransition } from 'react';

export type TOnboardingFormFailure =
  TCreateSiteRefusal | typeof ACTION_OUTCOME.SERVER_ERROR;

const toFailure = (
  result: TCreateSiteResult,
): TMaybeUndefined<TOnboardingFormFailure> => {
  if (result.outcome === ACTION_OUTCOME.REFUSED) return result.reason;
  if (result.outcome === ACTION_OUTCOME.SERVER_ERROR) return result.outcome;
  return undefined;
};

export const useOnboardingForm = (initialLocale: TLocaleIsoCode) => {
  const [values, setValues] = useState<TCreateSiteInput>({
    siteType: SITE_TYPE.BLOG,
    name: '',
    slug: '',
    locale: initialLocale,
    preset: PRESET_ID.CONSOLE,
    accentHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
    hasAcceptedTerms: false,
  });
  const [fieldErrors, setFieldErrors] = useState<
    TFieldErrors<keyof TCreateSiteInput, TCreateSiteFieldError>
  >({});
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

  const changePreset = (preset: TPresetId) =>
    changeField({
      preset,
      accentHue: PRESET_REGISTRY[preset].themeTokens.accentHue,
    });

  const submit = () => {
    startTransition(async () => {
      const result = await createSiteAction(values);

      setFieldErrors(
        result.outcome === ACTION_OUTCOME.INVALID ? result.fieldErrors : {},
      );
      setFailure(toFailure(result));
    });
  };

  return {
    values,
    fieldErrors,
    failure,
    isPending,
    changeField,
    changePreset,
    submit,
  };
};
