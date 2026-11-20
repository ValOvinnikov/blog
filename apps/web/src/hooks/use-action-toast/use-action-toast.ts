'use client';

import {
  isOutcomeSuccess,
  type TActionOutcome,
  type TMaybeUndefined,
  type TOutcome,
} from '@shinefold/config';
import { useToast } from '@web/context/toast-provider';
import { useOutOfDateNotice } from '@web/hooks/use-out-of-date-notice';
import { unstable_isUnrecognizedActionError, useRouter } from 'next/navigation';
import { useTransition } from 'react';

export type TActionToastOptions = {
  loading: string;
  success: string;
  error: string;
  errorByOutcome?: Partial<Record<TActionOutcome, string>>;
  onSuccess?: () => void | Promise<void>;
};

export const useActionToast = () => {
  const toast = useToast();
  const router = useRouter();
  const outOfDateNotice = useOutOfDateNotice();
  const [isPending, startTransition] = useTransition();

  const run = (
    action: () => Promise<TOutcome<TActionOutcome>>,
    {
      loading,
      success,
      error,
      errorByOutcome,
      onSuccess = () => router.refresh(),
    }: TActionToastOptions,
  ) => {
    startTransition(async () => {
      let failedOutcome: TMaybeUndefined<TActionOutcome>;
      try {
        await toast.promise(
          action().then((result) => {
            if (!isOutcomeSuccess(result)) {
              failedOutcome = result.outcome;
              throw new Error(result.outcome);
            }
            return result;
          }),
          {
            loading: { message: loading },
            success: { message: success },
            error: (rejection) =>
              unstable_isUnrecognizedActionError(rejection)
                ? outOfDateNotice
                : {
                    message:
                      (failedOutcome && errorByOutcome?.[failedOutcome]) ??
                      error,
                  },
          },
        );
      } catch {
        return;
      }

      await onSuccess();
    });
  };

  return { isPending, run };
};
