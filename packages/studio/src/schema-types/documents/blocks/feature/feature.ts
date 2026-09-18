import { FEATURE_ICONS } from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { toTitleCase } from '@blog/utils/primitives';
import { IdCard } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const featureBlockSchema = defineType({
  name: 'block_feature',
  title: 'Feature Card',
  type: 'document',
  description:
    'One feature — a heading, supporting text, and an icon or image — reusable across every Features module on the site.',
  icon: IdCard,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The heading shown on this feature card.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 3,
      description: 'Supporting copy shown beneath the heading.',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description:
        'Which icon shows when a Features module displays icons instead of images.',
      options: {
        layout: 'dropdown',
        list: FEATURE_ICONS.map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: imageWithAltSchema.name,
      description:
        'Shown when a Features module uses the Wide, Square, or Circle image shape.',
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'reference',
      description: 'Where this card links to, if anywhere.',
      to: [{ type: linkSchema.name }],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      linkLabel: 'link.label',
      media: 'image',
    },
    prepare({ title, linkLabel, media }) {
      return {
        title: String(title ?? 'Unknown'),
        subtitle: typeof linkLabel === 'string' ? linkLabel : 'No link',
        media,
      };
    },
  },
});
