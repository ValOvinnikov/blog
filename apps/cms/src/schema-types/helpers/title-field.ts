import { defineField, type StringDefinition, type StringRule } from 'sanity';

type TTitleFieldOptions = Partial<
  Pick<StringDefinition, 'description' | 'initialValue' | 'readOnly'>
>;

/**
 * Reusable internal `title` field shared by every document type. Keep it
 * bare for singletons: a fixed `initialValue` + `readOnly: true` does NOT
 * fix the Studio "Untitled" heading — `initialValue` doesn't fire for a
 * singleton opened by `documentId`, and `readOnly` then leaves the field
 * permanently empty (stuck at "Untitled"). Singletons resolve their Studio
 * label via `preview.prepare` instead.
 */
export const titleField = (options: TTitleFieldOptions = {}) =>
  defineField({
    name: 'title',
    title: 'Title',
    type: 'string',
    description: 'The main title / headline for this document.',
    validation: (rule: StringRule) => rule.required(),
    ...options,
  });
