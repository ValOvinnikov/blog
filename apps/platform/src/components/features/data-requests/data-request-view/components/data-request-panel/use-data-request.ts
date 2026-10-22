'use client';

import { ACTION_OUTCOME, type TMaybeUndefined } from '@blog/config';
import type { TValueOf } from '@blog/config/utils';
import {
  DATA_REQUEST_EXPORT_FILE_NAME,
  DATA_REQUEST_FIELD_ERROR,
  type TDataRequestFieldError,
} from '@platform/constants/data-request';
import { useToast } from '@platform/context/toast-provider';
import { erasePersonalDataAction } from '@platform/server/data-requests/erase-personal-data-action';
import { exportPersonalDataAction } from '@platform/server/data-requests/export-personal-data-action';
import { lookUpPersonalDataAction } from '@platform/server/data-requests/look-up-personal-data-action';
import type { TDataRequestMatch } from '@platform/server/data-requests/to-data-request-matches';
import { downloadJson } from '@platform/utils/download-json/download-json';
import { useRef, useState, useTransition } from 'react';

const FIELD_ERROR_KEYS = {
  [DATA_REQUEST_FIELD_ERROR.EMAIL_INVALID]: 'emailInvalid',
} as const satisfies Record<TDataRequestFieldError, string>;

export type TDataRequestFieldErrorKey = TValueOf<typeof FIELD_ERROR_KEYS>;

type TDataRequestLookup = {
  email: string;
  matches: TDataRequestMatch[];
};

export type TUseDataRequestMessages = {
  lookUpFailed: string;
  exportFailed: string;
  eraseFailed: string;
  erased: (count: number) => string;
};

export const useDataRequest = ({
  lookUpFailed,
  exportFailed,
  eraseFailed,
  erased,
}: TUseDataRequestMessages) => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [errorKey, setErrorKey] =
    useState<TMaybeUndefined<TDataRequestFieldErrorKey>>(undefined);
  const [lookup, setLookup] =
    useState<TMaybeUndefined<TDataRequestLookup>>(undefined);
  const [isLookingUp, startLookUp] = useTransition();
  const [isExporting, startExport] = useTransition();
  const erasedCount = useRef(0);

  const lookUp = () => {
    startLookUp(async () => {
      const result = await lookUpPersonalDataAction({ email });

      if (result.outcome === ACTION_OUTCOME.SUCCESS) {
        setErrorKey(undefined);
        setLookup({ email: email.trim(), matches: result.matches });
        return;
      }

      setLookup(undefined);
      if (result.outcome === ACTION_OUTCOME.INVALID) {
        const { email: emailError } = result.fieldErrors;
        setErrorKey(emailError && FIELD_ERROR_KEYS[emailError.reason]);
        return;
      }

      toast.error({ message: lookUpFailed });
    });
  };

  const exportData = (lookedUpEmail: string) => {
    startExport(async () => {
      const result = await exportPersonalDataAction({ email: lookedUpEmail });

      if (result.outcome === ACTION_OUTCOME.SUCCESS) {
        downloadJson(DATA_REQUEST_EXPORT_FILE_NAME, {
          email: lookedUpEmail,
          ...result.data,
        });
        return;
      }

      toast.error({ message: exportFailed });
    });
  };

  const erase = async (lookedUpEmail: string) => {
    const result = await erasePersonalDataAction({ email: lookedUpEmail });
    if (result.outcome !== ACTION_OUTCOME.SUCCESS) {
      return { ok: false as const, error: eraseFailed };
    }

    erasedCount.current = result.erasedCount;
    return { ok: true as const };
  };

  const finishErase = () => {
    toast.success({ message: erased(erasedCount.current) });
    setLookup(undefined);
  };

  return {
    email,
    setEmail,
    errorKey,
    lookup,
    isLookingUp,
    isExporting,
    lookUp,
    exportData,
    erase,
    finishErase,
  };
};
