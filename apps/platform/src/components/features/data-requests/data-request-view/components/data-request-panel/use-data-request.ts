'use client';

import {
  ACTION_OUTCOME,
  type TMaybeUndefined,
  type TReasonedFailure,
} from '@blog/config';
import type { TConfirmDialogActionResult } from '@platform/components/shared/confirm-dialog';
import { DATA_REQUEST_EXPORT_FILE_NAME } from '@platform/constants/data-request';
import type { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { useToast } from '@platform/context/toast-provider';
import { erasePersonalDataAction } from '@platform/server/data-requests/erase-personal-data-action';
import { exportPersonalDataAction } from '@platform/server/data-requests/export-personal-data-action';
import { lookUpPersonalDataAction } from '@platform/server/data-requests/look-up-personal-data-action';
import type { TDataRequestMatch } from '@platform/server/data-requests/to-data-request-matches';
import { downloadJson } from '@platform/utils/download-json/download-json';
import { useRef, useState, useTransition } from 'react';

type TEmailError = TReasonedFailure<typeof TENANT_FIELD_ERROR.EMAIL_INVALID>;

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
  const [emailError, setEmailError] =
    useState<TMaybeUndefined<TEmailError>>(undefined);
  const [lookup, setLookup] =
    useState<TMaybeUndefined<TDataRequestLookup>>(undefined);
  const [isLookingUp, startLookUp] = useTransition();
  const [isExporting, startExport] = useTransition();
  const erasedCount = useRef(0);

  const lookUp = () => {
    startLookUp(async () => {
      const result = await lookUpPersonalDataAction({ email });

      if (result.outcome === ACTION_OUTCOME.SUCCESS) {
        setEmailError(undefined);
        setLookup({ email: email.trim(), matches: result.matches });
        return;
      }

      setLookup(undefined);
      if (result.outcome === ACTION_OUTCOME.INVALID) {
        setEmailError(result.fieldErrors.email);
        return;
      }

      toast.error({ message: lookUpFailed });
    });
  };

  const exportData = (lookedUpEmail: string, link: HTMLAnchorElement) => {
    startExport(async () => {
      const result = await exportPersonalDataAction({ email: lookedUpEmail });

      if (result.outcome === ACTION_OUTCOME.SUCCESS) {
        downloadJson(link, DATA_REQUEST_EXPORT_FILE_NAME, {
          email: lookedUpEmail,
          ...result.data,
        });
        return;
      }

      toast.error({ message: exportFailed });
    });
  };

  const erase = async (
    lookedUpEmail: string,
  ): Promise<TConfirmDialogActionResult> => {
    const result = await erasePersonalDataAction({ email: lookedUpEmail });
    if (result.outcome !== ACTION_OUTCOME.SUCCESS) {
      return { ok: false, error: eraseFailed };
    }

    erasedCount.current = result.erasedCount;
    return { ok: true };
  };

  const finishErase = () => {
    toast.success({ message: erased(erasedCount.current) });
    setLookup(undefined);
  };

  return {
    email,
    setEmail,
    emailError,
    lookup,
    isLookingUp,
    isExporting,
    lookUp,
    exportData,
    erase,
    finishErase,
  };
};
