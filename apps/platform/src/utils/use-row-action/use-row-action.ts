'use client';

import type { TConfirmDialogActionResult } from '@platform/components/shared/confirm-dialog';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { useToast } from '@platform/context/toast-provider';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import {
  type ACTION_OUTCOME,
  type TActionResult,
  type TMaybeUndefined,
  isOutcomeRefused,
  isOutcomeSuccess,
} from '@shinefold/config';
import { errorResult, okResult } from '@shinefold/utils';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

type TRowActionResult<TReason extends string> = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  TReason
>;

type TRowActionMessages<TReason extends string> = {
  done: string;
  gone: string;
  failed: string;
  refused?: Partial<Record<TReason, string>>;
};

export const useRowAction = <TReason extends string>({
  done,
  gone,
  failed,
  refused = {},
}: TRowActionMessages<TReason>) => {
  const toast = useToast();
  const router = useRouter();
  const announce = useRef<TMaybeUndefined<() => void>>(undefined);

  const onConfirm = async (
    request: Promise<TRowActionResult<TReason>>,
  ): Promise<TConfirmDialogActionResult> => {
    const result = await settleAction(request);
    if (isOutcomeSuccess(result)) {
      announce.current = () => toast.success({ message: done });
      return okResult();
    }
    if (isOutcomeRefused(result)) {
      if (result.reason === TENANT_REFUSAL.NOT_FOUND) {
        announce.current = () => toast.info({ message: gone });
        return okResult();
      }
      const refusal = refused[result.reason];
      if (refusal) return errorResult(refusal);
    }
    return errorResult(failed);
  };

  const onConfirmed = () => {
    announce.current?.();
    router.refresh();
  };

  return { onConfirm, onConfirmed };
};
