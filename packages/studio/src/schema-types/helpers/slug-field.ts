import type { ComponentType } from 'react';
import {
  defineField,
  type CustomValidator,
  type SlugInputProps,
  type SlugRule,
  type SlugValue,
} from 'sanity';

type TSlugFieldOptions = {
  description: string;
  previewInput?: ComponentType<SlugInputProps>;
  validateSlug?: CustomValidator<SlugValue | undefined>;
};

/**
 * Shared `slug` field for every document that derives a URL path segment
 * from its title. `previewInput` wires in a routed URL-preview component
 * (`createSlugUrlPreviewInput`); `validateSlug` adds a document-specific
 * constraint (e.g. `page_generic`'s reserved-path check) on top of the
 * always-required base rule.
 */
export const slugField = ({
  description,
  previewInput,
  validateSlug,
}: TSlugFieldOptions) =>
  defineField({
    name: 'slug',
    title: 'Slug',
    type: 'slug',
    description,
    options: {
      source: 'title',
      maxLength: 96,
    },
    ...(previewInput ? { components: { input: previewInput } } : {}),
    validation: (rule: SlugRule) =>
      validateSlug ? rule.required().custom(validateSlug) : rule.required(),
  });
