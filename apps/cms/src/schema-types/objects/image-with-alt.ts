import { IMAGE_LAYOUT } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils';
import { defineField, defineType } from 'sanity';

export const imageWithAltSchema = defineType({
  name: 'imageWithAlt',
  title: 'Image with Alt Text',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative Text',
      type: 'string',
      description: 'Describe the image for screen readers and search engines.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      description:
        'How the image is positioned in body content. Leave unset to use the default (Inline).',
      options: {
        layout: 'radio',
        list: Object.values(IMAGE_LAYOUT).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
  ],
});
