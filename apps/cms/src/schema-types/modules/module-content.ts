import { FileText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'module_content',
  title: 'Content',
  type: 'object',
  icon: FileText,
  fields: [
    defineField({
      name: 'body',
      title: 'Body',
      type: 'portableText',
      description:
        'Page content — supports rich text, images, and code blocks.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Content',
      };
    },
  },
});
