import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { imageHotspotOptions } from '@blog/studio/schema-types/fields/image-alt-field/image-alt-field';
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
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description:
        "The company. Becomes the image's alt text and the link's accessible name.",
      validation: (rule) => rule.required().error('Name the company.'),
    }),
    defineField({
      name: 'image',
      title: 'Logo',
      type: 'image',
      description:
        'SVG or PNG with a transparent background, trimmed to the mark. Shown at 36px tall, as uploaded.',
      options: imageHotspotOptions,
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
      linkLabel: 'link.label',
      media: 'image',
    },
    prepare({ title, linkLabel, media }) {
      return {
        title: String(title ?? 'Unknown'),
        subtitle: typeof linkLabel === 'string' ? linkLabel : undefined,
        media: media ?? undefined,
      };
    },
  },
});
