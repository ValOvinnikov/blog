import type { TValueOf } from '@blog/config/utils';

export const LOCALE_ISO_CODES = {
  EN: 'EN',
  NL: 'NL',
  FR: 'FR',
  DE: 'DE',
  ES: 'ES',
} as const;

export type TLocaleIsoCode = TValueOf<typeof LOCALE_ISO_CODES>;

export const isLocaleIsoCode = (value: string): value is TLocaleIsoCode =>
  (Object.values(LOCALE_ISO_CODES) as string[]).includes(value);

export const LOCALE_BCP47_TAGS = {
  EN: 'en',
  NL: 'nl',
  FR: 'fr',
  DE: 'de',
  ES: 'es',
} as const satisfies Record<keyof typeof LOCALE_ISO_CODES, string>;

export type TLocaleBcp47Tag = TValueOf<typeof LOCALE_BCP47_TAGS>;

export const LOCALE_ENDONYMS = {
  EN: 'English',
  NL: 'Nederlands',
  FR: 'Français',
  DE: 'Deutsch',
  ES: 'Español',
} as const satisfies Record<keyof typeof LOCALE_ISO_CODES, string>;
