import { List } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'module_postList',
  title: 'Post List',
  type: 'object',
  icon: List,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(40),
    }),
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
