import { type TOptionalNameLocalizedFieldOptions } from '@blog/studio/schema-types/fields/localized-field-options/localized-field-options';
import { defineField } from 'sanity';

export const localizedArticleTextField = (
  options: TOptionalNameLocalizedFieldOptions = {},
) =>
  defineField({
    name: 'content',
    title: 'Content',
    ...options,
    type: 'internationalizedArrayArticleText',
  });
