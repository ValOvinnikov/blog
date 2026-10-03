import { getDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import { localizedStringValues } from '@blog/studio/schema-types/validation/localized-string-values/localized-string-values';

export const validateDefaultLanguageFilled =
  (message: string) =>
  (value: unknown): true | string => {
    const defaultEntries = Array.isArray(value)
      ? value.filter(
          (item) =>
            (item as { language?: unknown } | null)?.language ===
            getDefaultLanguage(),
        )
      : [];

    return localizedStringValues(defaultEntries).length > 0 ? true : message;
  };
