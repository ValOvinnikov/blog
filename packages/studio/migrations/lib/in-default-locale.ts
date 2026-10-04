import { LOCALE_ISO_CODES } from '@blog/config/constants';

// Every tenant's default language is English when these migrations run.
const DEFAULT_LOCALE = LOCALE_ISO_CODES.EN;

export const inDefaultLocale = (type: string, value: unknown) => [
  { _key: DEFAULT_LOCALE, _type: type, language: DEFAULT_LOCALE, value },
];

export const localizedString = (value: unknown) =>
  typeof value === 'string'
    ? inDefaultLocale('internationalizedArrayStringValue', value)
    : value;
