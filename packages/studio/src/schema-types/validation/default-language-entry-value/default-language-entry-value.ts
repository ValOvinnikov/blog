import type { TMaybeNull } from '@shinefold/config/types';
import { getDefaultLanguage } from '@shinefold/studio/schema-types/validation/default-language/default-language';

type TLocalizedEntry = TMaybeNull<{ language?: unknown; value?: unknown }>;

export const defaultLanguageEntryValue = (value: unknown): unknown =>
  Array.isArray(value)
    ? (value as TLocalizedEntry[]).find(
        (item) => item?.language === getDefaultLanguage(),
      )?.value
    : undefined;
