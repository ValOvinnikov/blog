'use client';

import {
  isOutcomeInvalid,
  isOutcomeRefused,
  isOutcomeServerError,
  type TFieldErrors,
  type TMaybeNull,
} from '@blog/config';
import {
  createTenantAction,
  type TOwnerInviteConfirmation,
} from '@platform/server/tenants/create-tenant-action';
import type { TCreateTenantInput } from '@platform/server/tenants/create-tenant-input';
import type { TTenantDetailsFieldError } from '@platform/server/tenants/tenant-field-error';
import { settleAction } from '@platform/utils/settle-action/settle-action';
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
      const result = await settleAction(
        createTenantAction({
          ...values,
          confirmOwnerInviteToken: ownerInviteConfirmation?.token,
        }),
      );
      setFieldErrors(isOutcomeInvalid(result) ? result.fieldErrors : {});
      setIsCreateFailed(isOutcomeServerError(result));
      setOwnerInviteConfirmation(
        isOutcomeRefused(result)
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
