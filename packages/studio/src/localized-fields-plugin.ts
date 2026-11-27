import type { TLocaleIsoCode } from '@shinefold/config/constants';
import { LOCALIZED_FIELD_TYPES } from '@shinefold/studio/localized-field-types';
import {
  internationalizedArray,
  type Language,
} from 'sanity-plugin-internationalized-array';

export const localizedFieldsPlugin = (
  languages: Language[],
  defaultLocale: TLocaleIsoCode,
) =>
  internationalizedArray({
    languages,
    defaultLanguages: [defaultLocale],
    // Otherwise opening a seeded document with an unset localized field drafts it.
    allowRemovingDefaultLanguages: true,
    fieldTypes: LOCALIZED_FIELD_TYPES,
  });
