'use client';

import {
  INVITABLE_ADMIN_ROLE,
  type TAdminInviteFieldError,
  type TInvitableAdminRole,
} from '@platform/constants/platform-admins';
import { useToast } from '@platform/context/toast-provider';
import { inviteAdminAction } from '@platform/server/platform-admins/invite-admin-action';
import { inviteEmailSchema } from '@platform/utils/invite-email-schema/invite-email-schema';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { isOutcomeInvalid, isOutcomeSuccess } from '@shinefold/config';
import type { TFieldErrors } from '@shinefold/config/types';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type TInviteAdminFieldErrors = TFieldErrors<
  'email' | 'role',
  TAdminInviteFieldError
>;

export const useInviteAdmin = (sent: (email: string) => string) => {
  const toast = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TInvitableAdminRole>(
    INVITABLE_ADMIN_ROLE.ADMIN,
  );
  const [fieldErrors, setFieldErrors] = useState<TInviteAdminFieldErrors>({});
  const [hasFailed, setHasFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const changeEmail = (value: string) => {
    setEmail(value);
    setFieldErrors({});
  };

  const changeRole = (value: TInvitableAdminRole) => {
    setRole(value);
    setFieldErrors({});
  };

  const submit = () => {
    setHasFailed(false);
    startTransition(async () => {
      const result = await settleAction(inviteAdminAction({ email, role }));
      if (isOutcomeSuccess(result)) {
        setEmail('');
        setFieldErrors({});
        toast.success({ message: sent(inviteEmailSchema.parse(email)) });
        router.refresh();
        return;
      }
      if (isOutcomeInvalid(result)) {
        setFieldErrors(result.fieldErrors);
        return;
      }
      setFieldErrors({});
      setHasFailed(true);
    });
  };

  return {
    email,
    changeEmail,
    role,
    changeRole,
    emailError: fieldErrors.email,
    roleError: fieldErrors.role,
    hasFailed,
    isPending,
    submit,
  };
};
