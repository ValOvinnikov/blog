import { defineField, type StringDefinition, type StringRule } from 'sanity';

type TTitleFieldOptions = Partial<
  Pick<StringDefinition, 'description' | 'initialValue' | 'readOnly'>
>;

/**
 * Reusable internal `title` field shared by every document type. Singletons
 * pass a fixed `initialValue` + `readOnly: true` so the Studio form heading
 * resolves to a real value instead of "Untitled"; content documents pass
 * `max` for an editable headline length cap.
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
