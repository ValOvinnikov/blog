import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@shinefold/config';
import { useTranslations } from 'next-intl';

export const useLanguageDraftFields = (defaultLocale: TLocaleIsoCode) => {
  const t = useTranslations('languagesSettings');
  const tLanguage = useTranslations('languageNames');

  return Object.values(LOCALE_ISO_CODES)
    .filter((locale) => locale !== defaultLocale)
    .map((locale) => ({
      id: locale,
      label: tLanguage(locale),
      display: (liveLocales: TLocaleIsoCode[]) =>
        liveLocales.includes(locale) ? t('switchOn') : t('switchOff'),
    }));
};
