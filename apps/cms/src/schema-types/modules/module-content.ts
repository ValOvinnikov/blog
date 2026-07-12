import { FileText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { titleField } from '../helpers/title-field';
import { richTextSchema } from '../objects/rich-text';

export const contentSchema = defineType({
  name: 'module_content',
  title: 'Content',
  type: 'document',
  icon: FileText,
  fields: [
    titleField(),
    defineField({
      name: 'body',
      title: 'Body',
      type: richTextSchema.name,
      description:
        'Page content — supports rich text, images, and code blocks.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: (title as string | undefined) ?? 'Content',
      };
    },
  },
});
