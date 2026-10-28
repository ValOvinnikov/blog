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
  const [isEditingFromReview, setIsEditingFromReview] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const hasNavigatedRef = useRef(false);
  const stepIndex = ONBOARDING_STEPS.indexOf(step);
  const isAddressBlocked =
    step === ONBOARDING_STEP.ADDRESS &&
    (Boolean(fieldErrors.slug) ||
      addressStatus === SITE_ADDRESS_STATUS.CHECKING ||
      addressStatus === SITE_ADDRESS_STATUS.UNAVAILABLE);

  useEffect(() => {
    if (hasNavigatedRef.current) panelRef.current?.focus();
  }, [step]);

  const goTo = (next: TOnboardingStep) => {
    hasNavigatedRef.current = true;
    setStep(next);
    if (next === ONBOARDING_STEP.REVIEW) setIsEditingFromReview(false);
  };

  const editStep = (next: TOnboardingStep) => {
    setIsEditingFromReview(true);
    goTo(next);
  };

  const goNext = () => {
    const emptyField = findEmptyField(step, values);
    if (emptyField) {
      flagField(emptyField.field, emptyField.reason);
      return;
    }

    const hasFieldError = STEP_FIELDS[step].some((field) => fieldErrors[field]);
    if (hasFieldError || isAddressBlocked) return;

    const next = isEditingFromReview
      ? ONBOARDING_STEP.REVIEW
      : ONBOARDING_STEPS[stepIndex + 1];
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
    if (erroredStep && erroredStep !== step) editStep(erroredStep);
  };

  return {
    step,
    stepIndex,
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === ONBOARDING_STEPS.length - 1,
    isContinueDisabled: isAddressBlocked,
    panelRef,
    editStep,
    goNext,
    goBack,
    showFirstFieldError,
  };
};
