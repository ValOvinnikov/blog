import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TLocalizedEntry } from '@blog/service/shared/localization/localized-entries';

export type TPickLocalizedLanguages = {
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
};

function valueIn<TValue>(
  entries: ReadonlyArray<TLocalizedEntry<TValue>> | null | undefined,
  language: TLocaleIsoCode,
): TValue | null {
  return entries?.find((entry) => entry.language === language)?.value ?? null;
}

export function pickLocalized<TValue>(
  entries: ReadonlyArray<TLocalizedEntry<TValue>> | null | undefined,
  { locale, defaultLocale }: TPickLocalizedLanguages,
): TValue | null {
  return valueIn(entries, locale) ?? valueIn(entries, defaultLocale);
}
