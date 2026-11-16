import type { TEmailDraft } from '@platform/utils/email-draft/email-draft';
import {
  countEmailDraftChanges,
  countLanguageChanges,
  countSharedChanges,
} from '@platform/utils/email-draft-changes/email-draft-changes';
import type { TLocaleIsoCode } from '@shinefold/config';
import { hasArrayGotMultipleItems } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

export const useEmailChangeCounts = (liveLocales: TLocaleIsoCode[]) => {
  const t = useTranslations('emailForm');
  const tLanguage = useTranslations('languageNames');

  return {
    countChanges: (values: TEmailDraft, savedValues: TEmailDraft) =>
      countEmailDraftChanges(savedValues, values, liveLocales),
    countChangesByLanguage: (values: TEmailDraft, savedValues: TEmailDraft) =>
      hasArrayGotMultipleItems(liveLocales)
        ? [
            {
              language: t('allLanguagesChanges'),
              count: countSharedChanges(savedValues, values),
            },
            ...liveLocales.map((locale) => ({
              language: tLanguage(locale),
              count: countLanguageChanges(savedValues, values, locale),
            })),
          ]
        : [],
  };
};
