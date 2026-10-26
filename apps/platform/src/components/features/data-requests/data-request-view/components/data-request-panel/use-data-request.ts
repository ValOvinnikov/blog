'use client';

import {
  isOutcomeInvalid,
  isOutcomeSuccess,
  type TMaybeUndefined,
  type TReasonedFailure,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import type { TConfirmDialogActionResult } from '@platform/components/shared/confirm-dialog';
import type { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { useToast } from '@platform/context/toast-provider';
import { erasePersonalDataAction } from '@platform/server/data-requests/erase-personal-data-action';
import {
  lookUpPersonalDataAction,
  type TLookUpPersonalDataResult,
} from '@platform/server/data-requests/look-up-personal-data-action';
import { useRef, useState, useTransition } from 'react';

type TEmailError = TReasonedFailure<typeof TENANT_FIELD_ERROR.EMAIL_INVALID>;

type TDataRequestLookup = Pick<
  Extract<TLookUpPersonalDataResult, { matches: unknown }>,
  'matches' | 'readerAccount'
> & { email: string };

type TErasure = { count: number; isReaderAccountRefused: boolean };

export type TUseDataRequestMessages = {
  lookUpFailed: string;
  eraseFailed: string;
  erased: (count: number) => string;
  erasedAccountKept: (count: number) => string;
};

export const useDataRequest = ({
  lookUpFailed,
  eraseFailed,
  erased,
  erasedAccountKept,
}: TUseDataRequestMessages) => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] =
    useState<TMaybeUndefined<TEmailError>>(undefined);
  const [lookup, setLookup] =
    useState<TMaybeUndefined<TDataRequestLookup>>(undefined);
  const [isLookingUp, startLookUp] = useTransition();
  const erasure = useRef<TErasure>({
    count: 0,
    isReaderAccountRefused: false,
  });

  const lookUp = () => {
    startLookUp(async () => {
      const result = await lookUpPersonalDataAction({ email });

      if (isOutcomeSuccess(result)) {
        const { matches, readerAccount } = result;
        setEmailError(undefined);
        setLookup({ email: email.trim(), matches, readerAccount });
        return;
      }

      setLookup(undefined);
      if (isOutcomeInvalid(result)) {
        setEmailError(result.fieldErrors.email);
        return;
      }

      toast.error({ message: lookUpFailed });
    });
  };

  const erase = async (
    lookedUpEmail: string,
    includesReaderAccount: boolean,
  ): Promise<TConfirmDialogActionResult> => {
    const result = await erasePersonalDataAction({
      email: lookedUpEmail,
      includesReaderAccount,
    });
    if (!isOutcomeSuccess(result)) return errorResult(eraseFailed);

    erasure.current = {
      count: result.erasedCount,
      isReaderAccountRefused: result.isReaderAccountRefused,
    };
    return okResult();
  };

  const finishErase = () => {
    const { count, isReaderAccountRefused } = erasure.current;
    toast.success({
      message: isReaderAccountRefused
        ? erasedAccountKept(count)
        : erased(count),
    });
    setLookup(undefined);
  };

  return {
    email,
    setEmail,
    emailError,
    lookup,
    isLookingUp,
    lookUp,
    erase,
    finishErase,
  };
};
