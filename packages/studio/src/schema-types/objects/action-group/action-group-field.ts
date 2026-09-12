import { defineField } from 'sanity';

import { actionGroupSchema } from './action-group';

export const actionGroupField = (options: { title?: string } = {}) =>
  defineField({
    name: 'actions',
    title: options.title ?? 'Actions',
    type: actionGroupSchema.name,
  });
