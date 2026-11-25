import type { TMaybeUndefined } from '@shinefold/config/types';
import { defaultLanguageEntryValue } from '@shinefold/studio/schema-types/validation/default-language-entry-value/default-language-entry-value';
import { localizedStringValues } from '@shinefold/studio/schema-types/validation/localized-string-values/localized-string-values';

export const defaultLanguageValue = (value: unknown): TMaybeUndefined<string> =>
  localizedStringValues([{ value: defaultLanguageEntryValue(value) }])[0];
