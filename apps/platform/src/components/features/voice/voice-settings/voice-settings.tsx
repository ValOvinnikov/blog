'use client';

import { FORM_STATUS } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { hasArrayGotMultipleItems } from '@blog/utils/primitives';
import { VoiceEditorProvider } from '@platform/components/features/voice/voice-editor-provider';
import { VoiceSurfaceCard } from '@platform/components/features/voice/voice-surface-card';
import { LanguagePicker } from '@platform/components/shared/language-picker';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { VOICE_CARDS_TEST_ID } from '@platform/constants/voice';
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

import { VoiceNoteRow } from './components/voice-note-row/voice-note-row';
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
  const { shell, cards } = voiceSettingsVariants();
  const isMultilingual = hasArrayGotMultipleItems(liveLocales);

  return (
    <SettingsFormShell
      layout={{ isWide: true, hasTightGap: true, hasPhoneSaveFooter: true }}
      className={shell()}
      title={t('heading')}
      description={t('description')}
      form={form}
      hasSavedStatus={false}
      errorTitle={
        status === FORM_STATUS.ERROR && !hasFieldErrors
          ? t('alertError')
          : undefined
      }
      headerActions={
        isMultilingual && (
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
      <VoiceNoteRow
        selectedLocale={selectedLocale}
        isMultilingual={isMultilingual}
        previewMode={mode}
        onPreviewModeChange={setMode}
      />
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
          data-testid={VOICE_CARDS_TEST_ID}
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
