'use client';

import {
  isOutcomeInvalid,
  isOutcomeRefused,
  isOutcomeServerError,
  isOutcomeSuccess,
  type TMaybeNull,
  type TMaybeUndefined,
} from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { useCustomDomainFocus } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-focus-provider/use-custom-domain-focus';
import {
  usePolledValue,
  type TPolledValueOptions,
} from '@platform/components/features/tenants/live-domain-card';
import {
  CUSTOM_DOMAIN_CONNECT_REJECTIONS,
  CUSTOM_DOMAIN_FIELD_ERROR,
  CUSTOM_DOMAIN_REFUSAL,
  CUSTOM_DOMAIN_VERIFY_POLL,
  type TCustomDomainRefusal,
} from '@platform/constants/custom-domain';
import { useToast } from '@platform/context/toast-provider';
import {
  verifyCustomDomainAction,
  type TVerifyCustomDomainResult,
} from '@platform/server/custom-domain/verify-custom-domain-action';
import {
  CUSTOM_DOMAIN_FIELD_ERROR_KEYS,
  CUSTOM_DOMAIN_REFUSAL_KEYS,
} from '@platform/utils/custom-domain-keys/custom-domain-keys';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useTransition } from 'react';

type TPolledVerify = TMaybeUndefined<TVerifyCustomDomainResult>;

const isStillWaiting = (result: TVerifyCustomDomainResult) =>
  isOutcomeServerError(result) ||
  (isOutcomeRefused(result) &&
    result.reason === CUSTOM_DOMAIN_REFUSAL.RECORD_NOT_FOUND);

const VERIFY_POLL_OPTIONS: TPolledValueOptions<TPolledVerify> = {
  ...CUSTOM_DOMAIN_VERIFY_POLL,
  isFinal: (result) => !isUndefined(result) && !isStillWaiting(result),
};

const connectRejectionOf = (
  result: TPolledVerify | TMaybeNull<TVerifyCustomDomainResult>,
): TMaybeUndefined<TCustomDomainRefusal> =>
  result &&
  isOutcomeRefused(result) &&
  CUSTOM_DOMAIN_CONNECT_REJECTIONS.includes(result.reason)
    ? result.reason
    : undefined;

export const useVerifyCustomDomain = (tenantId: string) => {
  const t = useTranslations('tenantDomainPage.ownDomain');
  const toast = useToast();
  const router = useRouter();
  const { requestFocus } = useCustomDomainFocus();
  const [isPending, startTransition] = useTransition();
  const polled = usePolledValue<TPolledVerify>(
    tenantId,
    undefined,
    verifyCustomDomainAction,
    VERIFY_POLL_OPTIONS,
  );

  const hasSucceeded = useRef(false);
  const [manual, setManual] =
    useState<TMaybeNull<TVerifyCustomDomainResult>>(null);

  useEffect(() => {
    if (isUndefined(polled) || isStillWaiting(polled)) return;
    if (isOutcomeSuccess(polled)) {
      hasSucceeded.current = true;
      requestFocus();
    }
    router.refresh();
  }, [polled, requestFocus, router]);

  const verify = () => {
    startTransition(async () => {
      const result = await verifyCustomDomainAction(tenantId);
      setManual(result);

      if (isOutcomeSuccess(result)) {
        hasSucceeded.current = true;
        requestFocus();
        router.refresh();
      } else if (isOutcomeInvalid(result)) {
        const reason =
          result.fieldErrors.domain?.reason ??
          CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_INVALID;
        toast.error({
          message: t(`fieldError.${CUSTOM_DOMAIN_FIELD_ERROR_KEYS[reason]}`),
        });
      } else if (
        hasSucceeded.current &&
        isOutcomeRefused(result) &&
        result.reason === CUSTOM_DOMAIN_REFUSAL.NO_PENDING_CLAIM
      ) {
        router.refresh();
      } else if (isOutcomeRefused(result)) {
        const message = t(
          `refusal.${CUSTOM_DOMAIN_REFUSAL_KEYS[result.reason]}`,
        );
        if (isStillWaiting(result)) toast.info({ message });
        else if (!connectRejectionOf(result)) toast.error({ message });
      } else {
        toast.error({ message: t('verifyFailed') });
      }
    });
  };

  return {
    isPending,
    verify,
    rejection: connectRejectionOf(manual ?? polled),
  };
};
