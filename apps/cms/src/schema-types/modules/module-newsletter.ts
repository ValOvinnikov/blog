import { titleField } from '@cms/schema-types/helpers/title-field';
import { Mail } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const newsletterSchema = defineType({
  name: 'module_newsletter',
  title: 'Newsletter Signup',
  type: 'document',
  icon: Mail,
  fields: [
    titleField({ description: 'Internal label shown in the Studio.' }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description:
        'Signup heading shown in the rich boxed variant (footer / page-builder). Falls back to a default if left empty.',
      validation: (rule) => rule.max(80),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description:
        'Supporting copy shown under the heading. Falls back to a default if left empty.',
      validation: (rule) => rule.max(300),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle,
      };
    },
  },
});
