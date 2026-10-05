import { getDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';

type TLocalizedEntry = { language?: unknown; value?: unknown } | null;

export const validateDefaultLanguageBlocksFilled =
  (message: string) =>
  (value: unknown): true | string => {
    const defaultEntry = Array.isArray(value)
      ? (value as TLocalizedEntry[]).find(
          (item) => item?.language === getDefaultLanguage(),
        )
      : undefined;

    return Array.isArray(defaultEntry?.value) && defaultEntry.value.length > 0
      ? true
      : message;
  };
