'use client';

import { VOICE_FIELDS } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import {
  localeDraftOf,
  voiceValueAsText,
  type TVoiceDraft,
} from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';

export const useVoiceDraftFields = (liveLocales: TLocaleIsoCode[]) => {
  const t = useTranslations('voiceSettings');
  const tSurfaces = useTranslations('voiceSurfaces');
  const tLabels = useTranslations('voiceFieldLabels');
  const tLanguage = useTranslations('languageNames');

  return liveLocales.flatMap((locale) =>
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
};
