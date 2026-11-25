import { defaultLanguageEntryValue } from '@shinefold/studio/schema-types/validation/default-language-entry-value/default-language-entry-value';
import { hasLength } from '@shinefold/utils/primitives';

export const validateDefaultLanguageBlocksFilled =
  (message: string) =>
  (value: unknown): true | string => {
    const blocks = defaultLanguageEntryValue(value);

    return Array.isArray(blocks) && hasLength(blocks) ? true : message;
  };
