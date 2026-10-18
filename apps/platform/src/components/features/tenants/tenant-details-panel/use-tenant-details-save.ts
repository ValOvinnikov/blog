'use client';

import {
  ACTION_OUTCOME,
  type TFieldErrors,
  type TMaybeUndefined,
} from '@blog/config';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { useToast } from '@platform/context/toast-provider';
import type { TTenantDetailsFieldError } from '@platform/server/tenants/tenant-field-error';
import {
  updateTenantDetailsAction,
  type TUpdateTenantDetailsRefusal,
} from '@platform/server/tenants/update-tenant-details-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { TTenantDetailsValues } from './tenant-details-values';

const REFUSAL_KEYS = {
  [TENANT_REFUSAL.NOT_FOUND]: 'notFound',
  [TENANT_REFUSAL.ARCHIVED]: 'archived',
  [TENANT_REFUSAL.LOCALE_IS_ADDITIONAL]: 'localeIsAdditional',
  [TENANT_REFUSAL.PROVISIONING_STARTED]: 'provisioningStarted',
  [TENANT_REFUSAL.OWNER_ALREADY_JOINED]: 'ownerAlreadyJoined',
} as const satisfies Record<TUpdateTenantDetailsRefusal, string>;

type TFormErrorKey =
  (typeof REFUSAL_KEYS)[TUpdateTenantDetailsRefusal] | 'saveFailed';

export const useTenantDetailsSave = (
  tenantId: string,
  values: TTenantDetailsValues,
) => {
  const t = useTranslations('tenantDetailsPanel');
  const toast = useToast();
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<
    TFieldErrors<keyof TTenantDetailsValues, TTenantDetailsFieldError>
  >({});
  const [formError, setFormError] =
    useState<TMaybeUndefined<TFormErrorKey>>(undefined);

  const clearErrors = () => {
    setFieldErrors({});
    setFormError(undefined);
  };

  const save = async (): Promise<boolean> => {
    clearErrors();

    const result = await updateTenantDetailsAction(tenantId, values);
    switch (result.outcome) {
      case ACTION_OUTCOME.SUCCESS:
        toast.success({ message: t('alertSuccess') });
        router.refresh();
        return true;
      case ACTION_OUTCOME.INVALID:
        setFieldErrors(result.fieldErrors);
        return false;
      case ACTION_OUTCOME.REFUSED:
        setFormError(REFUSAL_KEYS[result.reason]);
        return false;
      case ACTION_OUTCOME.SERVER_ERROR:
        setFormError('saveFailed');
        return false;
    }
  };

  return { fieldErrors, formError, save, clearErrors };
};
