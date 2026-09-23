import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { Building2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const logoBlockSchema = defineType({
  name: 'block_logo',
  title: 'Logo',
  type: 'document',
  description:
    'A partner or client mark — reusable across every Logo Wall module on the site.',
  icon: Building2,
  fields: [
    titleField(),
    defineField({
      name: 'image',
      title: 'Logo',
      type: imageWithAltSchema.name,
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
      title: 'title',
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
