import { type TOptionalNameLocalizedFieldOptions } from '@shinefold/studio/schema-types/fields/localized-field-options/localized-field-options';
import { defineField } from 'sanity';

export const localizedMultilineTextField = (
  options: TOptionalNameLocalizedFieldOptions = {},
) =>
  defineField({
    name: 'content',
    title: 'Content',
    ...options,
    type: 'internationalizedArrayText',
  });
