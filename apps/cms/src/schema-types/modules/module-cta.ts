import { Megaphone } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export default defineType({
  name: 'module_cta',
  title: 'Call to Action',
  type: 'object',
  icon: Megaphone,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockText',
    }),
    defineField({
      name: 'actions',
      title: 'Actions',
      type: 'array',
      of: [defineArrayMember({ type: 'link' })],
    }),
  ],
  preview: {
    select: {
      title: 'heading',
    },
    prepare({ title }) {
      return {
        title: (title as string | undefined) ?? 'Call to Action',
      };
    },
  },
});
