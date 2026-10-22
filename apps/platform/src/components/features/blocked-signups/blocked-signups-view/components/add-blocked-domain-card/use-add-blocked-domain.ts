'use client';

import { ACTION_OUTCOME, type TMaybeUndefined } from '@blog/config';
import type { TValueOf } from '@blog/config/utils';
import { SIGNUP_BLOCK_FIELD_ERROR } from '@platform/constants/signup-block';
import { useToast } from '@platform/context/toast-provider';
import { addBlockedDomainAction } from '@platform/server/signup-block/add-blocked-domain-action';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

const FIELD_ERROR_KEYS = {
  [SIGNUP_BLOCK_FIELD_ERROR.BLOCK_DOMAIN_INVALID]: 'domainFormatInvalid',
  [SIGNUP_BLOCK_FIELD_ERROR.BLOCK_REASON_REQUIRED]: 'reasonRequired',
} as const;

export type TFieldErrorKey = TValueOf<typeof FIELD_ERROR_KEYS>;

type TDomainFormErrors = {
  domain: TMaybeUndefined<TFieldErrorKey>;
  reason: TMaybeUndefined<TFieldErrorKey>;
};

const NO_ERRORS: TDomainFormErrors = { domain: undefined, reason: undefined };

export type TUseAddBlockedDomainMessages = {
  added: string;
  failed: string;
};

export const useAddBlockedDomain = ({
  added,
  failed,
}: TUseAddBlockedDomainMessages) => {
  const toast = useToast();
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState(NO_ERRORS);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await addBlockedDomainAction({ domain, reason });

      if (result.outcome === ACTION_OUTCOME.SUCCESS) {
        setDomain('');
        setReason('');
        setErrors(NO_ERRORS);
        toast.success({ message: added });
        router.refresh();
        return;
      }

      if (result.outcome === ACTION_OUTCOME.INVALID) {
        const { domain: domainError, reason: reasonError } = result.fieldErrors;
        setErrors({
          domain: domainError && FIELD_ERROR_KEYS[domainError.reason],
          reason: reasonError && FIELD_ERROR_KEYS[reasonError.reason],
        });
        return;
      }

      setErrors(NO_ERRORS);
      toast.error({ message: failed });
    });
  };

  return {
    domain,
    reason,
    setDomain,
    setReason,
    domainErrorKey: errors.domain,
    reasonErrorKey: errors.reason,
    isPending,
    submit,
  };
};
