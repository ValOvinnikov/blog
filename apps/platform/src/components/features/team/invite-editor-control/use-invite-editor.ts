'use client';

import type { TTeamInviteFieldError } from '@platform/constants/team-access';
import { useToast } from '@platform/context/toast-provider';
import { inviteTeamMemberAction } from '@platform/server/team/invite-team-member-action';
import { teamInviteInputSchema } from '@platform/server/team/team-input';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import {
  isOutcomeInvalid,
  isOutcomeSuccess,
  type TMaybeUndefined,
} from '@shinefold/config';
import type { TReasonedFailure } from '@shinefold/config/types';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition } from 'react';

export const useInviteEditor = (tenantId: string) => {
  const t = useTranslations('teamPage.inviteDialog');
  const toast = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] =
    useState<TMaybeUndefined<TReasonedFailure<TTeamInviteFieldError>>>();
  const [hasFailed, setHasFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const emailRef = useRef<HTMLInputElement>(null);

  const changeOpen = (nextIsOpen: boolean) => {
    setIsOpen(nextIsOpen);
    setEmail('');
    setFieldError(undefined);
    setHasFailed(false);
  };

  const changeEmail = (value: string) => {
    setEmail(value);
    setFieldError(undefined);
  };

  const submit = () => {
    setHasFailed(false);
    startTransition(async () => {
      const result = await settleAction(
        inviteTeamMemberAction(tenantId, { email }),
      );
      if (isOutcomeSuccess(result)) {
        const sentTo = teamInviteInputSchema.parse({ email }).email;
        changeOpen(false);
        toast.success({ message: t('sent', { email: sentTo }) });
        router.refresh();
        return;
      }
      if (isOutcomeInvalid(result)) {
        setFieldError(result.fieldErrors.email);
        emailRef.current?.focus();
        return;
      }
      setHasFailed(true);
    });
  };

  return {
    isOpen,
    changeOpen,
    email,
    emailRef,
    changeEmail,
    fieldError,
    hasFailed,
    isPending,
    submit,
  };
};
