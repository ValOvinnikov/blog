'use client';

import {
  ACTION_OUTCOME,
  isOutcomeSuccess,
  type TMaybeUndefined,
} from '@blog/config';
import type { TValueOf } from '@blog/config/utils';
import type {
  TTenantDetailsFieldErrors,
  TTenantDetailsValues,
} from '@platform/components/features/tenants/tenant-details-panel/tenant-details-values';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { useToast } from '@platform/context/toast-provider';
import { resendChangedOwnerStudioInviteAction } from '@platform/server/tenants/resend-changed-owner-studio-invite-action';
import {
  updateTenantDetailsAction,
  type TUpdateTenantDetailsRefusal,
} from '@platform/server/tenants/update-tenant-details-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const REFUSAL_KEYS = {
  [TENANT_REFUSAL.NOT_FOUND]: 'notFound',
  [TENANT_REFUSAL.ARCHIVED]: 'archived',
  [TENANT_REFUSAL.LOCALE_IS_ADDITIONAL]: 'localeIsAdditional',
  [TENANT_REFUSAL.PROVISIONING_STARTED]: 'provisioningStarted',
  [TENANT_REFUSAL.OWNER_ALREADY_JOINED]: 'ownerAlreadyJoined',
  [TENANT_REFUSAL.OWNER_HAS_FREE_TENANT]: 'ownerHasFreeTenant',
} as const satisfies Record<TUpdateTenantDetailsRefusal, string>;

type TFormErrorKey = TValueOf<typeof REFUSAL_KEYS> | 'saveFailed';

// A warning otherwise leaves after 5s, before an operator can reach its Resend action.
const STUDIO_REINVITE_WARNING_MS = 20_000;

export const useTenantDetailsSave = (
  tenantId: string,
  values: TTenantDetailsValues,
) => {
  const t = useTranslations('tenantDetailsPanel');
  const toast = useToast();
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<TTenantDetailsFieldErrors>({});
  const [formErrorKey, setFormErrorKey] =
    useState<TMaybeUndefined<TFormErrorKey>>(undefined);

  const clearErrors = () => {
    setFieldErrors({});
    setFormErrorKey(undefined);
  };

  const resendStudioInvite = async () => {
    const result = await resendChangedOwnerStudioInviteAction(tenantId);
    if (isOutcomeSuccess(result)) {
      toast.success({ message: t('studioInviteResent') });
    } else {
      toast.error({ message: t('studioInviteResendFailed') });
    }
  };

  const save = async (): Promise<boolean> => {
    clearErrors();

    const result = await updateTenantDetailsAction(tenantId, values);
    switch (result.outcome) {
      case ACTION_OUTCOME.SUCCESS: {
        if (result.isStudioReinviteUnsent) {
          toast.warning({
            message: t('alertSavedStudioInviteUnsent'),
            durationMs: STUDIO_REINVITE_WARNING_MS,
            action: {
              label: t('resendStudioInvite'),
              onAct: () => {
                void resendStudioInvite();
              },
            },
          });
        } else {
          toast.success({ message: t('alertSuccess') });
        }
        router.refresh();
        return true;
      }
      case ACTION_OUTCOME.INVALID:
        setFieldErrors(result.fieldErrors);
        return false;
      case ACTION_OUTCOME.REFUSED:
        setFormErrorKey(REFUSAL_KEYS[result.reason]);
        return false;
      case ACTION_OUTCOME.SERVER_ERROR:
        setFormErrorKey('saveFailed');
        return false;
    }
  };

  const formError = formErrorKey && t(`errors.${formErrorKey}`);

  return { fieldErrors, formError, save, clearErrors };
};
