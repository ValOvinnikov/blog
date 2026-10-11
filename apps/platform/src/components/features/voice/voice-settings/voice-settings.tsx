'use client';

import {
  ALERT_TYPE,
  VOICE_FIELDS,
  VOICE_SURFACE,
  type TVoiceFieldId,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TVoiceOverridesByLocaleInput } from '@blog/db/queries/site-config';
import { VoiceSurfaceCard } from '@platform/components/features/voice/voice-surface-card';
import { Alert } from '@platform/components/shared/alert';
import { LanguagePicker } from '@platform/components/shared/language-picker';
import { PreviewModeControl } from '@platform/components/shared/preview-mode-control';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { useToast } from '@platform/context/toast-provider';
import type { TSaveVoiceOverridesResult } from '@platform/server/site-config/save-voice-overrides-action';
import {
  buildSitePreviewTheme,
  type TSitePreviewThemeValues,
} from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { usePreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';
import {
  countCustomisedVoiceFields,
  countLanguageVoiceChanges,
  countVoiceChanges,
  localeDraftOf,
  toVoiceOverridesInput,
  VOICE_SURFACES_IN_PAGE_ORDER,
  voiceErrorsInOrder,
  voiceFieldInputId,
  voiceFieldsOf,
  voiceValueAsText,
  withVoiceValue,
  buildVoiceDraft,
  type TVoiceDraft,
  type TVoiceDraftValue,
  type TVoiceFieldError,
  type TVoiceFieldErrorsByLocale,
} from '@platform/utils/voice-draft/voice-draft';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { voiceSettingsVariants } from './voice-settings-variants';

export type TVoiceSettingsProps = {
  tenantId: string;
  initialDraft: TVoiceDraft;
  defaultLocale: TLocaleIsoCode;
  liveLocales: TLocaleIsoCode[];
  previewTheme: TSitePreviewThemeValues;
  saveAction: (
    tenantId: string,
    overridesByLocale: TVoiceOverridesByLocaleInput,
  ) => Promise<TSaveVoiceOverridesResult>;
  savedAt?: Date;
  archivedAt?: Date;
};

export const VoiceSettings = ({
  tenantId,
  initialDraft,
  defaultLocale,
  liveLocales,
  previewTheme,
  saveAction,
  savedAt,
  archivedAt,
}: TVoiceSettingsProps) => {
  const t = useTranslations('voiceSettings');
  const tSurfaces = useTranslations('voiceSurfaces');
  const tLabels = useTranslations('voiceFieldLabels');
  const tLanguage = useTranslations('languageNames');
  const toast = useToast();
  const router = useRouter();
  const archivedNoticeId = useId();
  const fieldIdPrefix = useId();
  const [saved, setSaved] = useState(initialDraft);
  const [selectedLocale, setSelectedLocale] = useState(defaultLocale);
  const [openListFieldId, setOpenListFieldId] = useState<
    TVoiceFieldId | undefined
  >('blogListEmpty');
  const [fieldErrors, setFieldErrors] = useState<TVoiceFieldErrorsByLocale>({});
  const [revision, setRevision] = useState(0);
  const { mode, setMode, isDark } = usePreviewColorScheme();

  const revealError = ({ locale, fieldId }: TVoiceFieldError) => {
    setSelectedLocale(locale);
    if (
      voiceFieldsOf(VOICE_SURFACE.ARCHIVE).some((field) => field.id === fieldId)
    ) {
      setOpenListFieldId(fieldId);
    }
  };

  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TVoiceDraft, TSaveVoiceOverridesResult>({
      initialValues: initialDraft,
      onSubmit: async (draft) => {
        const result = await saveAction(
          tenantId,
          toVoiceOverridesInput(draft, liveLocales),
        );
        const errors = result.ok ? {} : (result.fieldErrorsByLocale ?? {});
        setFieldErrors(errors);
        const [firstError] = voiceErrorsInOrder(
          errors,
          selectedLocale,
          liveLocales,
        );
        if (firstError) revealError(firstError);
        return result;
      },
      onSuccess: (submitted) => {
        setSaved(submitted);
        toast.success({ message: t('alertSuccess') });
        router.refresh();
      },
    });

  const { intro, controls, languageEmphasis, cards } = voiceSettingsVariants();
  const specimenTheme = buildSitePreviewTheme(previewTheme, isDark);
  const languageName = tLanguage(selectedLocale);
  const draftValues = localeDraftOf(values, selectedLocale);
  const savedValues = localeDraftOf(saved, selectedLocale);
  const localeErrors = fieldErrors[selectedLocale] ?? {};
  const errorsInOrder = voiceErrorsInOrder(
    fieldErrors,
    selectedLocale,
    liveLocales,
  );
  const [firstError] = errorsInOrder;
  const hasFieldErrors = firstError !== undefined;

  const changeField = (id: TVoiceFieldId, value: TVoiceDraftValue) => {
    setValues((prev) => withVoiceValue(prev, selectedLocale, id, value));
    setFieldErrors((prev) => ({
      ...prev,
      [selectedLocale]: { ...prev[selectedLocale], [id]: undefined },
    }));
  };

  const replaceDraft = (next: TVoiceDraft) => {
    setValues(next);
    setFieldErrors({});
    setRevision((current) => current + 1);
  };

  const draftFields = liveLocales.flatMap((locale) =>
    VOICE_FIELDS.map((field) => ({
      id: `${locale}.${field.id}`,
      label: t('draftFieldLabel', {
        surface: tSurfaces(field.surface),
        field: tLabels(field.id),
        language: tLanguage(locale),
      }),
      display: (draft: TVoiceDraft) =>
        voiceValueAsText(localeDraftOf(draft, locale)[field.id]),
    })),
  );

  return (
    <SettingsFormShell
      isWide={true}
      title={t('heading')}
      description={t('description')}
      saveButtonLabel={t('saveButton')}
      savingButtonLabel={t('savingButton')}
      onSave={handleSubmit}
      onDiscard={() => replaceDraft(saved)}
      changeCount={countVoiceChanges(saved, values, liveLocales)}
      changesByLanguage={
        liveLocales.length > 1
          ? liveLocales.map((locale) => ({
              language: tLanguage(locale),
              count: countLanguageVoiceChanges(saved, values, locale),
            }))
          : []
      }
      invalidFields={{
        ids: errorsInOrder.map(({ fieldId }) =>
          voiceFieldInputId(fieldIdPrefix, fieldId),
        ),
        revealFirst: firstError && (() => revealError(firstError)),
      }}
      isPending={isPending}
      archivedAt={archivedAt}
      archivedNoticeId={archivedNoticeId}
      hasError={status === 'error' && !hasFieldErrors}
      errorTitle={t('alertError')}
      headerActions={
        liveLocales.length > 1 && (
          <LanguagePicker
            locales={liveLocales}
            defaultLocale={defaultLocale}
            value={selectedLocale}
            onChange={setSelectedLocale}
            countCustomised={(locale) =>
              countCustomisedVoiceFields(localeDraftOf(values, locale))
            }
          />
        )
      }
      draft={{
        tenantId,
        page: 'voice',
        values,
        savedValues: saved,
        savedAt,
        fields: draftFields,
        onRestore: (restored) =>
          replaceDraft(buildVoiceDraft(restored, liveLocales)),
      }}
    >
      <div className={intro()}>
        <div className={controls()}>
          <PreviewModeControl value={mode} onChange={setMode} />
        </div>
        <Alert
          type={ALERT_TYPE.INFO}
          description={
            <>
              {t('fixedCopyNote')}
              {liveLocales.length > 1 && (
                <>
                  {' '}
                  {t.rich('editingLanguageNote', {
                    language: languageName,
                    strong: (chunks) => (
                      <strong className={languageEmphasis()}>{chunks}</strong>
                    ),
                  })}
                </>
              )}
            </>
          }
        />
      </div>
      <div
        key={`${selectedLocale}-${revision}`}
        inert={isPending}
        className={cards()}
      >
        {VOICE_SURFACES_IN_PAGE_ORDER.map((surface) => (
          <VoiceSurfaceCard
            key={surface}
            surface={surface}
            locale={selectedLocale}
            fieldIdPrefix={fieldIdPrefix}
            values={draftValues}
            savedValues={savedValues}
            errors={localeErrors}
            openFieldId={
              surface === VOICE_SURFACE.ARCHIVE ? openListFieldId : undefined
            }
            onOpenField={setOpenListFieldId}
            onFieldChange={changeField}
            specimenTheme={specimenTheme}
          />
        ))}
      </div>
    </SettingsFormShell>
  );
};
