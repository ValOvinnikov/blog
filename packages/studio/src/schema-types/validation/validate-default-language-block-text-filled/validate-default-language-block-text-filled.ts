import { defaultLanguageBlockText } from '@shinefold/studio/schema-types/validation/default-language-block-text/default-language-block-text';
import { isUndefined } from '@shinefold/utils/primitives';

export const validateDefaultLanguageBlockTextFilled =
  (message: string) =>
  (value: unknown): true | string =>
    isUndefined(defaultLanguageBlockText(value)) ? message : true;
