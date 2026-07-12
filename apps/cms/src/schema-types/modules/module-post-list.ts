import { MODULE_TYPE } from '@blog/config/constants';
import { List } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { titleField } from '../helpers/title-field';

export const postListSchema = defineType({
  name: MODULE_TYPE.POST_LIST,
  title: 'Post List',
  type: 'document',
  icon: List,
  fields: [
    titleField({ max: 120, description: 'Display heading for this list.' }),
    defineField({
      name: 'limit',
      title: 'Limit',
      type: 'number',
      description: 'Maximum number of posts to show.',
      validation: (rule) => rule.required().integer().min(1).max(12),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      limit: 'limit',
    },
    prepare({ title, limit }) {
      return {
        title: (title as string | undefined) ?? 'Post List',
        subtitle: limit ? `Limit: ${String(limit)}` : undefined,
      };
    },
  },
});
