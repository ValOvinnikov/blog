'use client';

import {
  FORM_STATUS,
  isOutcomeSuccess,
  type TActionOutcome,
  type TFormStatus,
  type TOutcome,
} from '@blog/config';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import {
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from 'react';

export type TUseFormSubmissionArgs<
  TValues,
  TResult extends TOutcome<TActionOutcome>,
> = {
  initialValues: TValues | (() => TValues);
  onSubmit: (values: TValues) => Promise<TResult>;
  onSuccess?: (values: TValues, result: TResult) => void;
};

export type TUseFormSubmissionResult<TValues> = {
  values: TValues;
  setValues: Dispatch<SetStateAction<TValues>>;
  status: TFormStatus;
  isPending: boolean;
  handleSubmit: () => Promise<boolean>;
};

// Any `setValues` call clears a previous save's status, so an edit made after an alert shows dismisses it.
export const useFormSubmission = <
  TValues,
  TResult extends TOutcome<TActionOutcome>,
>({
  initialValues,
  onSubmit,
  onSuccess,
}: TUseFormSubmissionArgs<
  TValues,
  TResult
>): TUseFormSubmissionResult<TValues> => {
  const [values, setValuesState] = useState<TValues>(initialValues);
  const [status, setStatus] = useState<TFormStatus>(FORM_STATUS.IDLE);
  const [isPending, startTransition] = useTransition();

  const setValues: Dispatch<SetStateAction<TValues>> = (update) => {
    setStatus(FORM_STATUS.IDLE);
    setValuesState(update);
  };

  const handleSubmit = () =>
    new Promise<boolean>((resolve) => {
      startTransition(async () => {
        const result = await settleAction(onSubmit(values));
        if (!isOutcomeSuccess(result)) {
          setStatus(FORM_STATUS.ERROR);
          resolve(false);
          return;
        }
        setStatus(FORM_STATUS.SUCCESS);
        onSuccess?.(values, result);
        resolve(true);
      });
    });

  return { values, setValues, status, isPending, handleSubmit };
};
