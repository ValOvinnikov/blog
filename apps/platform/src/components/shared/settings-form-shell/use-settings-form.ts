'use client';

import type { TActionOutcome, TMaybeUndefined, TOutcome } from '@blog/config';
import type { TLanguageChangeCount } from '@platform/utils/format-language-changes/format-language-changes';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { useId, useState } from 'react';

import type { TInvalidControls } from './components/save-bar/save-bar';
import type { TSettingsFormDraft } from './use-settings-draft';

type TSettingsFormDraftConfig<TValues> = Omit<
  TSettingsFormDraft<TValues>,
  'values' | 'savedValues' | 'onRestore'
> & {
  onRestore?: (values: TValues) => void;
};

export type TUseSettingsFormArgs<
  TValues,
  TResult extends TOutcome<TActionOutcome>,
> = {
  initialValues: TValues;
  archivedAt: TMaybeUndefined<Date>;
  onSubmit: (values: TValues) => Promise<TResult>;
  onSuccess?: (values: TValues, result: TResult) => void;
  onDiscard?: () => void;
  countChanges: (values: TValues, savedValues: TValues) => number;
  countChangesByLanguage?: (
    values: TValues,
    savedValues: TValues,
  ) => TLanguageChangeCount[];
  invalidControls?: (values: TValues) => TInvalidControls;
  canSave?: (values: TValues) => boolean;
  draft: TSettingsFormDraftConfig<TValues>;
};

export type TSettingsForm<TValues> = {
  save: () => Promise<boolean>;
  discard: () => void;
  changeCount: number;
  changesByLanguage: TLanguageChangeCount[];
  invalidControls: TMaybeUndefined<TInvalidControls>;
  isPending: boolean;
  isArchived: boolean;
  archivedAt: TMaybeUndefined<Date>;
  archivedNoticeId: string;
  draft: TSettingsFormDraft<TValues>;
};

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
  draft,
}: TUseSettingsFormArgs<TValues, TResult>) => {
  const archivedNoticeId = useId();
  const isArchived = Boolean(archivedAt);
  const [savedValues, setSavedValues] = useState(initialValues);
  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TValues, TResult>({
      initialValues,
      onSubmit,
      onSuccess: (submitted, result) => {
        // A save that wrote its own saved values (uploads swapped in) keeps them.
        setSavedValues((current) =>
          current === savedValues ? submitted : current,
        );
        onSuccess?.(submitted, result);
      },
    });

  const discard = () => {
    setValues(savedValues);
    onDiscard?.();
  };

  const form: TSettingsForm<TValues> = {
    save: () =>
      canSave && !canSave(values) ? Promise.resolve(false) : handleSubmit(),
    discard,
    changeCount: countChanges(values, savedValues),
    changesByLanguage: countChangesByLanguage?.(values, savedValues) ?? [],
    invalidControls: invalidControls?.(values),
    isPending,
    isArchived,
    archivedAt,
    archivedNoticeId,
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
