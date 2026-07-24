export const LOCALE_ISO_CODES = {
  EN: 'EN',
};

export type TLocaleIsoCode =
  (typeof LOCALE_ISO_CODES)[keyof typeof LOCALE_ISO_CODES];
