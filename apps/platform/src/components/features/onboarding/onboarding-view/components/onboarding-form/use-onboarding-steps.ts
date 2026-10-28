'use client';

import type { TMaybeUndefined } from '@blog/config';
import {
  ONBOARDING_STEP,
  SITE_ADDRESS_STATUS,
  type TOnboardingStep,
  type TSiteAddressStatus,
} from '@platform/constants/onboarding';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import type {
  TCreateSiteFieldError,
  TCreateSiteInput,
} from '@platform/server/onboarding/create-site-input';
import { useEffect, useRef, useState } from 'react';

import type { TOnboardingFieldErrors } from './use-onboarding-form';

type TOnboardingField = keyof TCreateSiteInput;

type TStepFieldError = {
  field: TOnboardingField;
  reason: TCreateSiteFieldError;
};

export const ONBOARDING_STEPS = Object.values(ONBOARDING_STEP);

const STEP_FIELDS: Record<TOnboardingStep, TOnboardingField[]> = {
  [ONBOARDING_STEP.SITE]: ['siteType', 'name'],
  [ONBOARDING_STEP.ADDRESS]: ['slug', 'locale'],
  [ONBOARDING_STEP.LOOK]: ['preset', 'accentHue'],
  [ONBOARDING_STEP.REVIEW]: ['hasAcceptedTerms'],
};

const findEmptyField = (
  step: TOnboardingStep,
  { name, slug }: TCreateSiteInput,
): TMaybeUndefined<TStepFieldError> => {
  if (step === ONBOARDING_STEP.SITE && !name.trim()) {
    return { field: 'name', reason: TENANT_FIELD_ERROR.NAME_REQUIRED };
  }
  if (step === ONBOARDING_STEP.ADDRESS && !slug) {
    return { field: 'slug', reason: TENANT_FIELD_ERROR.SLUG_INVALID };
  }
  return undefined;
};

type TUseOnboardingStepsOptions = {
  values: TCreateSiteInput;
  fieldErrors: TOnboardingFieldErrors;
  addressStatus: TSiteAddressStatus;
  flagField: (field: TOnboardingField, reason: TCreateSiteFieldError) => void;
};

export const useOnboardingSteps = ({
  values,
  fieldErrors,
  addressStatus,
  flagField,
}: TUseOnboardingStepsOptions) => {
  const [step, setStep] = useState<TOnboardingStep>(ONBOARDING_STEP.SITE);
  const panelRef = useRef<HTMLDivElement>(null);
  const hasNavigatedRef = useRef(false);
  const stepIndex = ONBOARDING_STEPS.indexOf(step);

  useEffect(() => {
    if (hasNavigatedRef.current) panelRef.current?.focus();
  }, [step]);

  const goTo = (next: TOnboardingStep) => {
    hasNavigatedRef.current = true;
    setStep(next);
  };

  const goNext = () => {
    const emptyField = findEmptyField(step, values);
    if (emptyField) {
      flagField(emptyField.field, emptyField.reason);
      return;
    }

    const hasFieldError = STEP_FIELDS[step].some((field) => fieldErrors[field]);
    const isAddressPending =
      step === ONBOARDING_STEP.ADDRESS &&
      addressStatus !== SITE_ADDRESS_STATUS.AVAILABLE;
    if (hasFieldError || isAddressPending) return;

    const next = ONBOARDING_STEPS[stepIndex + 1];
    if (next) goTo(next);
  };

  const goBack = () => {
    const previous = ONBOARDING_STEPS[stepIndex - 1];
    if (previous) goTo(previous);
  };

  const showFirstFieldError = (errors: TOnboardingFieldErrors) => {
    const erroredStep = ONBOARDING_STEPS.find((candidate) =>
      STEP_FIELDS[candidate].some((field) => errors[field]),
    );
    if (erroredStep && erroredStep !== step) goTo(erroredStep);
  };

  return {
    step,
    stepIndex,
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === ONBOARDING_STEPS.length - 1,
    panelRef,
    goTo,
    goNext,
    goBack,
    showFirstFieldError,
  };
};
