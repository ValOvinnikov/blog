import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { Link2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const linkRefSchema = defineType({
  name: 'linkRef',
  title: 'Link',
  type: 'object',
  description: 'Points at a reusable link document.',
  icon: Link2,
  fields: [
    defineField({
      name: 'link',
      title: 'Link',
      type: 'reference',
      description: 'The link document this points at.',
      to: [{ type: linkSchema.name }],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'link.title',
      label: 'link.label',
    },
    prepare({ title, label }) {
      return {
        title: String(title ?? label ?? 'No link selected'),
      };
    },
  },
});
