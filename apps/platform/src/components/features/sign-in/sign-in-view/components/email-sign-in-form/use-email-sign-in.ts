'use client';

import {
  ACTION_OUTCOME,
  type TMaybeUndefined,
  type TReasonedFailure,
} from '@blog/config';
import {
  sendSignInLinkAction,
  type TSendSignInLinkFieldError,
} from '@platform/server/auth/send-sign-in-link-action';
import { useState, useTransition } from 'react';

export const useEmailSignIn = (callbackPath: string) => {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<TMaybeUndefined<string>>(undefined);
  const [emailError, setEmailError] =
    useState<TMaybeUndefined<TReasonedFailure<TSendSignInLinkFieldError>>>(
      undefined,
    );
  const [hasSendFailed, setHasSendFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await sendSignInLinkAction({ email, callbackPath });

      setEmailError(
        result.outcome === ACTION_OUTCOME.INVALID
          ? result.fieldErrors.email
          : undefined,
      );
      setHasSendFailed(result.outcome === ACTION_OUTCOME.SERVER_ERROR);

      if (result.outcome === ACTION_OUTCOME.SUCCESS) {
        setSentTo(email.trim());
      }
    });
  };

  return {
    email,
    setEmail,
    sentTo,
    emailError,
    hasSendFailed,
    isPending,
    submit,
  };
};
