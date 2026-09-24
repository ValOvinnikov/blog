import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { Building2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const logoItemSchema = defineType({
  name: 'logoItem',
  title: 'Logo',
  type: 'object',
  description: 'A partner or client mark shown in a Logo Wall.',
  icon: Building2,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description:
        "The company's name. Screen readers announce it in place of the logo; it is not shown on the page.",
      validation: (rule) => rule.required().error('Name the company.'),
    }),
    defineField({
      name: 'image',
      title: 'Logo',
      type: 'image',
      description:
        'SVG or PNG with a transparent background, trimmed to the mark. Shown at 36px tall.',
      validation: (rule) => rule.required().error('Upload the logo.'),
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'reference',
      description:
        'Optional. Makes the tile a link — their site, or the case study.',
      to: [{ type: linkSchema.name }],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
    prepare({ title, media }) {
      return {
        title: String(title ?? 'Unknown'),
        media: media ?? undefined,
      };
    },
  },
});
