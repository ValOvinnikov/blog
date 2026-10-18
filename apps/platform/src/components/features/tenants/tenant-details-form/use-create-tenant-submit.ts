'use client';

import {
  ACTION_OUTCOME,
  type TFieldErrors,
  type TMaybeNull,
} from '@blog/config';
import {
  createTenantAction,
  type TCreateTenantInput,
  type TOwnerInviteConfirmation,
} from '@platform/server/tenants/create-tenant-action';
import type { TTenantDetailsFieldError } from '@platform/server/tenants/tenant-field-error';
import { useState, useTransition } from 'react';

type TCreateTenantValues = Omit<TCreateTenantInput, 'confirmOwnerInviteToken'>;

export const useCreateTenantSubmit = () => {
  const [fieldErrors, setFieldErrors] = useState<
    TFieldErrors<keyof TCreateTenantInput, TTenantDetailsFieldError>
  >({});
  const [isCreateFailed, setIsCreateFailed] = useState(false);
  const [ownerInviteConfirmation, setOwnerInviteConfirmation] =
    useState<TMaybeNull<TOwnerInviteConfirmation>>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (values: TCreateTenantValues) => {
    setIsCreateFailed(false);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createTenantAction({
        ...values,
        confirmOwnerInviteToken: ownerInviteConfirmation?.token,
      });
      setFieldErrors(
        result.outcome === ACTION_OUTCOME.INVALID ? result.fieldErrors : {},
      );
      setIsCreateFailed(result.outcome === ACTION_OUTCOME.SERVER_ERROR);
      setOwnerInviteConfirmation(
        result.outcome === ACTION_OUTCOME.REFUSED
          ? { email: result.email, token: result.token }
          : null,
      );
    });
  };

  return {
    fieldErrors,
    isCreateFailed,
    ownerInviteConfirmation,
    clearOwnerInviteConfirmation: () => setOwnerInviteConfirmation(null),
    isPending,
    submit,
  };
};
