'use client';

import {
  ACTION_OUTCOME,
  type TMaybeUndefined,
  type TVoiceFieldId,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { useSettingsForm } from '@platform/components/shared/settings-form-shell';
import { useToast } from '@platform/context/toast-provider';
import {
  saveVoiceOverridesAction,
  type TSaveVoiceOverridesResult,
} from '@platform/server/site-config/save-voice-overrides-action';
import {
  buildVoiceDraft,
  countLanguageVoiceChanges,
  countVoiceChanges,
  toVoiceOverridesInput,
  voiceErrorReveal,
  voiceErrorsInOrder,
  voiceFieldInputId,
  withVoiceValue,
  type TVoiceDraft,
  type TVoiceDraftValue,
  type TVoiceFieldError,
  type TVoiceFieldErrorsByLocale,
} from '@platform/utils/voice-draft/voice-draft';
import { toVoiceFieldMessages } from '@platform/utils/voice-field-errors/voice-field-errors';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { useVoiceDraftFields } from './use-voice-draft-fields';

type TUseVoiceDraftArgs = {
  tenantId: string;
  initialDraft: TVoiceDraft;
  defaultLocale: TLocaleIsoCode;
  liveLocales: TLocaleIsoCode[];
  savedAt: TMaybeUndefined<Date>;
  archivedAt: TMaybeUndefined<Date>;
};

export const useVoiceDraft = ({
  tenantId,
  initialDraft,
  defaultLocale,
  liveLocales,
  savedAt,
  archivedAt,
}: TUseVoiceDraftArgs) => {
  const t = useTranslations('voiceSettings');
  const tLanguage = useTranslations('languageNames');
  const toast = useToast();
  const router = useRouter();
  const fieldIdPrefix = useId();
  const draftFields = useVoiceDraftFields(liveLocales);
  const [selectedLocale, setSelectedLocale] = useState(defaultLocale);
  const [openListFieldId, setOpenListFieldId] =
    useState<TMaybeUndefined<TVoiceFieldId>>('blogListEmpty');
  const [fieldErrors, setFieldErrors] = useState<TVoiceFieldErrorsByLocale>({});
  const [revision, setRevision] = useState(0);

  const revealError = (error: TVoiceFieldError) => {
    const { locale, listFieldId } = voiceErrorReveal(error);
    setSelectedLocale(locale);
    if (listFieldId) setOpenListFieldId(listFieldId);
  };

  const errorsInOrder = voiceErrorsInOrder(
    fieldErrors,
    selectedLocale,
    liveLocales,
  );
  const [firstError] = errorsInOrder;

  const resetEdits = () => {
    setFieldErrors({});
    setRevision((current) => current + 1);
  };

  const settings = useSettingsForm<TVoiceDraft, TSaveVoiceOverridesResult>({
    initialValues: initialDraft,
    archivedAt,
    onSubmit: async (draft) => {
      const result = await saveVoiceOverridesAction(
        tenantId,
        toVoiceOverridesInput(draft, liveLocales),
      );
      const errors =
        result.outcome === ACTION_OUTCOME.INVALID
          ? toVoiceFieldMessages(result.fieldErrorsByLocale, (failure) =>
              t(`fieldError.${failure.reason}`, failure.values),
            )
          : {};
      setFieldErrors(errors);
      const [firstSaveError] = voiceErrorsInOrder(
        errors,
        selectedLocale,
        liveLocales,
      );
      if (firstSaveError) revealError(firstSaveError);
      return result;
    },
    onSuccess: () => {
      toast.success({ message: t('alertSuccess') });
      router.refresh();
    },
    onDiscard: resetEdits,
    countChanges: (draft, saved) =>
      countVoiceChanges(saved, draft, liveLocales),
    countChangesByLanguage: (draft, saved) =>
      liveLocales.length > 1
        ? liveLocales.map((locale) => ({
            language: tLanguage(locale),
            count: countLanguageVoiceChanges(saved, draft, locale),
          }))
        : [],
    invalidControls: () => ({
      ids: errorsInOrder.map(({ fieldId }) =>
        voiceFieldInputId(fieldIdPrefix, fieldId),
      ),
      revealFirst: firstError && (() => revealError(firstError)),
    }),
    draft: {
      tenantId,
      page: 'voice',
      savedAt,
      fields: draftFields,
      onRestore: (restored) => {
        settings.setValues(buildVoiceDraft(restored, liveLocales));
        resetEdits();
      },
    },
  });

  const setFieldValue = (id: TVoiceFieldId, value: TVoiceDraftValue) => {
    settings.setValues((prev) =>
      withVoiceValue(prev, selectedLocale, id, value),
    );
    setFieldErrors((prev) => ({
      ...prev,
      [selectedLocale]: { ...prev[selectedLocale], [id]: undefined },
    }));
  };

  return {
    ...settings,
    fieldIdPrefix,
    selectedLocale,
    setSelectedLocale,
    fieldErrors,
    hasFieldErrors: firstError !== undefined,
    openListFieldId,
    setOpenListFieldId,
    setFieldValue,
    revision,
  };
};
