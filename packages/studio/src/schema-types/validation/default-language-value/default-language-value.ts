import { getDefaultLanguage } from '@shinefold/studio/schema-types/validation/default-language/default-language';
import { localizedStringValues } from '@shinefold/studio/schema-types/validation/localized-string-values/localized-string-values';

export const defaultLanguageValue = (value: unknown): string | undefined => {
  const defaultEntries = Array.isArray(value)
    ? value.filter(
        (item) =>
          (item as { language?: unknown } | null)?.language ===
          getDefaultLanguage(),
      )
    : [];

  return localizedStringValues(defaultEntries)[0];
};
