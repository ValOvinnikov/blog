import type { TMaybeUndefined } from '@shinefold/config/types';
import { portableTextToPlainText } from '@shinefold/config/voice';
import { defaultLanguageEntryValue } from '@shinefold/studio/schema-types/validation/default-language-entry-value/default-language-entry-value';
import type { TTextBlock } from '@shinefold/utils/portable-text';
import { hasLength } from '@shinefold/utils/primitives';

export const defaultLanguageBlockText = (
  value: unknown,
): TMaybeUndefined<string> => {
  const blocks = defaultLanguageEntryValue(value);
  const text = Array.isArray(blocks)
    ? portableTextToPlainText(blocks as TTextBlock[])
    : '';

  return hasLength(text) ? text : undefined;
};
