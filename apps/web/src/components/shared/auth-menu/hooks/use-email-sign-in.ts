'use client';

import {
  FORM_STATUS,
  MAGIC_LINK_SIGN_IN_CODE,
  type TFormStatus,
} from '@blog/config';
import { signIn } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

export const useEmailSignIn = (open: boolean) => {
  const [isEmailFormOpen, setIsEmailFormOpen] = useState(false);
  const [status, setStatus] = useState<TFormStatus>(FORM_STATUS.IDLE);
  const [email, setEmail] = useState('');
  const [isSendLimited, setIsSendLimited] = useState(false);
  const emailFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the email sub-form only once the popover itself closes (matches ThemeToggleButton's DOM-driven state pattern), not derivable during render
    setIsEmailFormOpen(false);
    setStatus(FORM_STATUS.IDLE);
    setEmail('');
    setIsSendLimited(false);
  }, [open]);

  useEffect(() => {
    if (
      !isEmailFormOpen ||
      status === FORM_STATUS.SUBMITTING ||
      status === FORM_STATUS.SUCCESS
    ) {
      return;
    }

    emailFormRef.current?.querySelector('input')?.focus();
  }, [isEmailFormOpen, status]);

  const openEmailForm = () => setIsEmailFormOpen(true);

  // `Button` always renders `type="button"`, so the send button's click and the form's submit share this handler.
  const handleEmailSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setStatus(FORM_STATUS.SUBMITTING);
    setIsSendLimited(false);

    const result = await signIn('email', { email, redirect: false });

    if (result.ok) {
      setStatus(FORM_STATUS.SUCCESS);
    } else {
      setStatus(FORM_STATUS.ERROR);
      setIsSendLimited(result.code === MAGIC_LINK_SIGN_IN_CODE.SEND_LIMITED);
    }
  };

  return {
    isEmailFormOpen,
    openEmailForm,
    status,
    email,
    setEmail,
    isSendLimited,
    emailFormRef,
    handleEmailSubmit,
  };
};
