import { Megaphone } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { titleField } from '../helpers/title-field';
import { linkSchema } from '../objects/link';

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
        title: (title as string | undefined) ?? 'Call to Action',
        subtitle: subtitle as string | undefined,
      };
    },
  },
});
