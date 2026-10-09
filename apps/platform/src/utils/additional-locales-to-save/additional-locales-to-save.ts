import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';

const SUPPORTED_LOCALES = Object.values(LOCALE_ISO_CODES);

// Only the first stored locales within the limit are served, so kept ones go last.
export const additionalLocalesToSave = (
  liveLocales: TLocaleIsoCode[],
  storedLocales: TLocaleIsoCode[],
  isOverLimit: boolean,
): TLocaleIsoCode[] => {
  const orderedLive = SUPPORTED_LOCALES.filter((locale) =>
    liveLocales.includes(locale),
  );

  if (!isOverLimit) {
    return orderedLive;
  }

  return [
    ...orderedLive,
    ...storedLocales.filter((locale) => !liveLocales.includes(locale)),
  ];
};
