'use client';

import {
  ALERT_TYPE,
  VOICE_FIELDS,
  VOICE_SURFACE,
  type TFontChoice,
  type TVoiceFieldId,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TVoiceOverridesByLocaleInput } from '@blog/db/queries/site-config';
import type { TSaveVoiceOverridesResult } from '@platform/components/features/voice/voice-page-content/save-voice-overrides-action';
import { VoiceSurfaceCard } from '@platform/components/features/voice/voice-surface-card';
import { Alert } from '@platform/components/shared/alert';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { useToast } from '@platform/context/toast-provider';
import {
  buildThemePreviewStyle,
  type TThemePreviewValues,
} from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import {
  countCustomisedVoiceFields,
  countLanguageVoiceChanges,
  countVoiceChanges,
  localeDraftOf,
  toVoiceOverridesInput,
  VOICE_SURFACES_IN_PAGE_ORDER,
  voiceFieldInputId,
  voiceFieldsOf,
  voiceValueAsText,
  withVoiceValue,
  buildVoiceDraft,
  type TVoiceDraft,
  type TVoiceDraftValue,
  type TVoiceFieldErrorsByLocale,
} from '@platform/utils/voice-draft/voice-draft';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { voiceSettingsVariants } from './voice-settings-variants';

type TPreviewMode = 'light' | 'dark';

type TVoicePreviewTheme = TThemePreviewValues & {
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
};

export type TVoiceSettingsProps = {
  tenantId: string;
  initialDraft: TVoiceDraft;
  defaultLocale: TLocaleIsoCode;
  liveLocales: TLocaleIsoCode[];
  previewTheme: TVoicePreviewTheme;
  saveAction: (
    tenantId: string,
    overridesByLocale: TVoiceOverridesByLocaleInput,
  ) => Promise<TSaveVoiceOverridesResult>;
  savedAt?: Date;
  archivedAt?: Date;
};

const erroringFieldIds = (
  errors: TVoiceFieldErrorsByLocale,
  locale: TLocaleIsoCode,
): TVoiceFieldId[] =>
  VOICE_FIELDS.filter(({ id }) => errors[locale]?.[id] !== undefined).map(
    ({ id }) => id,
  );

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
  const tPreview = useTranslations('lookPreview');
  const toast = useToast();
  const router = useRouter();
  const archivedNoticeId = useId();
  const fieldIdPrefix = useId();
  const isArchived = Boolean(archivedAt);
  const [saved, setSaved] = useState(initialDraft);
  const [selectedLocale, setSelectedLocale] = useState(defaultLocale);
  const [openListFieldId, setOpenListFieldId] =
    useState<TVoiceFieldId>('blogListEmpty');
  const [fieldErrors, setFieldErrors] = useState<TVoiceFieldErrorsByLocale>({});
  const [revision, setRevision] = useState(0);
  const [previewMode, setPreviewMode] = useState<TPreviewMode>('light');

  const revealFirstError = (errors: TVoiceFieldErrorsByLocale) => {
    const locale =
      erroringFieldIds(errors, selectedLocale).length > 0
        ? selectedLocale
        : liveLocales.find(
            (candidate) => erroringFieldIds(errors, candidate).length > 0,
          );
    if (locale === undefined) return;

    setSelectedLocale(locale);
    const listErrorId = erroringFieldIds(errors, locale).find((id) =>
      voiceFieldsOf(VOICE_SURFACE.ARCHIVE).some((field) => field.id === id),
    );
    if (listErrorId && errors[locale]?.[openListFieldId] === undefined) {
      setOpenListFieldId(listErrorId);
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
        revealFirstError(errors);
        return result;
      },
      onSuccess: (submitted) => {
        setSaved(submitted);
        toast.success({ message: t('alertSuccess') });
        router.refresh();
      },
    });

  const { intro, controls, languageEmphasis, cards } = voiceSettingsVariants();
  const isDark = previewMode === 'dark';
  const specimenTheme = {
    tokenStyle: buildThemePreviewStyle(previewTheme, isDark),
    isDark,
    headingFontFamily: FONT_OPTIONS[previewTheme.headingFont].fontFamily,
    bodyFontFamily: FONT_OPTIONS[previewTheme.bodyFont].fontFamily,
  };
  const languageName = tLanguage(selectedLocale);
  const draftValues = localeDraftOf(values, selectedLocale);
  const savedValues = localeDraftOf(saved, selectedLocale);
  const localeErrors = fieldErrors[selectedLocale] ?? {};
  const hasFieldErrors = liveLocales.some(
    (locale) => erroringFieldIds(fieldErrors, locale).length > 0,
  );
  const invalidFieldIds = [
    ...new Set(
      [
        selectedLocale,
        ...liveLocales.filter((locale) => locale !== selectedLocale),
      ].flatMap((locale) =>
        erroringFieldIds(fieldErrors, locale).map((id) =>
          voiceFieldInputId(fieldIdPrefix, id),
        ),
      ),
    ),
  ];

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
      invalidFieldIds={invalidFieldIds}
      isPending={isPending}
      archivedAt={archivedAt}
      archivedNoticeId={archivedNoticeId}
      hasError={status === 'error' && !hasFieldErrors}
      errorTitle={t('alertError')}
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
          {liveLocales.length > 1 && (
            <SegmentedControl
              options={liveLocales.map((locale) => ({
                value: locale,
                label: t('languageOption', {
                  language: tLanguage(locale),
                  count: countCustomisedVoiceFields(
                    localeDraftOf(values, locale),
                  ),
                }),
              }))}
              value={selectedLocale}
              onChange={setSelectedLocale}
              ariaLabel={t('languageAriaLabel')}
            />
          )}
          <SegmentedControl
            options={[
              { value: 'light', label: tPreview('modeLight') },
              { value: 'dark', label: tPreview('modeDark') },
            ]}
            value={previewMode}
            onChange={setPreviewMode}
            ariaLabel={tPreview('previewColorSchemeAriaLabel')}
          />
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
            isReadOnly={isArchived}
            specimenTheme={specimenTheme}
          />
        ))}
      </div>
    </SettingsFormShell>
  );
};
