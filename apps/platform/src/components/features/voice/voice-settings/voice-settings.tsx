'use client';

import {
  ALERT_TYPE,
  VOICE_FIELDS,
  VOICE_SURFACE,
  type TMaybeUndefined,
  type TVoiceFieldId,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { VoiceSurfaceCard } from '@platform/components/features/voice/voice-surface-card';
import { Alert } from '@platform/components/shared/alert';
import { LanguagePicker } from '@platform/components/shared/language-picker';
import { PreviewModeControl } from '@platform/components/shared/preview-mode-control';
import {
  SettingsFormShell,
  useSettingsForm,
} from '@platform/components/shared/settings-form-shell';
import { useToast } from '@platform/context/toast-provider';
import {
  saveVoiceOverridesAction,
  type TSaveVoiceOverridesResult,
} from '@platform/server/site-config/save-voice-overrides-action';
import {
  buildSitePreviewTheme,
  type TSitePreviewThemeValues,
} from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
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
  savedAt?: Date;
  archivedAt?: Date;
};

export const VoiceSettings = ({
  tenantId,
  initialDraft,
  defaultLocale,
  liveLocales,
  previewTheme,
  savedAt,
  archivedAt,
}: TVoiceSettingsProps) => {
  const t = useTranslations('voiceSettings');
  const tSurfaces = useTranslations('voiceSurfaces');
  const tLabels = useTranslations('voiceFieldLabels');
  const tLanguage = useTranslations('languageNames');
  const toast = useToast();
  const router = useRouter();
  const fieldIdPrefix = useId();
  const [selectedLocale, setSelectedLocale] = useState(defaultLocale);
  const [openListFieldId, setOpenListFieldId] =
    useState<TMaybeUndefined<TVoiceFieldId>>('blogListEmpty');
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

  const errorsInOrder = voiceErrorsInOrder(
    fieldErrors,
    selectedLocale,
    liveLocales,
  );
  const [firstError] = errorsInOrder;
  const hasFieldErrors = firstError !== undefined;

  const resetEdits = () => {
    setFieldErrors({});
    setRevision((current) => current + 1);
  };

  const { values, setValues, savedValues, status, isPending, form } =
    useSettingsForm<TVoiceDraft, TSaveVoiceOverridesResult>({
      initialValues: initialDraft,
      archivedAt,
      onSubmit: async (draft) => {
        const result = await saveVoiceOverridesAction(
          tenantId,
          toVoiceOverridesInput(draft, liveLocales),
        );
        const errors = result.ok ? {} : (result.fieldErrorsByLocale ?? {});
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
      invalidFields: () => ({
        ids: errorsInOrder.map(({ fieldId }) =>
          voiceFieldInputId(fieldIdPrefix, fieldId),
        ),
        revealFirst: firstError && (() => revealError(firstError)),
      }),
      draft: {
        tenantId,
        page: 'voice',
        savedAt,
        fields: liveLocales.flatMap((locale) =>
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
        ),
        onRestore: (restored) => {
          setValues(buildVoiceDraft(restored, liveLocales));
          resetEdits();
        },
      },
    });

  const { intro, controls, languageEmphasis, cards } = voiceSettingsVariants();
  const specimenTheme = buildSitePreviewTheme(previewTheme, isDark);
  const languageName = tLanguage(selectedLocale);
  const draftValues = localeDraftOf(values, selectedLocale);
  const savedLocaleValues = localeDraftOf(savedValues, selectedLocale);
  const localeErrors = fieldErrors[selectedLocale] ?? {};

  const changeField = (id: TVoiceFieldId, value: TVoiceDraftValue) => {
    setValues((prev) => withVoiceValue(prev, selectedLocale, id, value));
    setFieldErrors((prev) => ({
      ...prev,
      [selectedLocale]: { ...prev[selectedLocale], [id]: undefined },
    }));
  };

  return (
    <SettingsFormShell
      isWide={true}
      title={t('heading')}
      description={t('description')}
      form={form}
      errorTitle={
        status === 'error' && !hasFieldErrors ? t('alertError') : undefined
      }
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
            savedValues={savedLocaleValues}
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
