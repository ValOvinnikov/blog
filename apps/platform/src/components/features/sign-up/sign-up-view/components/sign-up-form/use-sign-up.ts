'use client';

import { ACTION_OUTCOME, type TMaybeUndefined } from '@blog/config';
import type { SIGN_UP_FIELD_ERROR } from '@platform/constants/sign-up';
import { acceptSignupTermsAction } from '@platform/server/auth/accept-signup-terms-action';
import { useState, useTransition } from 'react';

type TSignUpFieldError = typeof SIGN_UP_FIELD_ERROR.TERMS_NOT_ACCEPTED;

export const useSignUp = () => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [termsError, setTermsError] =
    useState<TMaybeUndefined<TSignUpFieldError>>(undefined);
  const [isRefused, setIsRefused] = useState(false);
  const [isPending, startTransition] = useTransition();

  const changeAcceptance = (isAccepted: boolean) => {
    setHasAcceptedTerms(isAccepted);
    if (isAccepted) setTermsError(undefined);
  };

  const submit = () => {
    startTransition(async () => {
      const result = await acceptSignupTermsAction({ hasAcceptedTerms });

      setTermsError(
        result.outcome === ACTION_OUTCOME.INVALID
          ? result.fieldErrors.hasAcceptedTerms?.reason
          : undefined,
      );
      setIsRefused(result.outcome === ACTION_OUTCOME.REFUSED);
    });
  };

  return {
    hasAcceptedTerms,
    changeAcceptance,
    termsError,
    isRefused,
    isPending,
    submit,
  };
};
