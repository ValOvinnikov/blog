import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';

export const LOCALE_LABEL: Readonly<Record<TLocaleIsoCode, string>> = {
  [LOCALE_ISO_CODES.EN]: 'English',
  [LOCALE_ISO_CODES.NL]: 'Dutch',
  [LOCALE_ISO_CODES.FR]: 'French',
  [LOCALE_ISO_CODES.DE]: 'German',
  [LOCALE_ISO_CODES.ES]: 'Spanish',
};

type TLocalizedItem = { _type: string; language: string; value?: unknown };

const isLocalizedItem = (item: unknown): item is TLocalizedItem =>
  typeof item === 'object' &&
  item !== null &&
  typeof (item as TLocalizedItem)._type === 'string' &&
  (item as TLocalizedItem)._type.startsWith('internationalizedArray') &&
  typeof (item as TLocalizedItem).language === 'string';

const isLocalizedArray = (value: unknown): value is TLocalizedItem[] =>
  Array.isArray(value) && value.length > 0 && value.every(isLocalizedItem);

const hasContent = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined;
};

export const getMissingLocales = (
  value: unknown,
  liveLocales: readonly TLocaleIsoCode[],
): TLocaleIsoCode[] => {
  const items = Array.isArray(value) ? value.filter(isLocalizedItem) : [];

  return liveLocales.filter(
    (locale) =>
      !items.some((item) => item.language === locale && hasContent(item.value)),
  );
};

export const getMissingTranslations = (
  value: unknown,
  liveLocales: readonly TLocaleIsoCode[],
): TLocaleIsoCode[] => {
  const missing = getMissingLocales(value, liveLocales);

  return missing.length === liveLocales.length ? [] : missing;
};

const findLocalizedArrays = (value: unknown): TLocalizedItem[][] => {
  if (isLocalizedArray(value)) {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(findLocalizedArrays);
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(findLocalizedArrays);
  }
  return [];
};

export const collectMissingLocales = (
  document: unknown,
  liveLocales: readonly TLocaleIsoCode[],
  defaultLocale: TLocaleIsoCode,
): TLocaleIsoCode[] => {
  const missing = new Set(
    findLocalizedArrays(document).flatMap((items) =>
      getMissingTranslations(items, liveLocales),
    ),
  );

  return liveLocales.filter(
    (locale) => locale !== defaultLocale && missing.has(locale),
  );
};

export const formatLocaleList = (locales: readonly TLocaleIsoCode[]): string =>
  locales.map((locale) => LOCALE_LABEL[locale] ?? locale).join(', ');
