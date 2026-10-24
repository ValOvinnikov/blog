'use client';

import { ACTION_OUTCOME, type TMaybeUndefined } from '@blog/config';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import {
  sendSignInLinkAction,
  type TSendSignInLinkFieldError,
} from '@platform/server/auth/send-sign-in-link-action';
import { useState, useTransition } from 'react';

const FIELD_ERROR_KEYS = {
  [TENANT_FIELD_ERROR.EMAIL_INVALID]: 'emailInvalid',
} as const satisfies Record<TSendSignInLinkFieldError, string>;

export const useEmailSignIn = (callbackPath: string) => {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<TMaybeUndefined<string>>(undefined);
  const [fieldError, setFieldError] =
    useState<TMaybeUndefined<TSendSignInLinkFieldError>>(undefined);
  const [hasSendFailed, setHasSendFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await sendSignInLinkAction({ email, callbackPath });

      setFieldError(
        result.outcome === ACTION_OUTCOME.INVALID
          ? result.fieldErrors.email?.reason
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
    emailErrorKey: fieldError && FIELD_ERROR_KEYS[fieldError],
    hasSendFailed,
    isPending,
    submit,
  };
};
