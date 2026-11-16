import {
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';

let defaultLanguage: TLocaleIsoCode = LOCALE_ISO_CODES.EN;

export const setDefaultLanguage = (language: TLocaleIsoCode) => {
  defaultLanguage = language;
};

export const getDefaultLanguage = () => defaultLanguage;
