import { type TLocalizedFieldOptions } from '@shinefold/studio/schema-types/fields/localized-field-options/localized-field-options';
import { defineField } from 'sanity';

export const localizedHeadingTextField = (options: TLocalizedFieldOptions) =>
  defineField({
    ...options,
    type: 'internationalizedArrayHeadingText',
  });
