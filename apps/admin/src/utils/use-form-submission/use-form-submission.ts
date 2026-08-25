'use client';

import {
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from 'react';

type TFormSubmissionStatus = 'idle' | 'success' | 'error';

export type TUseFormSubmissionArgs<TValues, TResult extends { ok: boolean }> = {
  initialValues: TValues | (() => TValues);
  onSubmit: (values: TValues) => Promise<TResult>;
  /** Runs only after a successful submit, with the values that were just submitted. */
  onSuccess?: (values: TValues, result: TResult) => void;
};

export type TUseFormSubmissionResult<TValues> = {
  values: TValues;
  setValues: Dispatch<SetStateAction<TValues>>;
  status: TFormSubmissionStatus;
  isPending: boolean;
  handleSubmit: () => void;
};

/**
 * Any `setValues` call clears a previous save's status — a field edit made
 * after an alert is showing invalidates that alert, whether the edit came
 * from a form control or an independently-persisted side effect (e.g. a
 * brand-asset upload updating a URL field outside the save flow).
 */
export const useFormSubmission = <TValues, TResult extends { ok: boolean }>({
  initialValues,
  onSubmit,
  onSuccess,
}: TUseFormSubmissionArgs<
  TValues,
  TResult
>): TUseFormSubmissionResult<TValues> => {
  const [values, setValuesState] = useState<TValues>(initialValues);
  const [status, setStatus] = useState<TFormSubmissionStatus>('idle');
  const [isPending, startTransition] = useTransition();

  const setValues: Dispatch<SetStateAction<TValues>> = (update) => {
    setStatus('idle');
    setValuesState(update);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await onSubmit(values);
      setStatus(result.ok ? 'success' : 'error');
      if (result.ok) {
        onSuccess?.(values, result);
      }
    });
  };

  return { values, setValues, status, isPending, handleSubmit };
};
