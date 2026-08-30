import { actionGroupSchema } from '@blog/studio/schema-types/objects/blocks/action-group';
import { defineField } from 'sanity';

export const actionGroupField = (options: { title?: string } = {}) =>
  defineField({
    name: 'actions',
    title: options.title ?? 'Actions',
    type: actionGroupSchema.name,
  });
