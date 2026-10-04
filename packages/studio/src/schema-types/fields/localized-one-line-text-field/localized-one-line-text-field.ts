import { type TLocalizedFieldOptions } from '@blog/studio/schema-types/fields/localized-field-options/localized-field-options';
import { defineField } from 'sanity';

export const localizedOneLineTextField = (options: TLocalizedFieldOptions) =>
  defineField({
    ...options,
    type: 'internationalizedArrayString',
  });
