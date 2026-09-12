import { defineField, type StringDefinition, type StringRule } from 'sanity';

const TITLE_FIELD_DESCRIPTION =
  'Give this document a clear, descriptive title to help identify it in Studio. This title for internal use only';

const TITLE_FIELD_DESCRIPTION_GENERATES_SLUG =
  'Give this document a clear, descriptive title to help identify it in Studio. This title also is used to automatically generate the slug. This title for internal use only';

type TTitleFieldOptions = Partial<
  Pick<StringDefinition, 'description' | 'initialValue' | 'readOnly'>
> & {
  generatesSlug?: boolean;
};

/**
 * Reusable internal `title` field shared by every document type. Keep it
 * bare for singletons: a fixed `initialValue` + `readOnly: true` does NOT
 * fix the Studio "Untitled" heading — `initialValue` doesn't fire for a
 * singleton opened by `documentId`, and `readOnly` then leaves the field
 * permanently empty (stuck at "Untitled"). Singletons resolve their Studio
 * label via `preview.prepare` instead.
 */
export const titleField = ({
  generatesSlug = false,
  description,
  ...options
}: TTitleFieldOptions = {}) =>
  defineField({
    name: 'title',
    title: 'Title',
    type: 'string',
    description:
      description ??
      (generatesSlug
        ? TITLE_FIELD_DESCRIPTION_GENERATES_SLUG
        : TITLE_FIELD_DESCRIPTION),
    validation: (rule: StringRule) => rule.required(),
    ...options,
  });
