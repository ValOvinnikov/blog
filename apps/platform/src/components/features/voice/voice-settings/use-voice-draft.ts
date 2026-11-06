'use client';

import {
  ACTION_OUTCOME,
  type TMaybeUndefined,
  type TVoiceFieldId,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import {
  hasArrayGotItems,
  hasArrayGotMultipleItems,
} from '@blog/utils/primitives';
import { useSettingsForm } from '@platform/components/shared/settings-form-shell';
import { useToast } from '@platform/context/toast-provider';
import {
  saveVoiceOverridesAction,
  type TSaveVoiceOverridesResult,
} from '@platform/server/site-config/save-voice-overrides-action';
import { revealFirstInvalidControl } from '@platform/utils/reveal-first-invalid-control/reveal-first-invalid-control';
import { useAfterSave } from '@platform/utils/use-after-save/use-after-save';
import {
  countLanguageVoiceChanges,
  countVoiceChanges,
  toVoiceOverridesInput,
  voiceErrorsInOrder,
  withVoiceValue,
  type TVoiceDraft,
  type TVoiceDraftValue,
  type TVoiceFieldErrorsByLocale,
} from '@platform/utils/voice-draft/voice-draft';
import { buildVoiceDraft } from '@platform/utils/voice-draft-builder/voice-draft-builder';
import { toVoiceFieldMessages } from '@platform/utils/voice-field-errors/voice-field-errors';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { useVoiceDraftFields } from './use-voice-draft-fields';
import { useVoiceErrorReveal } from './use-voice-error-reveal';
import { useVoiceSections } from './use-voice-sections';

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
  const [fieldErrors, setFieldErrors] = useState<TVoiceFieldErrorsByLocale>({});
  const [revision, setRevision] = useState(0);
  const sections = useVoiceSections();
  const { openListFieldId, setOpenListFieldId, invalidControlsOf } =
    useVoiceErrorReveal({
      fieldIdPrefix,
      setSelectedLocale,
      setSectionOpen: sections.setSectionOpen,
    });

  const errorsInOrder = voiceErrorsInOrder(
    fieldErrors,
    selectedLocale,
    liveLocales,
  );

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
      const { ids, revealFirst } = invalidControlsOf(
        voiceErrorsInOrder(errors, selectedLocale, liveLocales),
      );
      if (revealFirst) {
        revealFirst();
        afterSave(() => revealFirstInvalidControl({ ids }));
      }
      return result;
    },
    onSuccess: () => {
      setRevision((current) => current + 1);
      toast.success({ message: t('alertSuccess') });
      router.refresh();
    },
    onDiscard: resetEdits,
    countChanges: (draft, saved) =>
      countVoiceChanges(saved, draft, liveLocales),
    countChangesByLanguage: (draft, saved) =>
      hasArrayGotMultipleItems(liveLocales)
        ? liveLocales.map((locale) => ({
            language: tLanguage(locale),
            count: countLanguageVoiceChanges(saved, draft, locale),
          }))
        : [],
    invalidControls: () => invalidControlsOf(errorsInOrder),
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

  const afterSave = useAfterSave(settings.isPending);

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
    hasFieldErrors: hasArrayGotItems(errorsInOrder),
    openListFieldId,
    setOpenListFieldId,
    setFieldValue,
    revision,
    sections,
  };
};
