import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config/constants';

export const nativeLanguageName = (locale: TLocaleIsoCode): string => {
  const tag = LOCALE_BCP47_TAGS[locale];
  const name = new Intl.DisplayNames([tag], { type: 'language' }).of(tag);
  return name ? name.charAt(0).toLocaleUpperCase(tag) + name.slice(1) : locale;
};
