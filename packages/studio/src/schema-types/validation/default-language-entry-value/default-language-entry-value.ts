import { getDefaultLanguage } from '@shinefold/studio/schema-types/validation/default-language/default-language';

type TLocalizedEntry = { language?: unknown; value?: unknown } | null;

export const defaultLanguageEntryValue = (value: unknown): unknown =>
  Array.isArray(value)
    ? (value as TLocalizedEntry[]).find(
        (item) => item?.language === getDefaultLanguage(),
      )?.value
    : undefined;
