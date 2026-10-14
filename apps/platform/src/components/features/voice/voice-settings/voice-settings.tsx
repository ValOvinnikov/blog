'use client';

import { ALERT_TYPE } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { VoiceEditorProvider } from '@platform/components/features/voice/voice-editor-provider';
import { VoiceSurfaceCard } from '@platform/components/features/voice/voice-surface-card';
import { Alert } from '@platform/components/shared/alert';
import { LanguagePicker } from '@platform/components/shared/language-picker';
import { PreviewModeControl } from '@platform/components/shared/preview-mode-control';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import {
  buildSitePreviewTheme,
  type TSitePreviewThemeValues,
} from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { usePreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';
import {
  countCustomisedVoiceFields,
  localeDraftOf,
  VOICE_SURFACES_IN_PAGE_ORDER,
  type TVoiceDraft,
} from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';

import { useVoiceDraft } from './use-voice-draft';
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
  const tLanguage = useTranslations('languageNames');
  const { mode, setMode, isDark } = usePreviewColorScheme();
  const {
    values,
    savedValues,
    status,
    isPending,
    form,
    fieldIdPrefix,
    selectedLocale,
    setSelectedLocale,
    fieldErrors,
    hasFieldErrors,
    openListFieldId,
    setOpenListFieldId,
    setFieldValue,
    revision,
  } = useVoiceDraft({
    tenantId,
    initialDraft,
    defaultLocale,
    liveLocales,
    savedAt,
    archivedAt,
  });
  const { intro, controls, languageEmphasis, cards } = voiceSettingsVariants();

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
                    language: tLanguage(selectedLocale),
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
      <VoiceEditorProvider
        locale={selectedLocale}
        fieldIdPrefix={fieldIdPrefix}
        values={localeDraftOf(values, selectedLocale)}
        savedValues={localeDraftOf(savedValues, selectedLocale)}
        errors={fieldErrors[selectedLocale] ?? {}}
        openListFieldId={openListFieldId}
        setOpenListFieldId={setOpenListFieldId}
        setFieldValue={setFieldValue}
        specimenTheme={buildSitePreviewTheme(previewTheme, isDark)}
      >
        <div
          key={`${selectedLocale}-${revision}`}
          inert={isPending}
          className={cards()}
        >
          {VOICE_SURFACES_IN_PAGE_ORDER.map((surface) => (
            <VoiceSurfaceCard key={surface} surface={surface} />
          ))}
        </div>
      </VoiceEditorProvider>
    </SettingsFormShell>
  );
};
