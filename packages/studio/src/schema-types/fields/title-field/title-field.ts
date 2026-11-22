import { defineField, type StringDefinition, type StringRule } from 'sanity';

type TTitleFieldOptions = Partial<
  Pick<StringDefinition, 'description' | 'initialValue' | 'readOnly'>
>;

// Leave it bare on singletons: initialValue never fires for one opened by documentId, so readOnly leaves it stuck at "Untitled".
export const titleField = (options: TTitleFieldOptions = {}) =>
  defineField({
    name: 'title',
    title: 'Title',
    type: 'string',
    description:
      'Give this document a clear, descriptive title to help identify it in Studio. This title for internal use only',
    validation: (rule: StringRule) => rule.required(),
    ...options,
  });
