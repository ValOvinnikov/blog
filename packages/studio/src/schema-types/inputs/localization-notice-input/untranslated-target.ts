import {
  isLocaleIsoCode,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import { LOCALE_LABEL } from '@shinefold/studio/schema-types/inputs/localization-notice-input/missing-locales';

export const getUntranslatedTargetLocales = (
  translatedLanguages: readonly unknown[],
  liveLocales: readonly TLocaleIsoCode[],
  defaultLocale: TLocaleIsoCode,
): TLocaleIsoCode[] => {
  const translated = new Set(
    translatedLanguages.filter(
      (language): language is TLocaleIsoCode =>
        typeof language === 'string' && isLocaleIsoCode(language),
    ),
  );

  return liveLocales.filter(
    (locale) => locale !== defaultLocale && !translated.has(locale),
  );
};

export const formatUntranslatedTargetNotice = (
  locale: TLocaleIsoCode,
  defaultLocale: TLocaleIsoCode,
): string =>
  `Not translated into ${LOCALE_LABEL[locale]} — ${LOCALE_LABEL[locale]} readers go to the ${LOCALE_LABEL[defaultLocale]} page.`;
