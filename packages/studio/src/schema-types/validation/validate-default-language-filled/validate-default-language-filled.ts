import { defaultLanguageValue } from '@shinefold/studio/schema-types/validation/default-language-value/default-language-value';

export const validateDefaultLanguageFilled =
  (message: string) =>
  (value: unknown): true | string =>
    defaultLanguageValue(value) === undefined ? message : true;
