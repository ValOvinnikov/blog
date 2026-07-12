import { MODULE_TYPE } from '@blog/config/constants';
import { FileText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { titleField } from '../helpers/title-field';

export const contentSchema = defineType({
  name: MODULE_TYPE.CONTENT,
  title: 'Content',
  type: 'document',
  icon: FileText,
  fields: [
    titleField(),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'richText',
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
