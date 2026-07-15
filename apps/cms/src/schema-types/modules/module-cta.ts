import { titleField } from '@cms/schema-types/helpers/title-field';
import { linkSchema } from '@cms/schema-types/objects/link';
import { Megaphone } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const ctaSchema = defineType({
  name: 'module_cta',
  title: 'Call to Action',
  type: 'document',
  icon: Megaphone,
  fields: [
    titleField(),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
    }),
    defineField({
      name: 'action',
      title: 'Action',
      type: linkSchema.name,
      validation: (rule) => rule.required(),
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
