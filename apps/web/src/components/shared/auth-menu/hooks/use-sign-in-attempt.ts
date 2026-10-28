'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import {
  FORM_STATUS,
  MAGIC_LINK_SIGN_IN_CODE,
  type TFormStatus,
  type TMaybeUndefined,
} from '@blog/config';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';

export const useSignInAttempt = (isOpen: boolean) => {
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [status, setStatus] = useState<TFormStatus>(FORM_STATUS.IDLE);
  const [email, setEmail] = useState('');
  const [isSendLimited, setIsSendLimited] = useState(false);
  const [pendingProviderId, setPendingProviderId] =
    useState<TMaybeUndefined<TOAuthProviderId>>();

  const resetEmail = () => {
    setStatus(FORM_STATUS.IDLE);
    setEmail('');
    setIsSendLimited(false);
  };

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) {
      resetEmail();
      setPendingProviderId(undefined);
    }
  }

  useEffect(() => {
    const clearPendingOnReturn = (event: PageTransitionEvent) => {
      if (event.persisted) setPendingProviderId(undefined);
    };

    window.addEventListener('pageshow', clearPendingOnReturn);
    return () => window.removeEventListener('pageshow', clearPendingOnReturn);
  }, []);

  const selectProvider = async (providerId: TOAuthProviderId) => {
    setPendingProviderId(providerId);
    try {
      await signIn(providerId);
    } catch {
      setPendingProviderId(undefined);
    }
  };

  const submitEmail = async () => {
    setStatus(FORM_STATUS.SUBMITTING);
    setIsSendLimited(false);

    const result = await signIn('email', { email, redirect: false });

    if (result.ok) {
      setStatus(FORM_STATUS.SUCCESS);
      return;
    }

    setStatus(FORM_STATUS.ERROR);
    setIsSendLimited(result.code === MAGIC_LINK_SIGN_IN_CODE.SEND_LIMITED);
  };

  return {
    status,
    email,
    setEmail,
    isSendLimited,
    submitEmail,
    resetEmail,
    pendingProviderId,
    selectProvider,
  };
};
