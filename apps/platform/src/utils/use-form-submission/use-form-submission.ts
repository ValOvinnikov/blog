'use client';

import { FORM_STATUS, type TFormStatus } from '@blog/config';
import {
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from 'react';

export type TUseFormSubmissionArgs<TValues, TResult extends { ok: boolean }> = {
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
export const useFormSubmission = <TValues, TResult extends { ok: boolean }>({
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
        const result = await onSubmit(values);
        setStatus(result.ok ? FORM_STATUS.SUCCESS : FORM_STATUS.ERROR);
        if (result.ok) {
          onSuccess?.(values, result);
        }
        resolve(result.ok);
      });
    });

  return { values, setValues, status, isPending, handleSubmit };
};
