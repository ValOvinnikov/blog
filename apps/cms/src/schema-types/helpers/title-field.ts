import { defineField } from 'sanity';

/**
 * Reusable internal `title` field shared by every document type. Singletons
 * pass a fixed `initialValue` + `readOnly: true` so the Studio form heading
 * resolves to a real value instead of "Untitled"; content documents pass
 * `max` for an editable headline length cap.
 */
export const titleField = (options?: {
  initialValue?: string;
  readOnly?: boolean;
  description?: string;
  max?: number;
}) =>
  defineField({
    name: 'title',
    title: 'Title',
    type: 'string',
    description: options?.description,
    initialValue: options?.initialValue,
    readOnly: options?.readOnly ?? false,
    validation: (rule) =>
      options?.max ? rule.required().max(options.max) : rule.required(),
  });
