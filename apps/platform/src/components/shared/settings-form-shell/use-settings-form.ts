'use client';

import { revealFirstInvalidControl } from '@platform/utils/reveal-first-invalid-control/reveal-first-invalid-control';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import {
  FORM_STATUS,
  type TActionOutcome,
  type TOutcome,
} from '@shinefold/config';
import { useId, useState } from 'react';

import type {
  TSettingsForm,
  TUseSettingsFormArgs,
} from './settings-form-types';
import { usePlanRefusal } from './use-plan-refusal';

export const useSettingsForm = <
  TValues,
  TResult extends TOutcome<TActionOutcome>,
>({
  initialValues,
  archivedAt,
  onSubmit,
  onSuccess,
  onDiscard,
  countChanges,
  countChangesByLanguage,
  invalidControls,
  canSave,
  planRefusalMessageKey,
  draft,
}: TUseSettingsFormArgs<TValues, TResult>) => {
  const archivedNoticeId = useId();
  const isArchived = Boolean(archivedAt);
  const [savedValues, setSavedValues] = useState(initialValues);
  const planRefusal = usePlanRefusal(draft.fields, planRefusalMessageKey);
  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TValues, TResult>({
      initialValues,
      onSubmit: (submitted): Promise<TResult> =>
        planRefusal.submit(() => onSubmit(submitted), setValues, savedValues),
      onSuccess: (submitted, result) => {
        // A save that wrote its own saved values (uploads swapped in) keeps them.
        setSavedValues((current) =>
          current === savedValues ? submitted : current,
        );
        onSuccess?.(submitted, result);
      },
    });

  const discard = () => {
    planRefusal.clear();
    setValues(savedValues);
    onDiscard?.();
  };

  const currentInvalidControls = invalidControls?.(values);

  const save = () => {
    if (!canSave || canSave(values)) return handleSubmit();
    if (currentInvalidControls) {
      revealFirstInvalidControl(currentInvalidControls);
    }
    return Promise.resolve(false);
  };

  const form: TSettingsForm<TValues> = {
    save,
    discard,
    changeCount: countChanges(values, savedValues),
    changesByLanguage: countChangesByLanguage?.(values, savedValues) ?? [],
    invalidControls: currentInvalidControls,
    isPending,
    isArchived,
    archivedAt,
    archivedNoticeId,
    planRefusal: status === FORM_STATUS.ERROR ? planRefusal.message : undefined,
    draft: {
      ...draft,
      values,
      savedValues,
      onRestore: draft.onRestore ?? setValues,
    },
  };

  return {
    values,
    setValues,
    savedValues,
    setSavedValues,
    status,
    isPending,
    isArchived,
    archivedNoticeId,
    form,
  };
};
