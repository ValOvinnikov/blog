'use client';

import { ACTION_OUTCOME, type TMaybeUndefined } from '@blog/config';
import type { TValueOf } from '@blog/config/utils';
import { useCustomDomainFocus } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-focus-provider/use-custom-domain-focus';
import { CUSTOM_DOMAIN_FIELD_ERROR } from '@platform/constants/custom-domain';
import { useToast } from '@platform/context/toast-provider';
import { connectCustomDomainAction } from '@platform/server/custom-domain/connect-custom-domain-action';
import {
  CUSTOM_DOMAIN_FIELD_ERROR_KEYS,
  CUSTOM_DOMAIN_REFUSAL_KEYS,
} from '@platform/utils/custom-domain-keys/custom-domain-keys';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

type TFieldErrorKey = TValueOf<typeof CUSTOM_DOMAIN_FIELD_ERROR_KEYS>;

export const useConnectCustomDomain = (tenantId: string) => {
  const t = useTranslations('tenantDomainPage.ownDomain');
  const toast = useToast();
  const router = useRouter();
  const { requestFocus } = useCustomDomainFocus();
  const [domain, setDomain] = useState('');
  const [errorKey, setErrorKey] = useState<TMaybeUndefined<TFieldErrorKey>>();
  const [isPending, startTransition] = useTransition();

  const changeDomain = (nextDomain: string) => {
    setDomain(nextDomain);
    setErrorKey(undefined);
  };

  const submit = () => {
    startTransition(async () => {
      const result = await connectCustomDomainAction(tenantId, { domain });
      setErrorKey(undefined);

      switch (result.outcome) {
        case ACTION_OUTCOME.SUCCESS:
          setDomain('');
          requestFocus();
          router.refresh();
          return;
        case ACTION_OUTCOME.INVALID: {
          const reason =
            result.fieldErrors.domain?.reason ??
            CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_INVALID;
          setErrorKey(CUSTOM_DOMAIN_FIELD_ERROR_KEYS[reason]);
          return;
        }
        case ACTION_OUTCOME.REFUSED:
          toast.error({
            message: t(`refusal.${CUSTOM_DOMAIN_REFUSAL_KEYS[result.reason]}`),
          });
          return;
        case ACTION_OUTCOME.SERVER_ERROR:
          toast.error({ message: t('connectFailed') });
          return;
      }
    });
  };

  return {
    domain,
    changeDomain,
    error: errorKey && t(`fieldError.${errorKey}`),
    isPending,
    submit,
  };
};
