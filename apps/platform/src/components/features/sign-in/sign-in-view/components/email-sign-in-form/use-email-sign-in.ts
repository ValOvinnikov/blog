'use client';

import {
  ACTION_OUTCOME,
  isOutcomeInvalid,
  isOutcomeServerError,
  isOutcomeSuccess,
  type TMaybeUndefined,
  type TReasonedFailure,
} from '@blog/config';
import {
  sendSignInLinkAction,
  type TSendSignInLinkFieldError,
  type TSendSignInLinkRefusal,
} from '@platform/server/auth/send-sign-in-link-action';
import { useState, useTransition } from 'react';

export const useEmailSignIn = (callbackPath: string) => {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<TMaybeUndefined<string>>(undefined);
  const [emailError, setEmailError] =
    useState<TMaybeUndefined<TReasonedFailure<TSendSignInLinkFieldError>>>(
      undefined,
    );
  const [sendRefusal, setSendRefusal] =
    useState<TMaybeUndefined<TSendSignInLinkRefusal>>(undefined);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await sendSignInLinkAction({ email, callbackPath });

      setEmailError(
        isOutcomeInvalid(result) ? result.fieldErrors.email : undefined,
      );
      setSendRefusal(
        result.outcome === ACTION_OUTCOME.RATE_LIMITED ||
          isOutcomeServerError(result)
          ? result.outcome
          : undefined,
      );

      if (isOutcomeSuccess(result)) {
        setSentTo(email.trim());
      }
    });
  };

  return {
    email,
    setEmail,
    sentTo,
    emailError,
    sendRefusal,
    isPending,
    submit,
  };
};
