'use client';

import { MAGIC_LINK_SIGN_IN_CODE } from '@blog/config';
import { signIn } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

export type TEmailStep = 'collapsed' | 'expanded' | 'submitting' | 'sent';

export const useEmailSignIn = (open: boolean) => {
  const [emailStep, setEmailStep] = useState<TEmailStep>('collapsed');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [isSendLimited, setIsSendLimited] = useState(false);
  const emailFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the email sub-form only once the popover itself closes (matches ThemeToggleButton's DOM-driven state pattern), not derivable during render
    setEmailStep('collapsed');
    setEmail('');
    setEmailError(false);
    setIsSendLimited(false);
  }, [open]);

  useEffect(() => {
    if (emailStep !== 'expanded') return;

    emailFormRef.current?.querySelector('input')?.focus();
  }, [emailStep]);

  // `Button` always renders `type="button"`, so the send button's click and the form's submit share this handler.
  const handleEmailSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setEmailStep('submitting');
    setEmailError(false);
    setIsSendLimited(false);

    const result = await signIn('email', { email, redirect: false });

    if (result.ok) {
      setEmailStep('sent');
    } else {
      setEmailStep('expanded');
      setEmailError(true);
      setIsSendLimited(result.code === MAGIC_LINK_SIGN_IN_CODE.SEND_LIMITED);
    }
  };

  return {
    emailStep,
    setEmailStep,
    email,
    setEmail,
    emailError,
    isSendLimited,
    emailFormRef,
    handleEmailSubmit,
  };
};
