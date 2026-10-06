import type { ComponentType } from 'react';
import {
  defineField,
  type CustomValidator,
  type SlugIsUniqueValidator,
  type SlugInputProps,
  type SlugRule,
  type SlugValue,
} from 'sanity';

type TSlugFieldOptions = {
  description: string;
  previewInput?: ComponentType<SlugInputProps>;
  validateSlug?: CustomValidator<SlugValue | undefined>;
  isUnique?: SlugIsUniqueValidator;
};

export const slugField = ({
  description,
  previewInput,
  validateSlug,
  isUnique,
}: TSlugFieldOptions) =>
  defineField({
    name: 'slug',
    title: 'Slug',
    type: 'slug',
    description,
    options: {
      source: 'title',
      maxLength: 96,
      ...(isUnique ? { isUnique } : {}),
    },
    ...(previewInput ? { components: { input: previewInput } } : {}),
    validation: (rule: SlugRule) =>
      validateSlug ? rule.required().custom(validateSlug) : rule.required(),
  });
