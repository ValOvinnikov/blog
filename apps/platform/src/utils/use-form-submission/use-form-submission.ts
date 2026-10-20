'use client';

import {
  ACTION_OUTCOME,
  FORM_STATUS,
  type TActionOutcome,
  type TFormStatus,
  type TOutcome,
} from '@blog/config';
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
        let result: TResult;
        try {
          result = await onSubmit(values);
        } catch {
          setStatus(FORM_STATUS.ERROR);
          resolve(false);
          return;
        }
        const isSuccess = result.outcome === ACTION_OUTCOME.SUCCESS;
        setStatus(isSuccess ? FORM_STATUS.SUCCESS : FORM_STATUS.ERROR);
        if (isSuccess) {
          onSuccess?.(values, result);
        }
        resolve(isSuccess);
      });
    });

  return { values, setValues, status, isPending, handleSubmit };
};
