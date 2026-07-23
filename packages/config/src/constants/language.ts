// Lowercase per BCP-47/ISO 639-1 convention, unlike this repo's usual
// uppercase key/value const pairs — <html lang> and hreflang attributes
// expect lowercase language codes.
export const LOCALE_ISO_CODES = {
  EN: 'en',
};

export type TLocaleIsoCode =
  (typeof LOCALE_ISO_CODES)[keyof typeof LOCALE_ISO_CODES];
